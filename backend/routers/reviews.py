from fastapi import APIRouter, Depends
from models import UserModel
from schemas import ReviewHistoryEntry, StatsResponse
from auth import get_current_user
from database import get_db
from utils import to_date, ist_today, ist_today_start
from datetime import timedelta

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/history", response_model=list[ReviewHistoryEntry])
async def get_history(
    current_user: UserModel = Depends(get_current_user),
    days: int = 30,
):
    db = await get_db()
    since = ist_today_start() - timedelta(days=days)
    cursor = db.review_history.find(
        {"user_id": current_user.id, "date": {"$gte": since}},
    ).sort("date", 1)
    entries = []
    async for doc in cursor:
        entries.append(ReviewHistoryEntry(date=to_date(doc["date"]), count=doc["review_count"]))
    return entries


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    current_user: UserModel = Depends(get_current_user),
):
    db = await get_db()
    problems = []
    cursor = db.problems.find({"user_id": current_user.id})
    async for doc in cursor:
        problems.append(doc)
    total = len(problems)
    frozen = sum(1 for p in problems if p.get("frozen"))
    mastered = sum(1 for p in problems if p.get("repetitions", 0) >= 3 and not p.get("frozen"))

    by_topic = {}
    by_outcome = {}
    for p in problems:
        topic = p.get("topic", "Unknown")
        by_topic[topic] = by_topic.get(topic, 0) + 1
        outcome = p.get("last_outcome")
        if outcome:
            by_outcome[outcome] = by_outcome.get(outcome, 0) + 1

    history_entries = []
    cursor = db.review_history.find(
        {"user_id": current_user.id},
    ).sort("date", -1)
    async for doc in cursor:
        doc["_dt"] = to_date(doc["date"])
        history_entries.append(doc)

    current_streak = 0
    streak_count = 0
    prev_date = None
    today = ist_today()
    for entry in history_entries:
        d = entry["_dt"]
        if prev_date is None:
            if d == today or d == today - timedelta(days=1):
                streak_count = 1
                prev_date = d
        else:
            diff = (prev_date - d).days
            if diff == 0:
                continue
            elif diff == 1:
                streak_count += 1
                prev_date = d
            else:
                break
    current_streak = streak_count

    longest_streak = 0
    streak_count = 0
    prev_date = None
    for entry in history_entries:
        d = entry["_dt"]
        if prev_date is None:
            streak_count = 1
            prev_date = d
        else:
            diff = (prev_date - d).days
            if diff == 0:
                continue
            elif diff == 1:
                streak_count += 1
                prev_date = d
            else:
                longest_streak = max(longest_streak, streak_count)
                streak_count = 1
                prev_date = d
    longest_streak = max(longest_streak, streak_count)

    return StatsResponse(
        total=total,
        frozen=frozen,
        mastered=mastered,
        by_topic=by_topic,
        by_outcome=by_outcome,
        streak={"current": current_streak, "longest": longest_streak},
    )
