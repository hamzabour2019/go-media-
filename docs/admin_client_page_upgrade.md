# Admin Client Page Upgrade (Client 360)

## What existed before

- Existing route: `app/app/admin/clients/[id]/page.tsx`
- Basic page showed:
  - client name
  - brand kit form
  - simple task list
  - simple posts list

## What was improved

The same route was upgraded into a full **Client 360 hub** with:

1. **Sticky identity header**
   - Client name + logo/avatar
   - Status chip
   - Account owner
   - Quick actions: New Post, New Task, Update Brand Kit, Export CSV

2. **KPI row**
   - Posts (7d / 30d)
   - Tasks overdue / in progress / in review
   - Avg completion time
   - Approval SLA (shows `Not configured` when source timestamps are missing)

3. **Tabbed workspace**
   - Overview: recent activity + next deadlines
   - Calendar/Posts: filters, list, row actions, duplicate
   - Tasks (Production): filters, reassign, status change, overdue/remaining
   - Assets/Brand Kit: brand kit details + editor
   - Notes: internal notes feed + add note

4. **Detail drawers**
   - Task detail drawer
   - Post detail drawer
   - Full task page link from drawer

5. **Search / filter / export**
   - Global search across tasks/posts/notes
   - Per-tab filters
   - CSV export for tasks/posts

## Files changed

- `app/app/admin/clients/[id]/page.tsx`
- `app/app/admin/clients/[id]/client-360-hub.tsx` (new)

## Missing/optional schema items and SQL suggestions

The current upgrade works with existing schema, but for best analytics:

1. **Task completion timestamp**
   - Add `tasks.completed_at timestamptz` (optional)
   - This makes completion KPI accurate without inferring from approvals.

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
```

2. **Approval review timestamp**
   - If approval SLA should be exact, store explicit review-entered timestamp.

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS entered_review_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_tasks_entered_review_at ON tasks(entered_review_at);
```

3. **Asset library metadata table (optional)**
   - If full client assets library is needed (not just brand kit files), add:

```sql
CREATE TABLE IF NOT EXISTS client_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES auth.users(id),
  file_path TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_client_assets_client_id ON client_assets(client_id);
ALTER TABLE client_assets ENABLE ROW LEVEL SECURITY;
```

## Manual Supabase steps (if any)

- No mandatory DB migration required for the core Client 360 UI itself.
- Optional metrics improvements above can be applied if you need higher KPI precision.

## Performance notes / indexes recommended

To keep Client 360 fast with larger data:

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_client_id_due_at ON tasks(client_id, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id_status ON tasks(client_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_client_id_publish_at ON posts(client_id, publish_at);
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id_created_at ON client_notes(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_created_at ON activity_logs(entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_approvals_task_created_at ON approvals(task_id, created_at);
```

