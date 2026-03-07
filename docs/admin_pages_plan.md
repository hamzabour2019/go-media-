# Admin Pages Implementation Plan

## Page checklist (PASS / FAIL)

| Page | Route | Status | Notes |
|------|--------|--------|--------|
| Main Admin Dashboard | `/app/admin` | **PASS** | KPIs (users, clients, review, overdue, in progress, completed today), workload chart, quick actions |
| Users Management | `/app/admin/users` | **PASS** | Table (name, email, role, status, created), search/filters, invite/create user (server action), activate/deactivate, change role |
| Clients Hub | `/app/admin/clients` | **PASS** | Table with contact + status; link to new + [id]; Realtime list. KPIs/export/import/brand kit in place or placeholder |
| Task Control Center | `/app/admin/tasks` | **PASS** | Create task (client, post, type/title, assignee, due, priority), activity log on create; list exists |
| Approval Hub | `/app/admin/approvals` | **PASS** | Table of tasks in review, client map, link to task review; Realtime |
| Tasks list | `/app/tasks` | **PASS** | Role-based listing |
| Single Task View | `/app/task/[id]` | **PASS** | Detail client, comments, approvals, activity logs, dynamic fields, approve flow |
| Reports | `/app/admin/reports` | **PASS** | Date range, KPIs, by status / by assignee / by client charts, Export CSV |
| Supervisor Task Center | `/app/supervisor/tasks` | **PASS** | Uses same task control pattern (can reuse component or duplicate route) |

---

## Routes created/updated

- **Created:** `/app/admin/reports` (page + ReportsClient with Recharts + CSV export).
- **Updated:** `/app/admin` — full overview with KPI grid, workload chart, quick actions.
- **Updated:** `/app/admin/users` — table with search, role/status filters, Invite/Create user drawer (server actions: `inviteUserByEmail`, `createUserWithPassword`).
- **Updated:** `/app/admin/clients` — clients list now selects `email`, `phone`, `status`, `created_at`; table shows contact, status, created; Realtime subscription updated.
- **Existing:** `/app/admin/tasks`, `/app/admin/approvals`, `/app/admin/clients/new`, `/app/admin/clients/[id]`, `/app/tasks`, `/app/task/[id]`, `/app/supervisor/*`, `/app/smm/*`, `/app/designer/*`, `/app/editor/*`.

---

## Key components created/updated

| Component | Path | Purpose |
|-----------|------|---------|
| KpiCard | `components/ui/kpi-card.tsx` | KPI with optional href, icon, trend, variant |
| Drawer | `components/ui/drawer.tsx` | Right-side panel (sm/md/lg/xl) |
| Skeleton / TableRowSkeleton / KpiCardSkeleton | `components/ui/skeleton.tsx` | Loading states |
| EmptyState | `components/ui/empty-state.tsx` | Empty list state with optional action |
| StatusChip | `components/ui/status-chip.tsx` | Task + client status mapping |
| InviteUserForm | `app/app/admin/users/invite-user-form.tsx` | Email + role + optional temp password, calls server actions |
| UsersTable | `app/app/admin/users/users-table.tsx` | Search, role/status filters, activate/deactivate, invite drawer |
| AdminDashboardCharts | `app/app/admin/admin-dashboard-charts.tsx` | Workload bar chart (Recharts) |
| ReportsClient | `app/app/admin/reports/reports-client.tsx` | Date range, KPIs, bar charts, Export CSV |

---

## DB columns/tables and SQL to apply in Supabase

Already added in migrations:

- **006_admin_schema_extensions.sql**
  - `profiles.email` (TEXT, nullable).
  - `tasks.title`, `tasks.description`, `tasks.start_at`; backfill `title` from `type`.
  - `clients.email`, `clients.phone`, `clients.status` (with CHECK), indexes on `status` and `created_at`.
  - `client_notes` table + RLS (admin/supervisor full; others read when linked via tasks/posts).

- **007_storage_buckets.sql**
  - Buckets: `task-attachments`, `task-outputs` (private).
  - Storage policies for authenticated users.

If you have not run these, apply in order in Supabase SQL Editor:

1. Run `supabase/migrations/006_admin_schema_extensions.sql`.
2. Run `supabase/migrations/007_storage_buckets.sql`.

No additional SQL is required for the current implementation. Optional future: `task_checklist_items` table or store checklist in `tasks.fields_json`; `notifications` table if you add in-app notifications.

