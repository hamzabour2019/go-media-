-- Enhanced notifications for tasks:
-- - Assignment on create/change
-- - Deadline set/updated
-- - Review / approved / changes requested
-- - Comment notifications
-- - Due-soon reminders (trigger-based + helper function)

DROP TRIGGER IF EXISTS on_task_assigned ON public.tasks;
DROP TRIGGER IF EXISTS on_task_review ON public.tasks;
DROP TRIGGER IF EXISTS on_changes_requested ON public.tasks;
DROP FUNCTION IF EXISTS public.notify_task_assigned();
DROP FUNCTION IF EXISTS public.notify_task_review();
DROP FUNCTION IF EXISTS public.notify_changes_requested();

CREATE OR REPLACE FUNCTION public.notify_task_events()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
  task_label TEXT;
BEGIN
  task_label := COALESCE(NEW.title, NEW.type, 'Task');

  IF TG_OP = 'INSERT' THEN
    IF NEW.assignee_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, meta_json)
      VALUES (
        NEW.assignee_id,
        'task_assigned',
        'New task assigned',
        'You have a new task: ' || task_label,
        jsonb_build_object('task_id', NEW.id, 'deadline', NEW.due_at)
      );
    END IF;

    IF NEW.assignee_id IS NOT NULL AND NEW.due_at IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, meta_json)
      VALUES (
        NEW.assignee_id,
        'task_deadline_set',
        'Task deadline set',
        'Deadline for "' || task_label || '" is ' || to_char(NEW.due_at, 'YYYY-MM-DD HH24:MI'),
        jsonb_build_object('task_id', NEW.id, 'deadline', NEW.due_at)
      );
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id AND NEW.assignee_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, meta_json)
      VALUES (
        NEW.assignee_id,
        'task_reassigned',
        'Task assigned to you',
        'You were assigned: ' || task_label,
        jsonb_build_object('task_id', NEW.id, 'deadline', NEW.due_at)
      );
    END IF;

    IF NEW.due_at IS DISTINCT FROM OLD.due_at AND NEW.assignee_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, meta_json)
      VALUES (
        NEW.assignee_id,
        'task_deadline_updated',
        'Deadline updated',
        'Deadline for "' || task_label || '" is now ' || COALESCE(to_char(NEW.due_at, 'YYYY-MM-DD HH24:MI'), 'not set'),
        jsonb_build_object('task_id', NEW.id, 'deadline', NEW.due_at)
      );
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'review' THEN
        FOR r IN SELECT id FROM public.profiles WHERE role IN ('ADMIN', 'SUPERVISOR')
        LOOP
          INSERT INTO public.notifications (user_id, type, title, body, meta_json)
          VALUES (
            r.id,
            'task_review',
            'Task submitted for review',
            '"' || task_label || '" is waiting for approval',
            jsonb_build_object('task_id', NEW.id)
          );
        END LOOP;
      END IF;

      IF NEW.status = 'changes_requested' AND NEW.assignee_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, body, meta_json)
        VALUES (
          NEW.assignee_id,
          'changes_requested',
          'Changes requested',
          'Changes were requested for "' || task_label || '"',
          jsonb_build_object('task_id', NEW.id)
        );
      END IF;

      IF NEW.status = 'approved' AND NEW.assignee_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, body, meta_json)
        VALUES (
          NEW.assignee_id,
          'task_approved',
          'Task approved',
          '"' || task_label || '" was approved',
          jsonb_build_object('task_id', NEW.id)
        );
      END IF;
    END IF;

    -- Trigger-based reminder when due date is within 24h (on updates).
    IF NEW.assignee_id IS NOT NULL
       AND NEW.due_at IS NOT NULL
       AND NEW.status IN ('todo', 'in_progress', 'review', 'changes_requested')
       AND NEW.due_at > NOW()
       AND NEW.due_at <= NOW() + INTERVAL '24 hours'
    THEN
      INSERT INTO public.notifications (user_id, type, title, body, meta_json)
      SELECT
        NEW.assignee_id,
        'task_due_soon',
        'Task due soon',
        '"' || task_label || '" is due in less than 24 hours',
        jsonb_build_object('task_id', NEW.id, 'deadline', NEW.due_at)
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.notifications n
        WHERE n.user_id = NEW.assignee_id
          AND n.type = 'task_due_soon'
          AND (n.meta_json ->> 'task_id')::uuid = NEW.id
          AND n.created_at > NOW() - INTERVAL '6 hours'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_events_notify
  AFTER INSERT OR UPDATE OF assignee_id, due_at, status ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_events();

CREATE OR REPLACE FUNCTION public.notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
  t RECORD;
  task_label TEXT;
BEGIN
  SELECT id, assignee_id, assigned_by, COALESCE(title, type, 'Task') AS label
  INTO t
  FROM public.tasks
  WHERE id = NEW.task_id;

  task_label := COALESCE(t.label, 'Task');

  IF t.assignee_id IS NOT NULL AND t.assignee_id <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, meta_json)
    VALUES (
      t.assignee_id,
      'task_comment',
      'New comment',
      'New comment on "' || task_label || '"',
      jsonb_build_object('task_id', NEW.task_id, 'comment_id', NEW.id)
    );
  END IF;

  IF t.assigned_by IS NOT NULL AND t.assigned_by <> NEW.author_id AND t.assigned_by <> t.assignee_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, meta_json)
    VALUES (
      t.assigned_by,
      'task_comment',
      'New comment',
      'New comment on "' || task_label || '"',
      jsonb_build_object('task_id', NEW.task_id, 'comment_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_notify ON public.comments;
CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_comment();

-- Helper for scheduled reminders (optional with pg_cron)
CREATE OR REPLACE FUNCTION public.send_due_task_reminders()
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, meta_json)
  SELECT
    t.assignee_id,
    'task_due_soon',
    'Task due soon',
    '"' || COALESCE(t.title, t.type, 'Task') || '" is due in less than 24 hours',
    jsonb_build_object('task_id', t.id, 'deadline', t.due_at)
  FROM public.tasks t
  WHERE t.assignee_id IS NOT NULL
    AND t.due_at IS NOT NULL
    AND t.status IN ('todo', 'in_progress', 'review', 'changes_requested')
    AND t.due_at > NOW()
    AND t.due_at <= NOW() + INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = t.assignee_id
        AND n.type = 'task_due_soon'
        AND (n.meta_json ->> 'task_id')::uuid = t.id
        AND n.created_at > NOW() - INTERVAL '6 hours'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
