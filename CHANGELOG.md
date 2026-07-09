# Changelog

## Unreleased

### Fixed
- Token expiry reduced from 7 days to 5 hours
- CSP meta tag `frame-ancestors` removed (ignored in meta, already set in HTTP headers)
- Added `mobile-web-app-capable` meta tag alongside `apple-mobile-web-app-capable`
- Added inline script to auto-reload on failed module/dynamic import (prevents blank page on stale cache)

### Added
- `cryptography` and `httpx` dependencies
- `crypto.py` — `encrypt_token()` / `decrypt_token()` using Fernet (derives key from `SECRET_KEY` or explicit `FERNET_KEY`)
- `github_token_encrypted` and `github_username` fields on UserModel
- `POST /auth/github` endpoint — exchanges OAuth code for token, stores encrypted on user record
- `GET /auth/github/config` endpoint — exposes `client_id` to frontend
- `github_username` exposed in `GET /auth/me` response
- Settings page: "Connect GitHub" button with OAuth popup flow, shows connected username when linked
- `_redirects` file with explicit `/assets/*` passthrough before SPA catch-all
- `_headers` file for cache-control: `index.html` never cached, `/assets/*` cached immutably
- `AGENTS.md` with project conventions (push policy, auth rules, PWA scope)
- SW v2: navigation requests always go to network first (no more stale `index.html`), only static assets are cached
- Inline script moved to external `update-handler.js` to avoid CSP violation

- Admin system — full backend API (`/admin/dashboard`, `/admin/users`, `/admin/users/:id`, activity, problems, role management, delete) with admin-only sidebar link and RequireAdmin guard
- Admin Dashboard — metric cards (users, problems, reviews, streaks), difficulty/topic breakdown, monthly registrations
- Admin Users page — searchable, sortable table with promote/demote/delete
- Admin User Detail page — profile header, stats cards, LeetCode-style heatmap, read-only problem list with expandable notes
- Admin seeded on first startup via `ADMIN_EMAIL`/`ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars (bcrypt-hashed)
- `require_admin` FastAPI dependency — checks `current_user.role == "admin"`
- `role` field on UserModel and `/auth/me` response
- Shared Heatmap component — LeetCode-style 12-month contribution graph (green, column-major, tooltips, keyboard nav)
- `POST /auth/logout` endpoint — clears httpOnly cookie
- Rate limiting on `/auth/login` and `/auth/register` — 10 req/min per IP (configurable via `RATE_LIMIT_PER_MINUTE`)
- Content-Security-Policy via meta tag, backend middleware, and Netlify headers
- HSTS header (`max-age=31536000; includeSubDomains`)
- Favicon (branded brain icon in dark square)
- PWA support — `manifest.json` (standalone, dark theme, custom icons), service worker (static asset caching), Apple PWA meta tags
- Admin and Settings icon links in mobile top bar (previously only accessible from desktop sidebar)

### Changed

- JWT auth migrated from `localStorage` + `Authorization` header to httpOnly, Secure, SameSite=None/Lax cookie — token is invisible to JavaScript
- `get_current_user` reads JWT from cookie first, falls back to `Authorization` header
- Frontend fetch calls use `credentials: 'include'` for cross-origin cookie support
- All `localStorage` token read/write removed from frontend (`useAuth`, `LoginPage`, `RegisterPage`, `api.js`)
- CORS `allow_headers` restricted to `Content-Type, Authorization, Accept`; `allow_methods` restricted to specific verbs
- `load_dotenv()` consolidated — removed from `auth.py` and `database.py`, called only in `main.py`
- Admin startup log no longer exposes admin email
- Stats page uses shared Heatmap component (inline HeatmapGrid removed)
- Admin UserDetail heatmap now matches the Stats page LeetCode style exactly
- Admin UserDetail problems list enhanced — now shows difficulty badges, topic, last outcome, solo streak, URL link, expandable notes/key insight
- Admin Users sort by "Streak" now resolves to `streak.current` instead of comparing the object
- Registration always sets `role: "user"` (admin created via env-seeded startup)
- Title changed to "Engram" in index.html

### Removed

- JSON export button from Stats page
- Card component wrappers from Dashboard sections, Stats charts, ProblemList rows, ReviewCard, Add/Edit forms, and Settings page
- Day labels and day-label column from desktop heatmap
- `max-w-2xl` content constraint
- Legacy inline HeatmapGrid component from Stats.jsx
- `load_dotenv()` calls from `auth.py` and `database.py`

## v1.0.0 (2026-07-09)

Initial release of **Engram** — a spaced-repetition DSA study tracker.

### Features

- JWT-authenticated registration & login
- Dashboard with problems due today, review queue, and streak tracking
- Full CRUD for problems (title, topic, difficulty, link, notes)
- Review flow with SM-2 spaced repetition algorithm — rate outcomes as Solved Solo, Used Hint, or Checked Code
- Automatic stage progression: Learning → Reviewing → Mastered → Frozen
- Statistics page with 30-day activity heatmap, topic breakdown, and outcome distribution
- JSON export for portability
- Cross-device sync via cloud backend
- Mobile-responsive UI built with React + Tailwind CSS
