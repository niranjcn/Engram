from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import date, datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=6, max_length=128)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    created_at: datetime
    github_username: Optional[str] = None
    github_repo: Optional[str] = None

class GitHubAuthRequest(BaseModel):
    code: str


class ProblemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: Optional[str] = Field(default=None, max_length=2000)
    topic: str
    difficulty: str
    notes: Optional[str] = Field(default=None, max_length=5000)
    key_insight: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("url")
    @classmethod
    def safe_url(cls, v: Optional[str]) -> Optional[str]:
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class ProblemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    url: Optional[str] = Field(default=None, max_length=2000)
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=5000)
    key_insight: Optional[str] = Field(default=None, max_length=2000)
    interval: Optional[int] = None
    ease_factor: Optional[float] = None
    repetitions: Optional[int] = None
    solo_streak: Optional[int] = None
    frozen: Optional[bool] = None
    last_outcome: Optional[str] = None
    next_review_date: Optional[date] = None


class ProblemResponse(BaseModel):
    id: str
    user_id: str
    title: str
    url: Optional[str] = None
    topic: str
    difficulty: str
    notes: Optional[str] = None
    key_insight: Optional[str] = None
    interval: int
    ease_factor: float
    repetitions: int
    solo_streak: int
    frozen: bool
    last_outcome: Optional[str] = None
    next_review_date: date
    date_added: date


class ReviewRequest(BaseModel):
    outcome: str


class ReviewHistoryEntry(BaseModel):
    date: date
    count: int


class StatsResponse(BaseModel):
    total: int
    frozen: int
    mastered: int
    by_topic: dict
    by_outcome: dict
    streak: dict
