-- Notifications: create when task assigned or status changes to review / changes_requested

CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
    INSERT INTO public.notifications (user_id, type, title, body, meta_json)
    VALUES (NEW.assignee_id, 'task_assigned', 'New task assigned', 'You have been assigned to task: ' || NEW.type, jsonb_build_object('task_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_assigned
  AFTER INSERT OR UPDATE OF assignee_id ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_assigned();

-- Notify admin/supervisor when status = review
CREATE OR REPLACE FUNCTION public.notify_task_review()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
BEGIN
  IF NEW.status = 'review' AND (OLD.status IS DISTINCT FROM 'review') THEN
    FOR r IN SELECT id FROM public.profiles WHERE role IN ('ADMIN', 'SUPERVISOR')
    LOOP
      INSERT INTO public.notifications (user_id, type, title, body, meta_json)
      VALUES (r.id, 'task_review', 'Task submitted for review', 'Task "' || NEW.type || '" is waiting for approval', jsonb_build_object('task_id', NEW.id));
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_review
  AFTER INSERT OR UPDATE OF status ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_review();

-- Notify assignee when changes_requested
CREATE OR REPLACE FUNCTION public.notify_changes_requested()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'changes_requested' AND NEW.assignee_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, meta_json)
    VALUES (NEW.assignee_id, 'changes_requested', 'Changes requested', 'Changes were requested on task: ' || NEW.type, jsonb_build_object('task_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_changes_requested
  AFTER INSERT OR UPDATE OF status ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_changes_requested();
