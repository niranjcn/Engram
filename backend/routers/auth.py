from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from models import UserModel
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest):
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
        "created_at": datetime.utcnow(),
    })
    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    db = await get_db()
    doc = await db.users.find_one({"email": data.email})
    if not doc or not verify_password(data.password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(doc["_id"])})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: UserModel = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        created_at=current_user.created_at,
    )
