-- Add profiles.is_active and tasks.assigned_by

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
