from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from database import close_db, get_db
from auth import hash_password
from routers import auth, problems, reviews, admin, github
import os
import time

load_dotenv()

_rate_limit_store: dict[str, list] = {}


def _check_rate_limit(key: str, max_requests: int, window: int = 60) -> bool:
    now = time.time()
    if key not in _rate_limit_store:
        _rate_limit_store[key] = []
    _rate_limit_store[key] = [t for t in _rate_limit_store[key] if now - t < window]
    if len(_rate_limit_store[key]) >= max_requests:
        return False
    _rate_limit_store[key].append(now)
    return True


async def seed_admin():
    db = await get_db()
    existing = await db.users.find_one({"role": "admin"})
    if existing:
        return
    email = os.getenv("ADMIN_EMAIL")
    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")
    if not email or not username or not password:
        print("ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD must be set")
        return
    await db.users.insert_one({
        "email": email,
        "username": username,
        "password_hash": hash_password(password),
        "role": "admin",
        "created_at": datetime.utcnow(),
    })
    print(f"Admin seeded: {username}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed_admin()
    yield
    await close_db()


app = FastAPI(title="DSA Tracker API", lifespan=lifespan)

origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins = [o.strip() for o in origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    if request.url.path in ("/auth/login", "/auth/register"):
        client_ip = request.client.host if request.client else "unknown"
        rate_key = f"auth:{client_ip}"
        max_req = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))
        if not _check_rate_limit(rate_key, max_req):
            return JSONResponse(status_code=429, content={"detail": "Too many requests"})

    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://*.up.railway.app; "
        "frame-ancestors 'none'; "
        "form-action 'self'"
    )
    return response


app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(reviews.router)
app.include_router(admin.router)
app.include_router(github.router)


@app.get("/")
def root():
    return {"message": "DSA Tracker API"}
