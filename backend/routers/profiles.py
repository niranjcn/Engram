import re
from fastapi import APIRouter, HTTPException, Query
from schemas import PublicUserResponse, PublicProblemResponse, ReviewHistoryEntry
from database import get_db
from utils import to_date, ist_today, ist_today_start
from datetime import timedelta

router = APIRouter(prefix="/profiles", tags=["profiles"])

PUBLIC_FILTER = {
    "$or": [{"profile_public": True}, {"profile_public": {"$exists": False}}],
    "role": {"$ne": "admin"},
}


@router.get("", response_model=list[PublicUserResponse])
async def list_profiles(q: str = Query("", max_length=50)):
    db = await get_db()
    query = dict(PUBLIC_FILTER)
    if q:
        escaped = re.escape(q)
        query["username"] = {"$regex": escaped, "$options": "i"}

    users = await db.users.find(query).sort("username", 1).to_list(None)

    user_ids = [str(u["_id"]) for u in users]
    pipeline = [
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
    ]
    count_rows = await db.problems.aggregate(pipeline).to_list(None)
    count_map = {r["_id"]: r["count"] for r in count_rows}

    result = []
    for u in users:
        uid = str(u["_id"])
        result.append(PublicUserResponse(
            id=uid,
            username=u["username"],
            created_at=u["created_at"],
            total_solved=count_map.get(uid, 0),
        ))
    return result


@router.get("/{username}", response_model=PublicUserResponse)
async def get_profile(username: str):
    db = await get_db()
    user = await db.users.find_one({"username": username, **PUBLIC_FILTER})
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")

    uid = str(user["_id"])
    total = await db.problems.count_documents({"user_id": uid})
    mastered = await db.problems.count_documents(
        {"user_id": uid, "repetitions": {"$gte": 3}, "frozen": {"$ne": True}}
    )

    history_entries = []
    cursor = db.review_history.find({"user_id": uid}).sort("date", -1)
    async for doc in cursor:
        history_entries.append(doc)

    current_streak = 0
    streak_count = 0
    prev_date = None
    today = ist_today()
    for entry in history_entries:
        d = to_date(entry["date"])
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
        d = to_date(entry["date"])
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

    return PublicUserResponse(
        id=uid,
        username=user["username"],
        created_at=user["created_at"],
        total_solved=total,
        mastered=mastered,
        current_streak=current_streak,
        longest_streak=longest_streak,
    )


@router.get("/{username}/history", response_model=list[ReviewHistoryEntry])
async def get_profile_history(username: str, days: int = 365):
    db = await get_db()
    user = await db.users.find_one({"username": username, **PUBLIC_FILTER})
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")

    since = ist_today_start() - timedelta(days=days)
    cursor = db.review_history.find(
        {"user_id": str(user["_id"]), "date": {"$gte": since}},
    ).sort("date", 1)
    entries = []
    async for doc in cursor:
        entries.append(ReviewHistoryEntry(date=to_date(doc["date"]), count=doc["review_count"]))
    return entries


@router.get("/{username}/problems", response_model=list[PublicProblemResponse])
async def get_profile_problems(username: str):
    db = await get_db()
    user = await db.users.find_one({"username": username, **PUBLIC_FILTER})
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")

    cursor = db.problems.find({"user_id": str(user["_id"])}).sort("date_added", -1)
    result = []
    async for doc in cursor:
        result.append(PublicProblemResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            url=doc.get("url"),
            topic=doc["topic"],
            difficulty=doc["difficulty"],
            last_outcome=doc.get("last_outcome"),
            date_added=to_date(doc["date_added"]),
        ))
    return result
