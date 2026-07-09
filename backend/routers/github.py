from fastapi import APIRouter, Depends, HTTPException
from models import UserModel
from auth import get_current_user
from crypto import decrypt_token
from database import get_db
from bson import ObjectId
import httpx

router = APIRouter(prefix="/github", tags=["github"])


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
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
            },
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
