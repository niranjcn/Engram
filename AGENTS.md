# Project Instructions

## Git
- Never push to GitHub without explicit user consent.
- Always ask before pushing.
- Changelog must be updated before each push.

## Auth
- Admin is seeded on first startup via `ADMIN_EMAIL`/`ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars (not first-registrant).
- Registration always creates users with `role: "user"`.
- JWT auth uses httpOnly cookies (not localStorage).

## PWA
- Service worker caches static assets only (app shell). No offline data sync, no IndexedDB.
