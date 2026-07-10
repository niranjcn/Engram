<div align="center">

# 🧠 Engram

**Spaced repetition DSA tracker for serious interview prep.**

Log problems, rate your confidence, and let SM-2 schedule exactly what to review each day — so nothing you've learned ever fades.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-dsa--engram.netlify.app-6366F1?style=for-the-badge&logo=netlify&logoColor=white)](https://dsa-engram.netlify.app)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

</div>

---

## What is Engram?

Most people grind LeetCode by solving as many problems as possible — and forget 80% of them within a week. Engram fixes that.

It applies the **SM-2 spaced repetition algorithm** (the same one behind Anki) to DSA problems. Every time you review a problem, you tell it how you solved it — and Engram schedules the next review at the exact moment before you'd forget it.

The result: fewer problems reviewed, deeper retention, better interviews.

---

## How it works

Add a problem → rate each attempt → SM-2 handles the rest.

| Outcome | What it means | Next review |
|---|---|---|
| ✅ Solved Solo | Figured it out completely | 3+ days, grows each time |
| 💡 Used Hint | Needed a nudge | 1 day |
| 👀 Checked Code | Had to look at the solution | 1 day, slower growth |

Problems move through four stages automatically:


[![Live Demo](https://img.shields.io/badge/Live%20Demo-dsa--engram.netlify.app-6366F1?style=for-the-badge&logo=netlify&logoColor=white)](https://dsa-engram.netlify.app)


```
🔴 Learning → 🟡 Reviewing → 🏆 Mastered → ❄️ Frozen
```

A problem **freezes** (leaves the review queue permanently) after you solve it solo 3 consecutive times with an interval over 21 days. You've truly mastered it. You can unfreeze any problem at any time to bring it back.

---

## Features

- **SM-2 Spaced Repetition** — server-side algorithm, not just a timer
- **Daily Dashboard** — see exactly what's due today, what's coming up, and your streak
- **Stage System** — Learning → Reviewing → Mastered → Frozen with automatic transitions
- **Problem Journal** — notes and key insight saved per problem
- **Stats Page** — 12-month activity heatmap, topic breakdown, outcome distribution
- **GitHub Sync** — push solutions to a LeetCode repo with auto-generated files
- **Community Directory** — browse public profiles and their problem lists
- **Admin Panel** — dashboard with metrics, user management, activity log
- **httpOnly Cookie Auth** — secure, no JavaScript access to tokens
- **Rate Limiting** — 10 req/min on login/register per IP
- **PWA Support** — installable, service worker for offline-capable caching
- **Docker support** — one command local setup

---

## Table of Contents

- [1. Core Idea](#1-core-idea)
- [2. Technology Stack](#2-technology-stack)
- [3. System Architecture](#3-system-architecture)
- [4. Project Structure](#4-project-structure)
- [5. Key Features](#5-key-features)
- [6. SM-2 Algorithm](#6-sm-2-algorithm)
- [7. Spaced Repetition Flow](#7-spaced-repetition-flow)
- [8. API Overview](#8-api-overview)
- [9. Security Features](#9-security-features)
- [10. Setup Instructions](#10-setup-instructions)
- [11. Configuration](#11-configuration)
- [12. Running Both Servers](#12-running-both-servers)
- [13. Troubleshooting](#13-troubleshooting)

---

## 1. Core Idea

---

## 2. Technology Stack

### Backend

| Component | Technology |
|---|---|
| Framework | FastAPI (Python 3.11) |
| Database | MongoDB via Motor (async driver) |
| Auth | JWT (httpOnly cookie) with bcrypt password hashing |
| Validation | Pydantic v2 |
| Server | Uvicorn |

### Frontend

| Component | Technology |
|---|---|
| UI Library | React 18 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| Icons | Lucide React |

### Infrastructure

| Component | Technology |
|---|---|
| Hosting (API) | Railway |
| Hosting (Frontend) | Netlify |
| Containerization | Docker & Docker Compose |

---

## 3. System Architecture

```mermaid
flowchart TD
  subgraph Client ["Frontend (React + Vite) — netlify"]
    UI[SPA with Routes]
    API_C[api.js\nHTTP Client + httpOnly Cookie]
  end

  subgraph Backend ["Backend (FastAPI + Uvicorn) — railway"]
    AUTH[routers/auth.py\nRegister, Login, OAuth]
    PROBLEMS[routers/problems.py\nCRUD + SM-2 Review]
    REVIEWS[routers/reviews.py\nHistory + Stats]
    ADMIN[routers/admin.py\nDashboard, Users, Activity]
    GITHUB[routers/github.py\nRepo Setup, Sync]
    PROFILES[routers/profiles.py\nCommunity Directory]
    JWT[auth.py\nJWT · bcrypt · Cookie Helper]
    SM2[sm2.py\nSM-2 Algorithm]
  end

  subgraph Data ["Persistence — MongoDB Atlas"]
    DB[(MongoDB)]
  end

  UI --> API_C
  API_C -- HTTPS --> AUTH
  API_C --> PROBLEMS
  API_C --> REVIEWS
  API_C --> ADMIN
  API_C --> GITHUB
  API_C --> PROFILES
  AUTH --> JWT
  AUTH --> DB
  PROBLEMS --> SM2
  PROBLEMS --> DB
  REVIEWS --> DB
  ADMIN --> DB
  GITHUB --> DB
  PROFILES --> DB
```

**Request Flow:**

```mermaid
sequenceDiagram
  participant U as Browser (React)
  participant API as FastAPI Backend
  participant AUTH as JWT Auth
  participant SM2 as SM-2 Engine
  participant DB as MongoDB

  U->>API: POST /auth/login {email, password}
  API->>AUTH: verify_password()
  AUTH-->>API: JWT token
  API-->>U: Set-Cookie: access_token=<JWT>; HttpOnly; Secure; SameSite=None

  Note over U,DB: Subsequent requests send cookie automatically

  U->>API: POST /problems {title, topic, ...}
  API->>AUTH: get_current_user() — read cookie, decode JWT
  AUTH-->>API: user object
  API->>DB: db.problems.insert_one(...)
  DB-->>API: inserted problem
  API-->>U: problem (with SM-2 defaults)

  U->>API: POST /problems/{id}/review {outcome}
  API->>AUTH: get_current_user()
  API->>SM2: run_sm2(problem, outcome)
  SM2-->>API: {interval, ease_factor, next_review_date, ...}
  API->>DB: db.problems.update_one(...) + db.reviews.insert_one(...)
  DB-->>API: updated problem
  API-->>U: updated problem
```

---

## 4. Project Structure

```text
dsa_tracker/
├── backend/
│   ├── routers/
│   │   ├── auth.py          # Register, login, OAuth, logout, me
│   │   ├── problems.py      # CRUD + review endpoint
│   │   ├── reviews.py       # History & stats
│   │   ├── admin.py         # Admin dashboard, users, activity
│   │   ├── github.py        # GitHub repo setup, sync
│   │   └── profiles.py      # Public profile & community directory
│   ├── auth.py              # JWT, bcrypt, cookie helper, get_current_user
│   ├── crypto.py            # Fernet token encryption for GitHub tokens
│   ├── sm2.py               # SM-2 spaced repetition algorithm
│   ├── models.py            # Pydantic models (User, Problem, ReviewHistory)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── database.py          # MongoDB connection via Motor
│   ├── main.py              # FastAPI app + CORS + CSP + rate limiting
│   ├── utils.py             # IST timezone helpers
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # State + routing
│   │   ├── api.js           # HTTP client with credentials: include
│   │   ├── main.jsx         # ReactDOM entry point
│   │   ├── styles.css       # Tailwind directives + animations
│   │   ├── context/
│   │   │   └── AppDataContext.jsx  # Shared app data context
│   │   ├── components/
│   │   │   ├── Badge.jsx, Btn.jsx, Card.jsx
│   │   │   ├── ErrorBoundary.jsx, Layout.jsx, PublicLayout.jsx
│   │   │   ├── Heatmap.jsx    # 12-month contribution graph
│   │   │   ├── ProblemForm.jsx, ReviewCard.jsx
│   │   │   └── RequireAdmin.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard, ProblemList, Stats, LoginPage, RegisterPage
│   │   │   ├── AddProblem, EditProblem, Settings, ProfilePage
│   │   │   ├── UserDirectory, GithubCallback
│   │   │   └── admin/         # Admin dashboard pages
│   │   └── lib/
│   │       ├── constants.js   # TOPICS, OUTCOMES, DIFF_COLOR, etc.
│   │       └── utils.js       # sm2 helpers, date utils
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── _redirects / _headers
├── docker-compose.yml
├── .gitignore
├── AGENTS.md
├── CHANGELOG.md
├── LEARN_REACT.md
└── README.md
```

---

## 5. Key Features

- **SM-2 Spaced Repetition** — Server-side algorithm schedules review dates based on performance
- **httpOnly Cookie Auth** — JWT stored in secure, httpOnly cookie (invisible to JavaScript)
- **Dashboard** — Due today queue, coming up (7-day), mastered problems, 12-month contribution heatmap
- **Problem Management** — Add, edit, delete problems with topic/difficulty/notes/key insight
- **Review Flow** — Three outcomes (Solved Solo / Used Hint / Checked Code) each affecting intervals differently
- **Stage Filtering** — Filter problems by stage: Learning, Reviewing, Mastered, Frozen
- **Stage Badges** — Visual indicators with emoji (🔄 Learning, 🔁 Reviewing, 🏆 Mastered, ❄️ Frozen)
- **Statistics** — Distribution pie chart, outcome breakdown, streak tracking
- **Unfreeze** — Frozen problems can be unfrozen to resume review
- **GitHub Integration** — Connect GitHub, auto-create LeetCode repo, sync solutions as individual files
- **Admin Panel** — Dashboard with user/problem/review metrics, user management, activity logs, role management
- **Community Directory** — Browse public profiles, search by username, view others' problem lists
- **Rate Limiting** — 10 req/min on `/auth/login` and `/auth/register` per IP
- **PWA Support** — Manifest, service worker, installable, offline-capable asset caching
- **Security Headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options on all API responses
- **URL Validation** — Problem URLs restricted to http/https on both client and server
- **Dockerized** — One command to start both services

---

## 6. SM-2 Algorithm

The SM-2 algorithm (implemented in `backend/sm2.py`) determines the next review interval based on:

| Outcome | Quality | Effect on Interval | Effect on Streak |
|---|---|---|---|
| Solved Solo | 5 | Increases (or first-attempt override to 3d) | +1 |
| Used Hint | 3 | Increases slowly | Reset to 0 |
| Checked Code | 1 | Reset to 1 day | Reset to 0 |

**First-attempt overrides** (when `repetitions == 0`):
- Solved Solo → interval = 3 days
- Used Hint → interval = 1 day
- Checked Code → interval = 1 day

**Freeze condition**: `interval > 21 AND solo_streak >= 3` — problem is marked frozen and removed from review rotation.

---

## 7. Spaced Repetition Flow

```mermaid
stateDiagram-v2
  [*] --> Learning : Problem added\nnext_review = tomorrow
  Learning --> Reviewing : repetitions >= 3\ninterval > 3 days
  Reviewing --> Mastered : interval > 21 days\nsolo_streak < 3
  Reviewing --> Frozen : interval > 21 days\nsolo_streak >= 3
  Mastered --> Reviewing : Unfreeze\ninterval = 7 days
  Frozen --> Reviewing : Unfreeze\ninterval = 7 days
  Learning --> Learning : Review with Used Hint / Checked Code\ninterval resets or grows slowly
  Reviewing --> Learning : Review with Checked Code\ninterval reset to 1 day
```

---

## 8. API Overview

All endpoints serve JSON. Auth is via httpOnly cookie (sent automatically) except `/auth/register` and `/auth/login` which are public.

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account (email, username, password) |
| POST | `/auth/login` | Login, sets httpOnly cookie |
| POST | `/auth/logout` | Clear auth cookie |
| GET | `/auth/me` | Current user info |
| POST | `/auth/github` | Exchange OAuth code for GitHub token |
| GET | `/auth/github/config` | GitHub OAuth client ID + CSRF state |
| POST | `/auth/github/language` | Set code file language preference |

### Problems

| Method | Path | Description |
|---|---|---|
| GET | `/problems` | List all problems for current user |
| POST | `/problems` | Create a problem |
| GET | `/problems/{id}` | Get problem by ID |
| PUT | `/problems/{id}` | Update problem fields |
| DELETE | `/problems/{id}` | Delete problem |
| POST | `/problems/{id}/review` | Submit review outcome, runs SM-2 |

### Reviews

| Method | Path | Description |
|---|---|---|
| GET | `/reviews/history` | Review count per day (rolling 12 months) |
| GET | `/reviews/stats` | Aggregate stats (total, frozen, mastered, by topic, by outcome, streak) |

### Community / Profiles

| Method | Path | Description |
|---|---|---|
| GET | `/profiles` | List public profiles (searchable) |
| GET | `/profiles/{user_id}` | Public profile with stats + heatmap |
| GET | `/profiles/{user_id}/problems` | Public problem list |

### GitHub Sync

| Method | Path | Description |
|---|---|---|
| POST | `/github/setup-repo` | Create (or detect) LeetCode repo |
| POST | `/github/sync` | Force sync all problems to GitHub |
| POST | `/github/disconnect` | Remove GitHub connection |

### Admin

| Method | Path | Description |
|---|---|---|
| GET | `/admin/dashboard` | Metrics, registrations, activity |
| GET | `/admin/users` | List all users (searchable, sortable) |
| GET | `/admin/users/{id}` | User detail with stats + heatmap + problems |
| DELETE | `/admin/users/{id}` | Delete user account |

### System

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check |

---

## 9. Security Features

```mermaid
flowchart LR
  REQ[Request] --> CORS[CORS\nallowed origins only]
  CORS --> JWT[JWT Validation\ntoken expiry + signature]
  JWT --> RBAC[User Ownership\nyour data only]
  RBAC --> VAL[Input Validation\nPydantic + URL check]
  VAL --> HEADERS[Security Headers\nCSP · XFO · XCTO]
  HEADERS --> HANDLER[Route Handler]
```

| Layer | Implementation |
|---|---|---|
| **CORS** | Restricted to `ALLOWED_ORIGINS` env var (default: `localhost:5173`) |
| **JWT** | 5-hour expiry, stored in httpOnly Secure SameSite=None cookie, validated on every protected route |
| **Password Hashing** | bcrypt via passlib |
| **Input Validation** | Pydantic schemas with length constraints, email format, URL protocol check |
| **User Isolation** | All queries scoped to `current_user.id` — users cannot access each others' data |
| **Security Headers** | `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-XSS-Protection: 0` |
| **Rate Limiting** | 10 req/min on login & register per IP (configurable via `RATE_LIMIT_PER_MINUTE`) |
| **URL Sanitization** | Problem URLs must start with `http://` or `https://` (both client and server) |
| **Secret Key** | Required at startup — no fallback default |
| **Registration** | Generic error message prevents email enumeration |
| **Admin Seeding** | Admin account created via env vars on first startup (never exposed in logs) |

---

## 10. Setup Instructions

### Prerequisites

- Docker & Docker Compose (recommended)
- OR Python 3.11+ and Node.js 18+ (manual)

### Quick Start (Docker)

```bash
# 1. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env and set a strong SECRET_KEY

# 2. Start both services
docker compose up -d

# 3. Access the app
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Setup — Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Configure .env
cp .env.example .env

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Manual Setup — Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 11. Configuration

### Backend (`backend/.env`)

```env
# Required — generate with: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-strong-random-key-here

# Required — MongoDB connection string
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=dsa_tracker

# Optional — comma-separated allowed origins for CORS
ALLOWED_ORIGINS=http://localhost:5173

# Optional — rate limit per minute (default: 10)
RATE_LIMIT_PER_MINUTE=10

# Optional — admin account seeded on first startup
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password

# Optional — GitHub OAuth
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_TOKEN_ENCRYPTION_KEY=your-fernet-key
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

### Production (Railway + Netlify)

| Platform | Env Var | Value |
|---|---|---|
| Railway | `MONGODB_URL` | MongoDB Atlas connection string |
| Railway | `SECRET_KEY` | Strong random hex string |
| Railway | `ALLOWED_ORIGINS` | `http://localhost:5173,https://dsa-engram.netlify.app` |
| Railway | `GITHUB_TOKEN_ENCRYPTION_KEY` | Fernet key for token encryption |
| Railway | `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Admin seed credentials |
| Netlify | `VITE_API_URL` | `https://engram-production-ec05.up.railway.app` |

---

## 12. Running Both Servers

### Docker (recommended)

```bash
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

### Separate Terminals

**Terminal 1 (Backend):**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 13. Troubleshooting

### Backend fails to start with "SECRET_KEY environment variable is required"

```bash
# Copy the example env and set a real key
cp backend/.env.example backend/.env
# Edit backend/.env and replace the placeholder
```

### Port already in use

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

### Frontend can't reach backend

- Ensure backend is running on port 8000
- Check `VITE_API_URL` in `frontend/.env` matches the backend URL
- In Docker, both services must be on the same network (handled by `docker-compose.yml`)

### Docker rebuild not picking up changes

```bash
docker compose up -d --build
```

### Database reset

```bash
# Delete the SQLite database and restart
docker compose down
docker volume rm dsa_tracker_sqlite_data
docker compose up -d
```

---

For issues and questions:
- Review the troubleshooting section above
- Check API documentation at http://localhost:8000/docs
- Inspect the browser console for frontend errors
- Review terminal output for backend errors
