-- Admin/UX schema extensions: tasks title/description/start_at, clients contact & status, client_notes, profiles.email

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Tasks: title, description, start_at (type remains for task type label)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
-- Backfill title from type for existing rows
UPDATE tasks SET title = type WHERE title IS NULL;

-- Clients: contact & status
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive', 'pending_verification', 'banned'));
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Client notes (internal, team-visible)
CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

-- RLS: client_notes (admin/supervisor full; others read if they can read the client)
CREATE POLICY "client_notes_admin_supervisor" ON client_notes FOR ALL USING (
  (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'SUPERVISOR')
);
CREATE POLICY "client_notes_select_linked" ON client_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM tasks t WHERE t.client_id = client_notes.client_id AND t.assignee_id = auth.uid())
  OR EXISTS (SELECT 1 FROM posts p WHERE p.client_id = client_notes.client_id AND (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'SMM')
);
CREATE POLICY "client_notes_insert_admin_supervisor" ON client_notes FOR INSERT WITH CHECK (
  (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'SUPERVISOR')
);
