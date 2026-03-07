# GO Brand Theme Update – Accent-First

## Summary

The app theme was updated to use **GO ACCENT** (bright energetic blue `#3b82f6`) as the primary interactive color instead of indigo/purple. All primary buttons, links, active nav, focus rings, toggles, and chart accents now use the accent color. Background remains navy/purple gradient with a subtle accent glow; surfaces use glass cards with bluish borders.

---

## Design Tokens Changed

### Centralized in `app/globals.css` (`:root`)

| Token | Value | Purpose |
|-------|--------|---------|
| `--accent` | `#3b82f6` | Primary CTA, buttons, links, active states |
| `--accent-2` | `#60a5fa` | Hover, secondary accent |
| `--accent-soft` | `rgba(59, 130, 246, 0.15)` | Hover backgrounds, unread highlights, in_progress chip |
| `--accent-soft-hover` | `rgba(59, 130, 246, 0.25)` | Stronger hover tint |
| `--ring` | `#3b82f6` | Focus ring |
| `--bg` | `#0f0f23` | Base background |
| `--bg-gradient` | `linear-gradient(...)` | Navy/purple gradient |
| `--bg-gradient-accent-glow` | `radial-gradient(...)` | Subtle accent glow overlay |
| `--surface` | `rgba(255,255,255,0.06)` | Glass card background |
| `--surface-hover` | `rgba(255,255,255,0.08)` | Card hover |
| `--border` | `rgba(255,255,255,0.1)` | Default border |
| `--border-accent` | `rgba(59,130,246,0.35)` | Glass card hover border |
| `--text` | `#f1f5f9` | Primary text |
| `--muted` | `#94a3b8` | Secondary text |
| `--danger` | `#ef4444` | Destructive |
| `--warning` | `#f59e0b` | Warning |
| `--success` | `#10b981` | Success |

Legacy aliases kept: `--go-bg`, `--go-glass`, `--go-glass-border` now reference the new tokens.

### Tailwind (`tailwind.config.ts`)

- **Colors:** `accent` (DEFAULT, soft, soft-hover, second), `surface`, `border`, `muted`, `ring`, `danger`, `warning`, `success`; `go-dark`, `go-glass`, `go-glass-border` mapped to CSS vars.
- **Background:** `go-gradient` uses `var(--bg-gradient)`; `go-gradient-card` uses accent-soft.
- **Transition:** Default duration `200ms` and easing for micro-interactions.

---

## Files Modified

### Theme / config

- **`app/globals.css`** – New `:root` tokens, glass-card hover with border-accent, status chips (in_progress → accent; changes_requested → violet), FullCalendar vars → accent, RTL slide-in keyframes, body accent glow.
- **`tailwind.config.ts`** – Accent and semantic colors from CSS vars; transition defaults.

### Layout & nav

- **`components/layout/app-sidebar.tsx`** – Logo text and active item: `text-accent-second`, `bg-accent-soft text-accent-second`.
- **`components/layout/app-topbar.tsx`** – Search input: `focus:border-accent focus:ring-accent`.
- **`app/app/layout.tsx`** – Modular arrow pattern stroke: `%233b82f6` (accent).

### Auth

- **`app/login/page.tsx`** – Pattern stroke → accent.
- **`app/login/login-form.tsx`** – Inputs focus ring and submit button → accent; link “Forgot password?” → accent.
- **`app/forgot-password/page.tsx`** – Pattern stroke → accent; “Back to login” link → accent.
- **`app/forgot-password/forgot-password-form.tsx`** – Submit button → accent.

### Admin

