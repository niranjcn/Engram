from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models import User
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_session

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where((User.email == data.email) | (User.username == data.username))).first()
    if existing:
        raise HTTPException(status_code=400, detail="Registration failed")
    user = User(
        email=data.email,
        username=data.username,
        password_hash=hash_password(data.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
