# Changelog

## Unreleased

### Removed

- JSON export button from Stats page
- Card component wrappers from Dashboard sections, Stats charts, ProblemList rows, ReviewCard, Add/Edit forms, and Settings page — replaced with bare surface divs
- Day labels and day-label column from desktop heatmap
- `max-w-2xl` content constraint — switched to full-width `max-w-7xl`

### Changed

- Restructured to React Router — URL-based routing instead of manual `view` state
- Created shared Layout component (sidebar on desktop, bottom nav on mobile)
- Login/Register now use `/login` and `/register` routes instead of `showRegister` toggle
- Edit problem now uses `/edit/:id` URL param instead of `editProblem` state
- Extracted `useAuth` hook — auth logic moved out of App.jsx
- Created `AppDataContext` with `useAppData` hook — pages fetch data directly instead of props
- Pages (Dashboard, ProblemList, Stats, Add, Edit) now use hooks internally
- Edit problem no longer submits a review — only updates fields
- Complete visual redesign — professional dark theme (#0B0D12 bg, #16181E surfaces, #3B82F6 accent)
- Brand renamed from "DSA Tracker" to "Engram"
- Accent color switched from indigo to blue (#3B82F6)
- Sidebar simplified with cleaner nav and compact stats
- Bottom nav adjusted for mobile safe-area (iPhone home indicator)
- Heatmap rebuilt as LeetCode-style independent month grids — each month starts from the 1st with correct day-of-week offset
- Current month heatmap caps at today's date (shows no future cells)
- Heatmap month labels and grid are now centered in container
- Login/Register pages redesigned with centered brand block and form card
- Form inputs, buttons, badges, and selects updated to new theme colors
- All pages use responsive spacing: tighter on mobile (`space-y-5`, `p-3`), roomier on desktop (`space-y-8`, `p-4`)
- ProblemList action buttons smaller on mobile (`p-1`, 12px icons)
- Bottom padding added to content area to prevent overlap with mobile nav
- `overflow-x: hidden` added to html/body to prevent layout viewport expansion on mobile
- Vite config: added watch.usePolling for Docker file-change detection

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
