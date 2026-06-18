from sqlmodel import SQLModel, Field
from datetime import datetime, date
from typing import Optional

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Problem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
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
    date_added: date = Field(default_factory=date.today)

class ReviewHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    date: date
    count: int = 1
