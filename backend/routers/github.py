from fastapi import APIRouter, Depends, HTTPException
from models import UserModel
from auth import get_current_user
from crypto import decrypt_token
from database import get_db
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import httpx
import base64
import re

router = APIRouter(prefix="/github", tags=["github"])

_EXTENSIONS = {
    "python": ".py",
    "javascript": ".js",
    "java": ".java",
    "cpp": ".cpp",
    "other": ".txt",
}


def _gh_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Accept": "application/json"}


def _sanitize_filename(title: str) -> str:
    name = re.sub(r'[^\w\s-]', '', title).strip()
    name = re.sub(r'[-\s]+', '_', name)
    return name


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
    return resp.status_code in (201, 200), resp


async def sync_user_problems(db: AsyncIOMotorDatabase, user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return
    encrypted_token = user.get("github_token_encrypted")
    github_username = user.get("github_username")
    github_repo = user.get("github_repo")
    sync_language = user.get("sync_language", "python")
    if not encrypted_token or not github_username or not github_repo:
        return

    token = decrypt_token(encrypted_token)
    owner = github_username
    repo = github_repo
    ext = _EXTENSIONS.get(sync_language, ".txt")

    cursor = db.problems.find({"user_id": user_id})
    problems = await cursor.to_list(length=None)

    synced_files = []

    async with httpx.AsyncClient() as client:
        for p in problems:
            code = (p.get("notes") or "").strip()
            if not code:
                continue
            filename = _sanitize_filename(p["title"]) + ext
            ok, _ = await _push_file(
                client, owner, repo,
                filename, code, token,
                f"Add {p['title']}",
            )
            if ok:
                synced_files.append(filename)

        md_lines = [
            "# LeetCode Solutions",
            "",
            f"Total: **{len(problems)}** problems",
            "",
            "| # | Title | Topic | Difficulty | File |",
            "|---|-------|-------|------------|------|",
        ]
        for i, p in enumerate(problems, 1):
            title = p["title"]
            topic = p["topic"]
            diff = p["difficulty"]
            fname = _sanitize_filename(title) + ext
            is_code = bool((p.get("notes") or "").strip())
            file_link = f"[{fname}]({fname})" if is_code else "-"
            md_lines.append(f"| {i} | {title} | {topic} | {diff} | {file_link} |")
        problems_md = "\n".join(md_lines)

        ok, _ = await _push_file(client, owner, repo, "README.md", problems_md, token, "Update solution list")
        if ok:
            synced_files.append("README.md")

    return synced_files


@router.post("/setup-repo")
async def setup_repo(current_user: UserModel = Depends(get_current_user)):
    if not current_user.github_token_encrypted or not current_user.github_username:
        raise HTTPException(status_code=400, detail="GitHub not connected. Connect via Settings first.")

    token = decrypt_token(current_user.github_token_encrypted)
    repo_name = "LeetCode"
    owner = current_user.github_username

    async with httpx.AsyncClient() as client:
        # check if repo already exists
        check = await client.get(
            f"https://api.github.com/repos/{owner}/{repo_name}",
            headers=_gh_headers(token),
        )

        if check.status_code == 200:
            repo_url = check.json()["html_url"]
        elif check.status_code == 404:
            # create it
            resp = await client.post(
                "https://api.github.com/user/repos",
                json={
                    "name": repo_name,
                    "description": "LeetCode solutions synced from Engram",
                    "private": False,
                    "auto_init": True,
                },
                headers=_gh_headers(token),
            )
            if resp.status_code == 422:
                raise HTTPException(status_code=400, detail="Repository name may be invalid or already exists")
            if resp.status_code != 201:
                raise HTTPException(status_code=502, detail="Failed to create GitHub repository")
            repo_url = resp.json()["html_url"]
        else:
            raise HTTPException(status_code=502, detail="Failed to check or create repository")

    db = await get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"github_repo": repo_name}},
    )

    return {"repo": repo_name, "url": repo_url}


@router.post("/sync")
async def sync(current_user: UserModel = Depends(get_current_user)):
    if not current_user.github_token_encrypted or not current_user.github_username:
        raise HTTPException(status_code=400, detail="GitHub not connected. Connect via Settings first.")
    if not current_user.github_repo:
        raise HTTPException(status_code=400, detail="GitHub repo not set up. Run setup-repo first.")

    db = await get_db()
    files = await sync_user_problems(db, current_user.id)
    return {"ok": True, "files": files}


@router.post("/disconnect")
async def disconnect(current_user: UserModel = Depends(get_current_user)):
    db = await get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$unset": {
            "github_token_encrypted": "",
            "github_username": "",
            "github_repo": "",
        }},
    )
    return {"ok": True}
