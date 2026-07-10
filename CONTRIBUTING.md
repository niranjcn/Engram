# Contributing

## Getting Started

1. Fork the repo
2. `cp backend/.env.example backend/.env` and fill in values
3. `cd backend && pip install -r requirements.txt`
4. `cd frontend && npm install`
5. Run both: `docker compose up -d` (or separately with `uvicorn` + `npm run dev`)

## Making Changes

- Match existing code style (naming, structure, error handling)
- Keep diffs small and focused — one feature or fix per PR
- Run the linter before committing: `ruff check backend/`
- Test manually in both local dev and against the live backend if possible

## Code Review

- Explain *why* in commit messages, not just *what*
- Flag security-sensitive changes (auth, cookies, rate limiting, CSP) explicitly
- Add tests for new logic — prefer behavior-driven (given/when/then) over implementation-mirroring

## Docs

- Update `docs/` or this file if your change affects setup, config, or workflow
- Update `CHANGELOG.md` under `## Unreleased` with the change

## Need Help?

Open an issue or PR with `[WIP]` in the title for early feedback.
