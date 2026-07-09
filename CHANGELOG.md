# Changelog

## Unreleased

### Removed

- JSON export button from Stats page

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
