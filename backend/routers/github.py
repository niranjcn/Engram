from fastapi import APIRouter, Depends, HTTPException
from models import UserModel
from auth import get_current_user
from crypto import decrypt_token
from database import get_db
from bson import ObjectId
import httpx
import json
import base64

router = APIRouter(prefix="/github", tags=["github"])


def _gh_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Accept": "application/json"}


async def _get_sha(client, owner: str, repo: str, path: str, token: str) -> str | None:
    resp = await client.get(
        f"https://api.github.com/repos/{owner}/{repo}/contents/{path}",
        headers=_gh_headers(token),
    )
    if resp.status_code == 200:
        return resp.json()["sha"]
    return None


async def _push_file(client, owner: str, repo: str, path: str, content: str, token: str, message: str):
    sha = await _get_sha(client, owner, repo, path, token)
    body = {
        "message": message,
        "content": base64.b64encode(content.encode()).decode(),
    }
    if sha:
        body["sha"] = sha
    resp = await client.put(
        f"https://api.github.com/repos/{owner}/{repo}/contents/{path}",
        json=body,
        headers=_gh_headers(token),
    )
    return resp.status_code in (201, 200)


@router.post("/setup-repo")
async def setup_repo(current_user: UserModel = Depends(get_current_user)):
    if not current_user.github_token_encrypted or not current_user.github_username:
        raise HTTPException(status_code=400, detail="GitHub not connected. Connect via Settings first.")

    token = decrypt_token(current_user.github_token_encrypted)
    repo_name = f"engram-{current_user.github_username}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.github.com/user/repos",
            json={
                "name": repo_name,
                "description": "DSA problems synced from Engram",
                "private": True,
                "auto_init": True,
            },
            headers=_gh_headers(token),
        )

    if resp.status_code == 422:
        raise HTTPException(status_code=400, detail="Repository name may be invalid or already exists")
    if resp.status_code != 201:
        raise HTTPException(status_code=502, detail="Failed to create GitHub repository")

    db = await get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"github_repo": repo_name}},
    )

    return {"repo": repo_name, "url": resp.json()["html_url"]}


@router.post("/sync")
async def sync(current_user: UserModel = Depends(get_current_user)):
    if not current_user.github_token_encrypted or not current_user.github_username:
        raise HTTPException(status_code=400, detail="GitHub not connected. Connect via Settings first.")
    if not current_user.github_repo:
        raise HTTPException(status_code=400, detail="GitHub repo not set up. Run setup-repo first.")

    token = decrypt_token(current_user.github_token_encrypted)
    owner = current_user.github_username
    repo = current_user.github_repo

    db = await get_db()
    cursor = db.problems.find({"user_id": current_user.id})
    problems = await cursor.to_list(length=None)

    problems_json = json.dumps([{
        "title": p["title"],
        "url": p.get("url"),
        "topic": p["topic"],
        "difficulty": p["difficulty"],
        "notes": p.get("notes"),
        "key_insight": p.get("key_insight"),
        "interval": p["interval"],
        "ease_factor": p["ease_factor"],
        "repetitions": p["repetitions"],
        "solo_streak": p["solo_streak"],
        "frozen": p.get("frozen", False),
        "last_outcome": p.get("last_outcome"),
        "next_review_date": str(p["next_review_date"]),
        "date_added": str(p["date_added"]),
    } for p in problems], indent=2)

    md_lines = [
        "# DSA Problems",
        "",
        f"Total: **{len(problems)}** problems",
        "",
        "| # | Title | Topic | Difficulty | Notes |",
        "|---|-------|-------|------------|-------|",
    ]
    for i, p in enumerate(problems, 1):
        title = p["title"]
        topic = p["topic"]
        diff = p["difficulty"]
        notes = (p.get("notes") or "")[:60]
        md_lines.append(f"| {i} | {title} | {topic} | {diff} | {notes} |")
    problems_md = "\n".join(md_lines)

    async with httpx.AsyncClient() as client:
        ok1 = await _push_file(client, owner, repo, "problems.json", problems_json, token, "Sync problems from Engram")
        ok2 = await _push_file(client, owner, repo, "PROBLEMS.md", problems_md, token, "Sync problem list from Engram")

    if not ok1 or not ok2:
        raise HTTPException(status_code=502, detail="Failed to push files to GitHub")

    return {"ok": True, "files": ["problems.json", "PROBLEMS.md"]}