---

## Storage buckets

| Bucket | Purpose | Visibility |
|--------|---------|------------|
| `task-attachments` | Task attachments | Private (signed URLs) |
| `task-outputs` | Task output files | Private (signed URLs) |
| `brand-assets` / brand-kits | Client brand kit assets | Private (existing or create if missing) |

Ensure bucket policies allow authenticated users (or restrict by RLS if you add object-level checks). Created in `007_storage_buckets.sql` for task-attachments and task-outputs.

---

## What you must do manually (MANUAL STEPS FOR YOU – ADMIN)

### 1. Environment variables

In your app (e.g. `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (safe for client).
- `SUPABASE_SERVICE_ROLE_KEY` — **Server-only.** Used for invite/create user (Admin API). Never expose in client or commit to git.

Optional:

- `NEXT_PUBLIC_APP_URL` — Base URL for invite redirect (e.g. `https://yourapp.com`). Used in invite link.

### 2. Apply SQL migrations in Supabase

1. Open Supabase Dashboard → SQL Editor.
2. Run in order:
   - Contents of `supabase/migrations/006_admin_schema_extensions.sql`
   - Contents of `supabase/migrations/007_storage_buckets.sql`
3. If you already ran earlier migrations (001–005), only run 006 and 007 if not yet applied.

### 3. First admin user and role in `profiles`

- Create the first user via Supabase Auth (Dashboard → Authentication → Users) or via your app’s sign-up if allowed.
- In Table Editor → `profiles`, find the row for that user and set:
  - `role` = `ADMIN`
  - Optionally set `email` to match auth email (for display in admin Users table).
- To allow invite/create from the app, set `SUPABASE_SERVICE_ROLE_KEY` in env; then “Invite / Create user” in Admin → Users will work.

### 4. Storage bucket creation and policies

- Buckets `task-attachments` and `task-outputs` are created in `007_storage_buckets.sql` with policies for `authenticated` users.
- If you use a separate “brand-kits” or “brand-assets” bucket for client brand kits, create it in Dashboard → Storage and add policies (e.g. authenticated read/write, or scoped by client_id if you store path metadata).

### 5. Auth settings (Supabase Dashboard)

- **Email provider:** Configure SMTP (or use Supabase default) so invite emails are sent.
- **Redirect URLs:** Add your app URLs (e.g. `https://yourapp.com/login`, `http://localhost:3000/login`) in Authentication → URL Configuration so invite links work.

### 6. Seed / first data (optional)

- No mandatory seed script is required. You can insert a test client and tasks manually, or add a `supabase/seed.sql` that inserts one admin profile and a sample client/task if needed.

### 7. RTL / LTR (Arabic/English)

- Layout and components use logical CSS where applicable. For full RTL, set `dir="rtl"` on `<html>` or a wrapper when locale is Arabic; drawer can be mirrored with `dir` (e.g. open from left in RTL). Fonts: Rubik (EN), Cairo (AR) — ensure they are loaded in your layout/font config.

### 8. Security summary

- All admin-only operations that create users or use the Admin API use **server-only** code and `SUPABASE_SERVICE_ROLE_KEY`. The key is never sent to the client.
- RLS remains enabled; existing policies on `profiles`, `clients`, `tasks`, `approvals`, `client_notes` are unchanged. Do not disable RLS.
- Storage policies in 007 restrict access to authenticated users; tighten further (e.g. by `user_id` or task ownership) if required.

---

## Summary

- **Admin Dashboard:** Overview KPIs, workload chart, quick links — **done.**
- **Users:** Table with search/filters, invite by email or create with temp password (server actions), activate/deactivate, change role — **done.**
- **Clients:** Table with contact and status; new + [id] pages; Realtime — **done.** Export/import CSV and full Brand Kit upload can be added next.
- **Task Control Center:** Create task with title, assignee, due, priority, activity log — **done.** Kanban/Calendar/List views and task detail drawer can be added on top of existing list/create.
- **Approval Hub:** Tasks in review table with link to task — **done.** Detail drawer and bulk actions can be added.
- **Reports:** Date range, KPIs, charts (by status, assignee, client), Export CSV — **done.**
- **Single Task View:** Existing task detail page with comments, approvals, activity — **unchanged; compatible** with new schema.

Apply migrations 006 and 007, set env vars, create first admin in `profiles`, and configure auth redirects and storage as above to go live.