- **`app/app/admin/page.tsx`** – “Add task” CTA → `bg-accent`, `hover:bg-accent-second`.
- **`app/app/admin/users/users-table.tsx`** – “Invite / Create user” button → accent.
- **`app/app/admin/users/invite-user-form.tsx`** – Submit button → accent.
- **`app/app/admin/clients/page.tsx`** – “Add Client” button → accent.
- **`app/app/admin/clients/clients-list.tsx`** – “Edit / Brand Kit” link → accent.
- **`app/app/admin/clients/[id]/page.tsx`** – Task link → accent.
- **`app/app/admin/clients/create-client-form.tsx`** – Submit button → accent.
- **`app/app/admin/clients/[id]/brand-kit-form.tsx`** – Submit button → accent.
- **`app/app/admin/tasks/task-control-center.tsx`** – Create task button → accent.
- **`app/app/admin/approvals/approval-list.tsx`** – “Review” task link → accent.
- **`app/app/admin/admin-dashboard-charts.tsx`** – Bar fill → `rgba(59, 130, 246, 0.8)`.
- **`app/app/admin/reports/reports-client.tsx`** – Bar fills (status, assignee) → accent shades; client bar kept green.

### App (shared)

- **`app/app/tasks/tasks-list.tsx`** – Task link → accent.
- **`app/app/task/[id]/task-detail-client.tsx`** – “Save output”, “View uploaded file”, “Send” → accent.
- **`app/app/profile/profile-form.tsx`** – Submit button → accent.
- **`app/app/smm/page.tsx`** – Calendar icon → accent.
- **`app/app/smm/calendar/calendar-view.tsx`** – Buttons → accent.
- **`app/app/designer/task-list-designer.tsx`** – Filter pills (selected) → accent.
- **`app/app/editor/task-list-editor.tsx`** – Filter pills (selected) → accent.
- **`app/app/supervisor/page.tsx`** – Icons → accent.
- **`app/app/supervisor/ops/page.tsx`** – Icon → accent.
- **`app/app/supervisor/private/private-tasks-list.tsx`** – Buttons → accent.

### UI components

- **`components/ui/kpi-card.tsx`** – Default variant icon color → `text-accent-second`; card transition.
- **`components/ui/status-chip.tsx`** – `in_progress` → `bg-accent-soft text-accent-second border-accent/50`; `changes_requested` → violet (distinct from accent).
- **`components/ui/empty-state.tsx`** – Primary button and link → accent.
- **`components/ui/page-loader.tsx`** – Dots and pattern stroke → accent.
- **`components/ui/skeleton.tsx`** – Background → `bg-accent-soft`.
- **`components/notifications/notifications-panel.tsx`** – Unread row → `bg-accent-soft`.
- **`components/notifications/notifications-list.tsx`** – Unread row and “View task” link → accent.

---

## Status Colors (Unchanged Except in_progress)

- **todo:** slate  
- **in_progress:** accent (new)  
- **review:** amber  
- **approved:** emerald  
- **changes_requested:** violet (was rose; kept distinct from accent)  
- **overdue:** rose  
- **active / inactive / pending_verification / banned:** unchanged  

---

## Remaining / Grep Hints

No remaining uses of the old primary color in app or components:

- **Indigo/purple:** Replaced with `accent` or `accent-second` / `accent-soft` in all touched files.
- **Hex:** All `#6366f1` and `%236366f1` (pattern strokes) replaced with `#3b82f6` / `%233b82f6`.

If you add new screens or components:

- Use `bg-accent`, `text-accent-second`, `focus:ring-accent`, `focus:border-accent` for primary actions and focus.
- Use `bg-accent-soft` for selected/unread/hover backgrounds.
- Use CSS variables in JS when needed (e.g. charts): `rgba(59, 130, 246, 0.8)` or getComputedStyle for `--accent`.

---

## RTL and Dark Mode

- **RTL:** `[dir="rtl"]` body uses Cairo; drawer slide-in keyframes have RTL variant (translateX(-100%) → 0). No regressions.
- **Dark mode:** Theme is dark-only; no light variant. All contrasts tuned for dark background.

---

## Verification

- Login screen: accent button and focus rings; pattern uses accent stroke.
- Admin dashboard: KPI icons accent; charts accent; quick actions accent.
- Tables: links and actions use accent.
- Drawers / modals: use glass-card (bluish border on hover).
- Buttons / chips / forms: primary = accent; focus ring = accent.
- Recharts: bar fills use accent (and accent-2 / green where appropriate).
