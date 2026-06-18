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

# Security headers — add FIRST so CORS middleware runs before it
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # ← removed Content-Security-Policy entirely, it was blocking Railway
        return response

app.add_middleware(SecurityHeadersMiddleware)

# CORS — add LAST so it runs FIRST (FastAPI reverses middleware order)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SQLModel.metadata.create_all(engine)

app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(reviews.router)

@app.get("/")
def root():
    return {"message": "DSA Tracker API"}