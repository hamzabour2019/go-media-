# Masar Agency Task Manager (M-TM) – Product Audit Report

**Audit date:** 2026-03-04  
**Scope:** Routes, Auth, DB schema, RLS, Core features, Realtime, GO brand UI.

---

## 1) ROUTES & PAGES

| Item | Status | Notes |
|------|--------|------|
| **Public** | | |
| `/login` (first screen) | PASS | Exists, redirects to role dashboard when logged in |
| `/forgot-password` | PASS | Implemented |
| **Protected base** | | |
| `/app` (protected layout) | PASS | Layout with sidebar/topbar, redirects to role dashboard |
| `/app/profile` | PASS | Implemented |
| `/app/notifications` | PASS | Full page + panel in topbar |
| `/app/tasks` (role-filtered list) | PASS | Implemented (role-filtered, filters) |
| `/app/task/[id]` | PASS | Task details, comments, approvals, activity |
| **Admin** | | |
| `/app/admin` | PASS | Dashboard with quick links |
| `/app/admin/users` | PASS | User/role management |
| `/app/admin/clients` | PASS | Clients hub |
| `/app/admin/clients/[id]` | PASS | Client tasks + posts lists added |
| `/app/admin/dynamic-fields` | PASS | Redirects to /app/admin/fields |
| `/app/admin/task-templates` | PASS | Implemented |
| `/app/admin/approvals` | PASS | Approval hub + output preview |
| `/app/admin/analytics` | PASS | Workload + avg completion time |
| `/app/admin/tasks` | PASS | Task Control Center (create/assign) |
| **Supervisor** | | |
| `/app/supervisor` | PASS | Overview |
| `/app/supervisor/ops` | PASS | Dedicated ops page (team + approvals + workload) |
| `/app/supervisor/private` | PASS | Private workspace |
| `/app/supervisor/tasks` | PASS | Task Control Center |
| `/app/supervisor/approvals` | PASS | |
| `/app/supervisor/team` | PASS | |
| **SMM** | | |
| `/app/smm` | PASS | Dashboard |
| `/app/smm/calendar` | PASS | Content calendar + drag & drop |
| `/app/smm/posts` | PASS | Implemented |
| **Designer** | | |
| `/app/designer` | PASS | Dashboard |
| `/app/designer/tasks` | PASS | Implemented |
| **Editor** | | |
| `/app/editor` | PASS | Dashboard |
| `/app/editor/tasks` | PASS | Implemented |

---

## 2) AUTH & REDIRECTION

| Item | Status | Notes |
|------|--------|------|
| Middleware protects `/app` | PASS | `middleware.ts` + `lib/supabase/middleware.ts` |
| Login uses Supabase Auth (email/password) | PASS | `app/login/login-form.tsx` |
| Redirect by role after login | PASS | Root `/` and `/app` use `getRedirectPath(profile.role)` |
| Logout works | PASS | Topbar logout |
| Role from `profiles` on session | PASS | `getProfile()` in session helpers |

---

## 3) SUPABASE DB SCHEMA

| Item | Status | Notes |
|------|--------|------|
| `profiles` (id, name, role, created_at, is_active) | PASS | Migration 005 adds is_active |
| `clients` | PASS | |
| `brand_kits` | PASS | |
| `posts` | PASS | |
| `tasks` (assignee_id, assigned_by, client_id, post_id, type, status, due_at, priority, fields_json, output_json) | PASS | Migration 005 adds assigned_by |
| `dynamic_fields` | PASS | |
| `task_templates` | PASS | |
| `task_dependencies` | PASS | |
| `comments` | PASS | |
| `approvals` | PASS | |
| `activity_logs` | PASS | |
| `notifications` | PASS | |
| `private_tasks` | PASS | |
| Indexes (tasks.assignee_id, client_id, post_id, posts.client_id, notifications.user_id) | PASS | In 001_initial_schema.sql |

---

## 4) RLS

| Item | Status | Notes |
|------|--------|------|
| RLS enabled on all tables | PASS | 002_rls_policies.sql |
| Tasks: user only assignee or admin/supervisor | PASS | |
| Admin/Supervisor full access operational | PASS | |
| private_tasks owner-only | PASS | |
| Comments: read if can read task; insert auth; update/delete author or admin | PASS | |
| Notifications: user_id = auth.uid() | PASS | |
| Clients/brand_kits linked or admin | PASS | |

---

## 5) CORE FEATURES

| Item | Status | Notes |
|------|--------|------|
| **A) Task Control Center** | PASS | Create task, assign, assigned_by, notification via trigger, activity_log on create |
| **B) Role task dashboards** | PASS | Counters, filters, link to task detail (designer/editor) |
| **C) Task detail** | PASS | Metadata, dynamic fields, comments, approve/request changes, output submission (URL + file to Storage, output_json) |
| **D) Approval Hub** | PASS | List + output preview column + link to task |
| **E) SMM Calendar** | PASS | Calendar, create post, drag reschedule; auto task chain from task_templates; due_at updated when publish_at changes (on drop) |
| **F) Supervisor dual mode** | PASS | Ops (overview/approvals/team) + private workspace |
| **G) Analytics** | PASS | Workload per assignee + avg completion time (approved tasks) |

