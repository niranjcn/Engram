# Changelog

## Unreleased

### Fixed
- Cross-origin auth: cookie `SameSite` now correctly set to `None` with `Secure` when production origins are present in `ALLOWED_ORIGINS` (fixes Chrome login when frontend on Netlify and backend on Railway) — `auth.py:_cookie_secure()` checks origin URLs individually instead of substring-matching the whole list
- Cross-origin auth fallback: login/register now return token in response body, frontend sends as `Authorization: Bearer` header — bypasses Chrome blocking cross-origin cookies entirely when third-party cookies are disabled

### Known Issues
- **Security tradeoff**: The `Authorization` header fallback exposes the JWT token to JavaScript (in-memory variable in `api.js`), unlike the httpOnly cookie which is invisible to JS. Mitigated by strict CSP (`script-src 'self'`), React's built-in XSS escaping, and memory-only storage (lost on refresh, not persisted). **Future fix**: Move backend to a subdomain of the frontend domain (e.g., `api.dsa-engram.netlify.app` proxied to Railway) to restore full httpOnly cookie protection.
- Heatmap now uses a true rolling 12-month window (starts from 365 days ago instead of the 1st of a month 11 months ago) — oldest column falls off left as new day appears on right
- Heatmap date formatting uses IST (`Asia/Kolkata`) instead of UTC — today's box shows on correct day
- Review history stored as IST midnight instead of UTC midnight (backend `ist_today_start()` / `ist_today()` helpers)
- Background GitHub sync tasks no longer silently dropped — switched from raw `asyncio.ensure_future` to FastAPI `BackgroundTasks`, guaranteeing execution
- Token expiry reduced from 7 days to 5 hours
- CSP meta tag `frame-ancestors` removed (ignored in meta, already set in HTTP headers)
- Added `mobile-web-app-capable` meta tag alongside `apple-mobile-web-app-capable`
- Added inline script to auto-reload on failed module/dynamic import (prevents blank page on stale cache)

### Changed
- Heatmap shifts daily — on visibility change, if the date has changed, re-fetches data and recalculates the rolling window
- `POST /problems/{id}/review` now updates GitHub README (via `sync_readme`)
- **Create / Update** only pushes the changed problem file + README to GitHub (was pushing all files)
- **Delete** only pushes README (was pushing all files)
- GitHub sync extracted into reusable helpers: `_get_github_creds`, `sync_problem_file`, `_push_readme`
- Streak calculation uses IST today via `ist_today()` (was `datetime.utcnow()`)
- History query uses IST date boundaries via `ist_today_start()` (was `datetime.now()`)

### Changed
- `POST /github/setup-repo` now detects existing `LeetCode` repo (reuses instead of failing)
- `GET /auth/github/config` now returns a one-time `state` nonce for CSRF protection
- `POST /auth/github` verifies OAuth `state` before exchanging code
- `POST /github/setup-repo` now creates a **public** repo named **LeetCode** (was private `engram-{username}`)
- Sync now creates individual code files (`Two_Sum.py`, etc.) from problem notes instead of just `PROBLEMS.md`
- `PROBLEMS.md` replaced by `README.md` with clickable file links
- Renamed encryption env var from `FERNET_KEY` to `GITHUB_TOKEN_ENCRYPTION_KEY`

### Added
- `sync_language` field on UserModel — stores code file extension preference
- `POST /auth/github/language` endpoint — saves language choice (python, javascript, java, cpp, other)
- Settings: language selector dropdown saves preference, sync creates code files in chosen language
- `cryptography` and `httpx` dependencies
- `crypto.py` — `encrypt_token()` / `decrypt_token()` using Fernet (derives key from `SECRET_KEY` or explicit `FERNET_KEY`)
- `github_token_encrypted` and `github_username` fields on UserModel
- `POST /auth/github` endpoint — exchanges OAuth code for token, stores encrypted on user record
- `GET /auth/github/config` endpoint — exposes `client_id` to frontend
- `github_username` exposed in `GET /auth/me` response
- Settings page: "Connect GitHub" button with OAuth popup flow, shows connected username when linked
- `GithubCallback` page — dedicated OAuth callback route that reads `?code=`, sends via `postMessage` to opener, and closes popup
- `POST /github/setup-repo` endpoint — creates a private `engram-{username}` repo via GitHub API
- `POST /github/sync` endpoint — pushes `problems.json` and `PROBLEMS.md` to the repo (creates or updates via Content API)
- `github_repo` field on UserModel and UserResponse
- Auto-sync to GitHub after `POST /problems`, `PUT /problems`, and `DELETE /problems` (silent no-op if GitHub not connected)
- `POST /github/disconnect` endpoint — clears github token/username/repo from user record
- Settings: "Setup Repository", "Force Sync", and "Disconnect" buttons with loading/error/success states
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
