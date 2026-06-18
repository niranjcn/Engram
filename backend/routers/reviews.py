from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func, desc
from models import User, Problem, ReviewHistory
from schemas import ReviewHistoryEntry, StatsResponse
from auth import get_current_user
from database import get_session
from datetime import date, timedelta

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.get("/history", response_model=list[ReviewHistoryEntry])
def get_history(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    thirty_days_ago = date.today() - timedelta(days=30)
    entries = session.exec(
        select(ReviewHistory).where(
            ReviewHistory.user_id == current_user.id,
            ReviewHistory.date >= thirty_days_ago,
        ).order_by(ReviewHistory.date)
    ).all()
    return [ReviewHistoryEntry(date=e.date, count=e.count) for e in entries]

@router.get("/stats", response_model=StatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    problems = session.exec(
        select(Problem).where(Problem.user_id == current_user.id)
    ).all()
    total = len(problems)
    frozen = sum(1 for p in problems if p.frozen)
    mastered = sum(1 for p in problems if p.repetitions >= 3 and not p.frozen)

    by_topic = {}
    by_outcome = {}
    for p in problems:
        by_topic[p.topic] = by_topic.get(p.topic, 0) + 1
        if p.last_outcome:
            by_outcome[p.last_outcome] = by_outcome.get(p.last_outcome, 0) + 1

    history_entries = session.exec(
        select(ReviewHistory).where(
            ReviewHistory.user_id == current_user.id,
        ).order_by(desc(ReviewHistory.date))
    ).all()

    current_streak = 0
    longest_streak = 0
    streak_count = 0
    prev_date = None
    for entry in history_entries:
        if prev_date is None:
            if entry.date == date.today() or entry.date == date.today() - timedelta(days=1):
                streak_count = 1
                prev_date = entry.date
        else:
            if (prev_date - entry.date).days == 1:
                streak_count += 1
                prev_date = entry.date
            else:
                break

    current_streak = streak_count

    streak_count = 0
    prev_date = None
    for entry in history_entries:
        if prev_date is None:
            streak_count = 1
            prev_date = entry.date
        else:
            if (prev_date - entry.date).days == 1:
                streak_count += 1
                prev_date = entry.date
            else:
                longest_streak = max(longest_streak, streak_count)
                streak_count = 1
                prev_date = entry.date
    longest_streak = max(longest_streak, streak_count)

    return StatsResponse(
        total=total,
        frozen=frozen,
        mastered=mastered,
        by_topic=by_topic,
        by_outcome=by_outcome,
        streak={"current": current_streak, "longest": longest_streak},
    )
