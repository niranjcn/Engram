# Changelog

## Unreleased

### Removed

- JSON export button from Stats page

### Changed

- Restructured to React Router — URL-based routing instead of manual `view` state
- Created shared Layout component (sidebar on desktop, bottom nav on mobile)
- Login/Register now use `/login` and `/register` routes instead of `showRegister` toggle
- Edit problem now uses `/edit/:id` URL param instead of `editProblem` state
- Extracted `useAuth` hook — auth logic moved out of App.jsx
- Created `AppDataContext` with `useAppData` hook — pages fetch data directly instead of props
- Pages (Dashboard, ProblemList, Stats, Add, Edit) now use hooks internally
- Edit problem no longer submits a review — only updates fields

### Added

- Settings page (empty shell, ready for v2 features)

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
