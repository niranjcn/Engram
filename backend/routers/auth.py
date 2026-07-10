from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from models import UserModel
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse, GitHubAuthRequest, GitHubLanguageRequest, ProfilePublicUpdate
from auth import hash_password, verify_password, create_access_token, get_current_user, COOKIE_NAME
from database import get_db
from crypto import encrypt_token
from bson import ObjectId
import os
import httpx
import secrets
import time

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_MAX_AGE = 7 * 24 * 60 * 60

_oauth_states: dict[str, float] = {}


def _cookie_secure() -> bool:
    origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    for o in origins.split(","):
        o = o.strip()
        if "://localhost" not in o and "://127.0.0.1" not in o:
            return True
    return False


def _set_token_cookie(response: Response, token: str):
    secure = _cookie_secure()
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=secure,
        samesite="none" if secure else "lax",
        path="/",
    )


@router.post("/register")
async def register(data: RegisterRequest, response: Response):
    db = await get_db()
    existing = await db.users.find_one(
        {"$or": [{"email": data.email}, {"username": data.username}]}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Registration failed")
    result = await db.users.insert_one({
        "email": data.email,
        "username": data.username,
        "password_hash": hash_password(data.password),
        "role": "user",
        "created_at": datetime.utcnow(),
    })
    token = create_access_token({"sub": str(result.inserted_id)})
    _set_token_cookie(response, token)
    return {"ok": True}


@router.post("/login")
async def login(data: LoginRequest, response: Response):
    db = await get_db()
    doc = await db.users.find_one({"email": data.email})
    if not doc or not verify_password(data.password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(doc["_id"])})
    _set_token_cookie(response, token)
    return {"ok": True}


@router.post("/logout")
async def logout(response: Response):
    secure = _cookie_secure()
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        secure=secure,
        httponly=True,
        samesite="none" if secure else "lax",
    )
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
async def me(current_user: UserModel = Depends(get_current_user)):
    db = await get_db()
    doc = await db.users.find_one({"_id": ObjectId(current_user.id)})
    profile_public = doc.get("profile_public", True) if doc else True
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        created_at=current_user.created_at,
        github_username=current_user.github_username,
        github_repo=current_user.github_repo,
        sync_language=current_user.sync_language,
        profile_public=profile_public,
    )


@router.patch("/me/profile-visibility")
async def update_profile_visibility(data: ProfilePublicUpdate, current_user: UserModel = Depends(get_current_user)):
    db = await get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"profile_public": data.profile_public}},
    )
    return {"ok": True}


@router.get("/github/config")
async def github_config():
    client_id = os.getenv("GITHUB_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=400, detail="GitHub OAuth not configured")

    # cleanup expired states (>10 min)
    now = time.time()
    expired = [s for s, t in _oauth_states.items() if now - t > 600]
    for s in expired:
        del _oauth_states[s]

    state = secrets.token_urlsafe(32)
    _oauth_states[state] = now
    return {"client_id": client_id, "state": state}


@router.post("/github/language")
async def github_set_language(data: GitHubLanguageRequest, current_user: UserModel = Depends(get_current_user)):
    VALID = frozenset({"python", "javascript", "java", "cpp", "other"})
    if data.language not in VALID:
        raise HTTPException(status_code=400, detail="Invalid language")
    db = await get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"sync_language": data.language}},
    )
    return {"ok": True}


@router.post("/github")
async def github_auth(data: GitHubAuthRequest, current_user: UserModel = Depends(get_current_user)):
    if data.state not in _oauth_states:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    del _oauth_states[data.state]

    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=400, detail="GitHub OAuth not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={"client_id": client_id, "client_secret": client_secret, "code": data.code},
            headers={"Accept": "application/json"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="GitHub OAuth token exchange failed")
        body = resp.json()
        if "error" in body or "access_token" not in body:
            raise HTTPException(status_code=400, detail=body.get("error_description", "GitHub OAuth failed"))

        access_token = body["access_token"]

        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to fetch GitHub user")
        github_user = user_resp.json()

    db = await get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "github_token_encrypted": encrypt_token(access_token),
            "github_username": github_user["login"],
        }},
    )

    return {"github_username": github_user["login"]}
