from sqlmodel import create_engine, Session
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dsa_tracker.db")

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

def get_session():
    with Session(engine) as session:
        yield session
