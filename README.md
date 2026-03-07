# GO Media Agency Task Manager (M-TM)

Production-ready agency task manager with role-based dashboards, Supabase (Auth + Postgres + RLS + Realtime + Storage), and GO brand styling.

## Tech stack

- **Next.js** (App Router) + **TypeScript**
- **TailwindCSS** for UI
- **Supabase** (Auth, Postgres, RLS, Realtime, Storage)
- **react-hook-form** + **zod** for forms
- **FullCalendar** for content calendar (SMM)
- **Rubik** (English) / **Cairo** (Arabic) fonts

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from [Supabase Dashboard](https://app.supabase.com) → Project Settings → API.

### 3. Apply database schema in Supabase

1. Open your Supabase project → **SQL Editor**.
2. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_storage_and_realtime.sql`
   - `supabase/migrations/004_notification_triggers.sql`
   - `supabase/migrations/005_schema_additions.sql`
   - `supabase/migrations/006_admin_schema_extensions.sql`
   - `supabase/migrations/007_storage_buckets.sql`
   - `supabase/migrations/008_profile_extensions.sql`
   - `supabase/migrations/009_avatars_bucket.sql`

If Realtime fails to add tables (already in publication), you can skip those lines or enable Realtime for `tasks`, `comments`, `approvals`, `notifications` from the Dashboard.

### 4. Seed admin user and set role

1. **Create a user** via Supabase Dashboard → Authentication → Users → “Add user” (email + password), or sign up from the app’s `/login` page if you enable signup.
2. **Set role to ADMIN**: in SQL Editor run (replace with your user UUID from Authentication → Users):

```sql
UPDATE profiles SET role = 'ADMIN' WHERE id = 'YOUR_USER_UUID';
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the login screen. After signing in, you’re redirected to your role dashboard:

- **ADMIN** → `/app/admin`
- **SUPERVISOR** → `/app/supervisor`
- **SMM** → `/app/smm`
- **DESIGNER** → `/app/designer`
- **EDITOR** → `/app/editor`

## Project structure

```
/app
  /login          # Login page (brand gradient + glass card)
  /app            # Protected app (layout: sidebar + topbar)
    /admin        # Users, clients, brand kits, dynamic fields, approvals, analytics
    /supervisor   # Overview, approvals, team, private workspace
    /smm          # Dashboard, content calendar
    /designer     # My tasks
    /editor       # My tasks
    /task/[id]    # Task detail (comments, approvals, activity)
/lib
  /supabase       # Browser + server client, middleware helper
  /auth           # Session, profile, redirect by role
  /types          # DB types
/components       # Layout (sidebar, topbar), notifications panel
/supabase
  /migrations     # SQL schema + RLS + triggers
  seed.sql        # How to seed admin
```

## Features

- **Auth**: Email/password via Supabase; middleware protects `/app/*`; logout in topbar.
- **Role-based dashboards**: Each role has its own nav and pages.
- **RLS**: Tasks visible by assignee or admin/supervisor; private_tasks only by owner; clients/posts/comments/approvals/notifications as per spec.
- **Realtime**: Task lists, approvals, and notifications update live.
- **Notifications**: Created when tasks are assigned, submitted for review, or when changes are requested (DB triggers).
- **Brand**: Animated gradient background, glass cards, Rubik/Cairo.

## Optional: RTL / Arabic

Layout supports `dir="rtl"` and `font-arabic` (Cairo). You can switch direction and font based on user preference or locale.

## Deploy on Hostinger (Node.js / VPS)

This project is configured with `output: "standalone"` in `next.config.mjs`.

### 1. Build on your local machine (or server)

```bash
npm install
npm run build
```

### 2. Copy standalone artifacts

Copy these to your Hostinger app directory:

- `.next/standalone`
- `.next/static`  -> place inside `.next/standalone/.next/static`
- `public`        -> place inside `.next/standalone/public`

### 3. Set environment variables on Hostinger

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NODE_ENV=production`
- `PORT` (if Hostinger provides one)

### 4. Start command

Use this command in Hostinger startup settings:

```bash
node .next/standalone/server.js
```

You can also use npm script:

```bash
npm run start:standalone
```
