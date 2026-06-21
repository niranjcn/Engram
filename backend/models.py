from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional


class UserModel(BaseModel):
    id: str = ""
    email: str
    username: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProblemModel(BaseModel):
    id: str = ""
    user_id: str
    title: str
    url: Optional[str] = None
    topic: str
    difficulty: str
    notes: Optional[str] = None
    key_insight: Optional[str] = None
    interval: int = 1
    ease_factor: float = 2.5
    repetitions: int = 0
    solo_streak: int = 0
    frozen: bool = False
    last_outcome: Optional[str] = None
    next_review_date: date
    date_added: date


class ReviewHistoryModel(BaseModel):
    id: str = ""
    user_id: str
    date: date
    review_count: int = 1