---

## 6) REALTIME

| Item | Status | Notes |
|------|--------|------|
| tasks changes | PASS | Designer/editor lists, task detail |
| approvals/comments/notifications | PASS | Notifications panel, task detail comments |

---

## 7) GO BRAND UI

| Item | Status | Notes |
|------|--------|------|
| Rubik/Cairo via next/font | PASS | app/layout.tsx |
| Gradient + modular arrow pattern | PASS | Login + app layout |
| Glass/dark cards | PASS | glass-card, globals.css |
| RTL/LTR (Arabic) | PARTIAL | [dir="rtl"] in CSS; no route-level dir switch |
| Status chips, spacing | PASS | |

---

## MISSING ITEMS (all implemented)

1. **Routes (done):** `/app/profile`, `/app/notifications`, `/app/tasks`, `/forgot-password`, `/app/admin/task-templates`, `/app/admin/tasks`, `/app/admin/dynamic-fields` (alias or redirect from fields), `/app/supervisor/ops`, `/app/supervisor/tasks`, `/app/smm/posts`, `/app/designer/tasks`, `/app/editor/tasks`.
2. **Schema:** Add `profiles.is_active`, `tasks.assigned_by` (migration 005).
3. **Client [id]:** Show client’s tasks and posts on client detail page.
4. **Task Control Center:** Admin + Supervisor pages to create task, assign/reassign, set assigned_by; ensure notification + activity_log on assign.
5. **Task detail:** Output submission (Storage + output_json).
6. **Approval hub:** Quick preview of output + key fields.
7. **SMM Calendar:** On post create, generate tasks from task_templates (link post_id, set due_at from buffer); when post publish_at changes, update linked tasks due_at.
8. **Analytics:** Avg completion time (e.g. by role/assignee).
9. **Sidebar/nav:** Add Profile, Notifications, Tasks where appropriate; add Task Control Center and task-templates for admin; ops + tasks for supervisor; posts for SMM; designer/tasks, editor/tasks links.

---

## How to run locally

```bash
cd "c:\Users\HP\Desktop\go media"
npm install
cp .env.example .env.local   # then set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Open http://localhost:3000. First screen is login; after login you are redirected to your role dashboard.

---

## How to apply SQL migrations in Supabase

1. Open [Supabase Dashboard](https://app.supabase.com) → your project → **SQL Editor**.
2. Run in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_storage_and_realtime.sql`
   - `supabase/migrations/004_notification_triggers.sql`
   - (After implementation) `supabase/migrations/005_schema_additions.sql` for is_active and assigned_by
3. Create first user in **Authentication → Users**; then set role:  
   `UPDATE profiles SET role = 'ADMIN' WHERE id = 'user-uuid';`

---

## File paths changed by implementation

- `docs/audit.md` – this file (audit report)
- `supabase/migrations/005_schema_additions.sql` – NEW (profiles.is_active, tasks.assigned_by)
- `app/forgot-password/page.tsx` – NEW
- `app/forgot-password/forgot-password-form.tsx` – NEW
- `app/login/login-form.tsx` – Forgot password link
- `app/app/profile/page.tsx` – NEW
- `app/app/profile/profile-form.tsx` – NEW
- `app/app/notifications/page.tsx` – NEW
- `components/notifications/notifications-list.tsx` – NEW
- `app/app/tasks/page.tsx` – NEW (role-filtered tasks list)
- `app/app/tasks/tasks-list.tsx` – NEW
- `app/app/admin/dynamic-fields/page.tsx` – NEW (redirects to /app/admin/fields)
- `app/app/admin/task-templates/page.tsx` – NEW
- `app/app/admin/task-templates/task-templates-manager.tsx` – NEW
- `app/app/admin/tasks/page.tsx` – NEW (Task Control Center)
- `app/app/admin/tasks/task-control-center.tsx` – NEW
- `app/app/admin/clients/[id]/page.tsx` – Client tasks + posts lists
- `app/app/admin/approvals/page.tsx` – Pass output_json, showPreview
- `app/app/admin/approvals/approval-list.tsx` – Output preview column
- `app/app/admin/analytics/page.tsx` – Pass approvals for completion time
- `app/app/admin/analytics/analytics-charts.tsx` – Avg completion time
- `app/app/supervisor/ops/page.tsx` – NEW
- `app/app/supervisor/tasks/page.tsx` – NEW (Task Control Center)
- `app/app/smm/posts/page.tsx` – NEW
- `app/app/smm/posts/posts-list.tsx` – NEW
- `app/app/smm/calendar/calendar-view.tsx` – Auto task chain on post create; update task due_at on drop
- `app/app/designer/tasks/page.tsx` – NEW
- `app/app/editor/tasks/page.tsx` – NEW
- `app/app/task/[id]/task-detail-client.tsx` – Output submission (URL + file upload)
- `components/layout/app-sidebar.tsx` – Profile, Notifications, Tasks; dynamic-fields, task-templates, tasks, ops, posts, designer/tasks, editor/tasks
