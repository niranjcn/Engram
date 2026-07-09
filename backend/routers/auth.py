from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from models import UserModel
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user, COOKIE_NAME
from database import get_db
import os

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_MAX_AGE = 7 * 24 * 60 * 60


def _cookie_secure() -> bool:
    origins = os.getenv("ALLOWED_ORIGINS", "")
    return not any(h in origins for h in ("localhost", "127.0.0.1"))


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
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        created_at=current_user.created_at,
    )
