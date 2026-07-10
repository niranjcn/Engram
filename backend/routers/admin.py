from fastapi import APIRouter, Depends, HTTPException
from models import UserModel
from auth import get_current_user, require_admin
from database import get_db
from schemas import ReviewHistoryEntry
from utils import to_date
from datetime import datetime, timedelta
from bson import ObjectId
from bson.errors import InvalidId
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])


class RoleUpdateRequest(BaseModel):
    role: str


def _compute_streaks(history_entries):
    sorted_entries = sorted(history_entries, key=lambda e: e["_dt"], reverse=True)
    current_streak = 0
    streak_count = 0
    prev_date = None
    today = to_date(datetime.utcnow())
    for entry in sorted_entries:
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
    for entry in sorted_entries:
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
    return {"current": current_streak, "longest": longest_streak}


@router.get("/dashboard")
async def admin_dashboard(
    current_user: UserModel = Depends(require_admin),
):
    db = await get_db()
    total_users = await db.users.count_documents({})
    total_problems = await db.problems.count_documents({})

    review_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$review_count"}}}
    ]
    review_result = await db.review_history.aggregate(review_pipeline).to_list(None)
    total_reviews = review_result[0]["total"] if review_result else 0

    difficulty_pipeline = [
        {"$group": {"_id": "$difficulty", "count": {"$sum": 1}}}
    ]
    diff_results = await db.problems.aggregate(difficulty_pipeline).to_list(None)
    by_difficulty = {r["_id"]: r["count"] for r in diff_results}

    topic_pipeline = [
        {"$group": {"_id": "$topic", "count": {"$sum": 1}}}
    ]
    topic_results = await db.problems.aggregate(topic_pipeline).to_list(None)
    by_topic = {r["_id"]: r["count"] for r in topic_results}

    user_docs = await db.users.find({}).to_list(None)
    for u in user_docs:
        u["id"] = str(u.pop("_id"))

    all_streaks = []
    for u in user_docs:
        history = []
        cursor = db.review_history.find({"user_id": u["id"]}).sort("date", -1)
        async for doc in cursor:
            doc["_dt"] = to_date(doc["date"])
            history.append(doc)
        if history:
            streaks = _compute_streaks(history)
            all_streaks.append(streaks["current"])

    avg_streak = round(sum(all_streaks) / len(all_streaks), 1) if all_streaks else 0
    top_streak = max(all_streaks) if all_streaks else 0

    registrations_pipeline = [
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    reg_results = await db.users.aggregate(registrations_pipeline).to_list(None)
    registrations = [{"month": r["_id"], "count": r["count"]} for r in reg_results]

    return {
        "total_users": total_users,
        "total_problems": total_problems,
        "total_reviews": total_reviews,
        "avg_streak": avg_streak,
        "top_streak": top_streak,
        "by_difficulty": by_difficulty,
        "by_topic": by_topic,
        "registrations": registrations,
    }


@router.get("/users")
async def admin_list_users(
    current_user: UserModel = Depends(require_admin),
):
    db = await get_db()
    user_docs = await db.users.find({}).sort("created_at", -1).to_list(None)
    results = []
    for u in user_docs:
        uid = str(u["_id"])
        problem_count = await db.problems.count_documents({"user_id": uid})

        history = []
        cursor = db.review_history.find({"user_id": uid}).sort("date", -1)
        async for doc in cursor:
            doc["_dt"] = to_date(doc["date"])
            history.append(doc)
        streaks = _compute_streaks(history) if history else {"current": 0, "longest": 0}

        problem_cursor = db.problems.find({"user_id": uid})
        mastered = 0
        frozen = 0
        learning = 0
        reviewing = 0
        async for p in problem_cursor:
            if p.get("frozen"):
                frozen += 1
            elif p.get("repetitions", 0) >= 3:
                mastered += 1
            elif p.get("interval", 0) <= 1:
                learning += 1
            else:
                reviewing += 1

        results.append({
            "id": uid,
            "email": u["email"],
            "username": u["username"],
            "role": u.get("role", "user"),
            "created_at": u["created_at"].isoformat() if hasattr(u["created_at"], "isoformat") else str(u["created_at"]),
            "problem_count": problem_count,
            "streak": streaks,
            "mastered": mastered,
            "frozen": frozen,
            "learning": learning,
            "reviewing": reviewing,
        })
    return results


@router.get("/users/{user_id}")
async def admin_get_user(
    user_id: str,
    current_user: UserModel = Depends(require_admin),
):
    db = await get_db()
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="User not found")
    doc = await db.users.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    uid = str(doc["_id"])

    problem_count = await db.problems.count_documents({"user_id": uid})

    history = []
    cursor = db.review_history.find({"user_id": uid}).sort("date", -1)
    async for doc_h in cursor:
        doc_h["_dt"] = to_date(doc_h["date"])
        history.append(doc_h)
    streaks = _compute_streaks(history) if history else {"current": 0, "longest": 0}

    problem_cursor = db.problems.find({"user_id": uid})
    mastered = frozen = learning = reviewing = 0
    async for p in problem_cursor:
        if p.get("frozen"):
            frozen += 1
        elif p.get("repetitions", 0) >= 3:
            mastered += 1
        elif p.get("interval", 0) <= 1:
            learning += 1
        else:
            reviewing += 1

    return {
        "id": uid,
        "email": doc["email"],
        "username": doc["username"],
        "role": doc.get("role", "user"),
        "created_at": doc["created_at"].isoformat() if hasattr(doc["created_at"], "isoformat") else str(doc["created_at"]),
        "problem_count": problem_count,
        "streak": streaks,
        "mastered": mastered,
        "frozen": frozen,
        "learning": learning,
        "reviewing": reviewing,
    }


