from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models import User, Problem, ReviewHistory
from schemas import ProblemCreate, ProblemUpdate, ProblemResponse, ReviewRequest
from auth import get_current_user
from database import get_session
from sm2 import run_sm2
from datetime import date, timedelta

router = APIRouter(prefix="/problems", tags=["problems"])

def problem_to_response(p: Problem) -> ProblemResponse:
    return ProblemResponse(
        id=p.id, user_id=p.user_id, title=p.title, url=p.url,
        topic=p.topic, difficulty=p.difficulty, notes=p.notes,
        key_insight=p.key_insight, interval=p.interval,
        ease_factor=p.ease_factor, repetitions=p.repetitions,
        solo_streak=p.solo_streak, frozen=p.frozen,
        last_outcome=p.last_outcome, next_review_date=p.next_review_date,
        date_added=p.date_added,
    )

@router.get("", response_model=list[ProblemResponse])
def list_problems(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    problems = session.exec(
        select(Problem).where(Problem.user_id == current_user.id)
    ).all()
    return [problem_to_response(p) for p in problems]

@router.post("", response_model=ProblemResponse)
def create_problem(
    data: ProblemCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    problem = Problem(
        user_id=current_user.id,
        title=data.title,
        url=data.url,
        topic=data.topic,
        difficulty=data.difficulty,
        notes=data.notes,
        key_insight=data.key_insight,
        next_review_date=date.today() + timedelta(days=1),
    )
    session.add(problem)
    session.commit()
    session.refresh(problem)
    return problem_to_response(problem)

@router.get("/{problem_id}", response_model=ProblemResponse)
def get_problem(
    problem_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    problem = session.get(Problem, problem_id)
    if not problem or problem.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem_to_response(problem)

@router.put("/{problem_id}", response_model=ProblemResponse)
def update_problem(
    problem_id: int,
    data: ProblemUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    problem = session.get(Problem, problem_id)
    if not problem or problem.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Problem not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(problem, key, value)
    session.add(problem)
    session.commit()
    session.refresh(problem)
    return problem_to_response(problem)

@router.delete("/{problem_id}")
def delete_problem(
    problem_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    problem = session.get(Problem, problem_id)
    if not problem or problem.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Problem not found")
    session.delete(problem)
    session.commit()
    return {"ok": True}

@router.post("/{problem_id}/review", response_model=ProblemResponse)
def review_problem(
    problem_id: int,
    data: ReviewRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if data.outcome not in ("solved_solo", "used_hint", "checked_code"):
        raise HTTPException(status_code=400, detail="Invalid outcome")
    problem = session.get(Problem, problem_id)
    if not problem or problem.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Problem not found")
    result = run_sm2(problem, data.outcome)
    problem.interval = result["interval"]
    problem.ease_factor = result["ease_factor"]
    problem.repetitions = result["repetitions"]
    problem.solo_streak = result["solo_streak"]
    problem.frozen = result["frozen"]
    problem.last_outcome = result["last_outcome"]
    problem.next_review_date = result["next_review_date"]
    session.add(problem)

    today = date.today()
    existing = session.exec(
        select(ReviewHistory).where(
            ReviewHistory.user_id == current_user.id,
            ReviewHistory.date == today,
        )
    ).first()
    if existing:
        existing.count += 1
        session.add(existing)
    else:
        session.add(ReviewHistory(user_id=current_user.id, date=today, count=1))
    session.commit()
    session.refresh(problem)
    return problem_to_response(problem)
