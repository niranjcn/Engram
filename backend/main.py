from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlmodel import SQLModel
from database import engine
from routers import auth, problems, reviews
from starlette.middleware.base import BaseHTTPMiddleware
import os

load_dotenv()

app = FastAPI(title="DSA Tracker API")

origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins = [o.strip() for o in origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
        return response

app.add_middleware(SecurityHeadersMiddleware)

SQLModel.metadata.create_all(engine)

app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(reviews.router)

@app.get("/")
def root():
    return {"message": "DSA Tracker API"}