@router.get("/users/{user_id}/activity", response_model=list[ReviewHistoryEntry])
async def admin_get_user_activity(
    user_id: str,
    current_user: UserModel = Depends(require_admin),
    days: int = 365,
):
    db = await get_db()
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="User not found")
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    cutoff = datetime.utcnow() - timedelta(days=days)
    cursor = db.review_history.find(
        {"user_id": user_id, "date": {"$gte": cutoff}},
    ).sort("date", 1)
    return [ReviewHistoryEntry(date=to_date(doc["date"]), count=doc["review_count"]) async for doc in cursor]


@router.get("/users/{user_id}/problems")
async def admin_get_user_problems(
    user_id: str,
    current_user: UserModel = Depends(require_admin),
):
    db = await get_db()
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="User not found")
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    cursor = db.problems.find({"user_id": user_id}).sort("date_added", -1)
    problems = []
    async for doc in cursor:
        problems.append({
            "id": str(doc["_id"]),
            "title": doc["title"],
            "url": doc.get("url"),
            "topic": doc["topic"],
            "difficulty": doc["difficulty"],
            "notes": doc.get("notes"),
            "key_insight": doc.get("key_insight"),
            "interval": doc["interval"],
            "ease_factor": doc["ease_factor"],
            "repetitions": doc["repetitions"],
            "solo_streak": doc["solo_streak"],
            "frozen": doc["frozen"],
            "last_outcome": doc.get("last_outcome"),
            "next_review_date": to_date(doc["next_review_date"]).isoformat(),
            "date_added": to_date(doc["date_added"]).isoformat(),
        })
    return problems


@router.patch("/users/{user_id}/role")
async def admin_update_role(
    user_id: str,
    data: RoleUpdateRequest,
    current_user: UserModel = Depends(require_admin),
):
    if data.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'user'")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    db = await get_db()
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="User not found")
    result = await db.users.update_one({"_id": oid}, {"$set": {"role": data.role}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    current_user: UserModel = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db = await get_db()
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="User not found")
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.problems.delete_many({"user_id": user_id})
    await db.review_history.delete_many({"user_id": user_id})
    await db.users.delete_one({"_id": oid})
    return {"ok": True}
