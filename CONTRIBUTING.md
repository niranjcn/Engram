# Contributing

Thanks for considering contributing to **Engram**. This doc covers the basics — setup, workflow, and standards.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Workflow](#workflow)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Security](#security)

---

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)

### Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/Engram.git
cd Engram

# 2. Backend
cp backend/.env.example backend/.env
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Or with Docker:

```bash
docker compose up -d
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | JWT signing key (`python -c "import secrets; print(secrets.token_hex(32))"`) |
| `MONGODB_URL` | Yes | MongoDB connection string |
| `ALLOWED_ORIGINS` | No | CORS origins, comma-separated (default: `http://localhost:5173`) |

---

## Project Structure

```
backend/
├── routers/          # Route handlers (auth, problems, reviews, admin, github, profiles)
├── auth.py           # JWT, bcrypt, cookie helpers
├── main.py           # FastAPI app, CORS, CSP, rate limiting
├── models.py         # Pydantic models
├── schemas.py        # Request/response schemas
├── database.py       # MongoDB via Motor
├── sm2.py            # SM-2 algorithm
├── crypto.py         # Fernet token encryption
└── utils.py          # IST timezone helpers

frontend/
├── src/
│   ├── api.js          # HTTP client
│   ├── App.jsx         # Router + layout
│   ├── components/     # Reusable UI (Badge, Btn, Card, Heatmap, etc.)
│   ├── pages/          # Route pages (Dashboard, Stats, Settings, etc.)
│   ├── context/        # AppDataContext
│   ├── hooks/          # useAuth
│   └── lib/            # Constants, utils
├── index.html
└── vite.config.js
```

---

## Coding Standards

### Python (Backend)

- Follow PEP 8
- Use type hints on all function signatures
- Use async/await for I/O (database calls, HTTP requests)
- Match existing router patterns (`prefix`, `tags`, error handling)

### JavaScript / JSX (Frontend)

- Use functional components with hooks
- Use named exports for components
- Match existing Tailwind patterns (dark theme classes, spacing)
- Avoid `localStorage` for sensitive data
- Use `credentials: 'include'` for API calls

### General

- No commented-out code
- No debug logs or `console.log` in production code
- No unused imports or variables
- Prefer early returns over nested conditionals

---

## Workflow

```
1. Create a branch:   git checkout -b feat/your-feature
2. Make your changes
3. Run the linter:    ruff check backend/
4. Test manually:     frontend + backend running together
5. Commit:            git commit -m "type: concise description"
6. Push:              git push origin feat/your-feature
7. Open a PR against main
```

### Branch Naming

- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation
- `chore/` — tooling, config, dependencies

---

## Commit Messages

```
<type>: <short description>

<optional body explaining why, not what>
```

Examples:

```
feat: add community profiles with public problem browsing
fix: set SameSite=None on auth cookie for cross-origin login
docs: update architecture diagram for MongoDB migration
```

Use the body for non-obvious rationale or tradeoffs (e.g., "using memory
instead of localStorage because the token needs httpOnly protection").

---

## Pull Requests

- Keep PRs small and focused (one feature or fix per PR)
- Reference any related issues
- Add a changelog entry in `CHANGELOG.md` under `## Unreleased`
- Tag security-sensitive changes explicitly (auth, cookies, CSP, rate limiting)
- If your change affects setup or config, update `README.md`

---

## Security

- Never commit secrets, API keys, or `.env` files
- Never expose `SECRET_KEY`, `GITHUB_TOKEN_ENCRYPTION_KEY`, or DB credentials
- Flag any change that weakens CORS, CSP, or cookie security during review
- Auth-related changes should consider cross-origin implications (frontend on Netlify, backend on Railway)
