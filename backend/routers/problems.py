from fastapi import APIRouter, Depends, HTTPException
from models import UserModel, ProblemModel
from schemas import ProblemCreate, ProblemUpdate, ProblemResponse, ReviewRequest
from auth import get_current_user
from database import get_db
from sm2 import run_sm2
from utils import to_date
from routers.github import sync_user_problems
from datetime import datetime, timedelta
from bson import ObjectId
from bson.errors import InvalidId

OUTCOMES = frozenset({"solved_solo", "used_hint", "checked_code"})

router = APIRouter(prefix="/problems", tags=["problems"])


async def _get_problem_or_404(db, problem_id: str, user_id: str):
    try:
        oid = ObjectId(problem_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Problem not found")
    doc = await db.problems.find_one({"_id": oid})
    if not doc or doc["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Problem not found")
    return doc


def doc_to_problem(doc: dict) -> ProblemModel:
    return ProblemModel(
        id=str(doc["_id"]), user_id=doc["user_id"], title=doc["title"],
        url=doc.get("url"), topic=doc["topic"], difficulty=doc["difficulty"],
        notes=doc.get("notes"), key_insight=doc.get("key_insight"),
        interval=doc["interval"], ease_factor=doc["ease_factor"],
        repetitions=doc["repetitions"], solo_streak=doc["solo_streak"],
        frozen=doc["frozen"], last_outcome=doc.get("last_outcome"),
        next_review_date=to_date(doc["next_review_date"]),
        date_added=to_date(doc["date_added"]),
    )


def problem_to_response(p: ProblemModel) -> ProblemResponse:
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
async def list_problems(
    current_user: UserModel = Depends(get_current_user),
):
    db = await get_db()
    cursor = db.problems.find({"user_id": current_user.id})
    problems = [doc_to_problem(doc) async for doc in cursor]
    return [problem_to_response(p) for p in problems]


@router.post("", response_model=ProblemResponse)
async def create_problem(
    data: ProblemCreate,
    current_user: UserModel = Depends(get_current_user),
):
    db = await get_db()
    now = datetime.utcnow()
    doc = {
        "user_id": current_user.id,
        "title": data.title,
        "url": data.url,
        "topic": data.topic,
        "difficulty": data.difficulty,
        "notes": data.notes,
        "key_insight": data.key_insight,
        "interval": 1,
        "ease_factor": 2.5,
        "repetitions": 0,
        "solo_streak": 0,
        "frozen": False,
        "last_outcome": None,
        "next_review_date": now + timedelta(days=1),
        "date_added": now,
    }
    result = await db.problems.insert_one(doc)
    doc["_id"] = result.inserted_id
    await sync_user_problems(db, current_user.id)
    return problem_to_response(doc_to_problem(doc))


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: str,
    current_user: UserModel = Depends(get_current_user),
):
    db = await get_db()
    doc = await _get_problem_or_404(db, problem_id, current_user.id)
    return problem_to_response(doc_to_problem(doc))


@router.put("/{problem_id}", response_model=ProblemResponse)
async def update_problem(
    problem_id: str,
    data: ProblemUpdate,
    current_user: UserModel = Depends(get_current_user),
):
    db = await get_db()
    doc = await _get_problem_or_404(db, problem_id, current_user.id)
    update_data = data.model_dump(exclude_unset=True)
    if "next_review_date" in update_data:
        update_data["next_review_date"] = datetime.combine(
            update_data["next_review_date"], datetime.min.time()
        )
    if update_data:
        await db.problems.update_one(
            {"_id": doc["_id"]},
            {"$set": update_data},
        )
    await sync_user_problems(db, current_user.id)
    updated = await db.problems.find_one({"_id": doc["_id"]})
    return problem_to_response(doc_to_problem(updated))


@router.delete("/{problem_id}")
async def delete_problem(
    problem_id: str,
    current_user: UserModel = Depends(get_current_user),
):
    db = await get_db()
    doc = await _get_problem_or_404(db, problem_id, current_user.id)
    await db.problems.delete_one({"_id": doc["_id"]})
    await sync_user_problems(db, current_user.id)
    return {"ok": True}


@router.post("/{problem_id}/review", response_model=ProblemResponse)
async def review_problem(
    problem_id: str,
    data: ReviewRequest,
    current_user: UserModel = Depends(get_current_user),
):
    if data.outcome not in OUTCOMES:
        raise HTTPException(status_code=400, detail="Invalid outcome")
    db = await get_db()
    doc = await _get_problem_or_404(db, problem_id, current_user.id)
    problem = doc_to_problem(doc)
    result = run_sm2(problem, data.outcome)
    await db.problems.update_one(
        {"_id": doc["_id"]},
        {"$set": result},
    )
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    existing = await db.review_history.find_one(
        {"user_id": current_user.id, "date": {"$gte": today_start, "$lt": today_end}},
    )
    if existing:
        await db.review_history.update_one(
            {"_id": existing["_id"]},
            {"$inc": {"review_count": 1}},
        )
    else:
        await db.review_history.insert_one({
            "user_id": current_user.id,
            "date": today_start,
            "review_count": 1,
        })
    updated = await db.problems.find_one({"_id": doc["_id"]})
    return problem_to_response(doc_to_problem(updated))
