-- Business logic hardening:
-- - lock down direct profile/task/post writes from browser clients
-- - unify post statuses
-- - add trusted workflow RPCs for tasks and posts
-- - tighten task output storage access

-- ---------- POST STATUS VOCABULARY ----------
UPDATE public.posts
SET status = CASE
  WHEN status = 'approved' THEN 'scheduled'
  WHEN status IN ('draft', 'pending_approval', 'scheduled', 'published') THEN status
  ELSE 'draft'
END;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'pending_approval', 'scheduled', 'published'));

-- ---------- PROFILE WRITE LOCKDOWN ----------
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- ---------- TASK/POST/APPROVAL WRITE LOCKDOWN ----------
DROP POLICY IF EXISTS "tasks_assignee_select_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assignee_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_admin_supervisor_all" ON public.tasks;

CREATE POLICY "tasks_assignee_select" ON public.tasks
  FOR SELECT USING (assignee_id = auth.uid());

CREATE POLICY "tasks_admin_supervisor_select" ON public.tasks
  FOR SELECT USING (public.is_admin_or_supervisor());

DROP POLICY IF EXISTS "posts_smm_all" ON public.posts;
DROP POLICY IF EXISTS "posts_admin_supervisor_all" ON public.posts;

CREATE POLICY "posts_smm_select_all" ON public.posts
  FOR SELECT USING (public.get_my_role() = 'SMM');

CREATE POLICY "posts_admin_supervisor_select_all" ON public.posts
  FOR SELECT USING (public.is_admin_or_supervisor());

DROP POLICY IF EXISTS "approvals_admin_supervisor_write" ON public.approvals;

-- ---------- STORAGE HARDENING ----------
DROP POLICY IF EXISTS "brand_assets_upload_admin" ON storage.objects;
CREATE POLICY "brand_assets_upload_admin_supervisor"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets'
  AND public.get_my_role() IN ('ADMIN', 'SUPERVISOR')
);

CREATE POLICY "brand_assets_upload_smm_posts_only"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets'
  AND public.get_my_role() = 'SMM'
  AND COALESCE((storage.foldername(name))[1], '') = 'posts'
);

DROP POLICY IF EXISTS "task_outputs_authenticated" ON storage.objects;

CREATE POLICY "task_outputs_select_task_access"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-outputs'
  AND COALESCE((storage.foldername(name))[1], '') = 'tasks'
  AND COALESCE((storage.foldername(name))[2], '') ~ '^[0-9a-fA-F-]{36}$'
  AND EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = NULLIF((storage.foldername(name))[2], '')::uuid
      AND (t.assignee_id = auth.uid() OR public.is_admin_or_supervisor())
  )
);

CREATE POLICY "task_outputs_insert_task_access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-outputs'
  AND COALESCE((storage.foldername(name))[1], '') = 'tasks'
  AND COALESCE((storage.foldername(name))[2], '') ~ '^[0-9a-fA-F-]{36}$'
  AND EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = NULLIF((storage.foldername(name))[2], '')::uuid
      AND (t.assignee_id = auth.uid() OR public.is_admin_or_supervisor())
  )
);

CREATE POLICY "task_outputs_update_task_access"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'task-outputs'
  AND COALESCE((storage.foldername(name))[1], '') = 'tasks'
  AND COALESCE((storage.foldername(name))[2], '') ~ '^[0-9a-fA-F-]{36}$'
  AND EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = NULLIF((storage.foldername(name))[2], '')::uuid
      AND (t.assignee_id = auth.uid() OR public.is_admin_or_supervisor())
  )
);

CREATE POLICY "task_outputs_delete_task_access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-outputs'
  AND COALESCE((storage.foldername(name))[1], '') = 'tasks'
  AND COALESCE((storage.foldername(name))[2], '') ~ '^[0-9a-fA-F-]{36}$'
  AND EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = NULLIF((storage.foldername(name))[2], '')::uuid
      AND (t.assignee_id = auth.uid() OR public.is_admin_or_supervisor())
  )
);

-- ---------- TRUSTED WORKFLOW FUNCTIONS ----------
DROP FUNCTION IF EXISTS public.create_task_workflow(UUID, TEXT, TEXT, UUID, TIMESTAMPTZ, INTEGER, UUID);
CREATE OR REPLACE FUNCTION public.create_task_workflow(
  p_client_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_assignee_id UUID,
  p_due_at TIMESTAMPTZ,
  p_priority INTEGER DEFAULT 1,
  p_post_id UUID DEFAULT NULL
)
RETURNS public.tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.tasks;
BEGIN
  IF NOT public.is_admin_or_supervisor() THEN
    RAISE EXCEPTION 'Only admins and supervisors can create tasks';
  END IF;

  IF p_type IS NULL OR btrim(p_type) = '' THEN
    RAISE EXCEPTION 'Task type is required';
  END IF;

  INSERT INTO public.tasks (
    client_id,
    post_id,
    type,
    title,
    assignee_id,
    due_at,
    priority,
    assigned_by
  )
  VALUES (
    p_client_id,
    p_post_id,
    btrim(p_type),
    NULLIF(btrim(COALESCE(p_title, p_type)), ''),
    p_assignee_id,
    p_due_at,
    GREATEST(COALESCE(p_priority, 1), 1),
    auth.uid()
  )
  RETURNING * INTO v_task;

  INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_id, meta_json)
  VALUES (
    'task',
    v_task.id,
    'created',
    auth.uid(),
    jsonb_build_object('type', v_task.type, 'client_id', v_task.client_id, 'post_id', v_task.post_id)
  );

  RETURN v_task;
END;
$$;

DROP FUNCTION IF EXISTS public.reassign_task_workflow(UUID, UUID);
CREATE OR REPLACE FUNCTION public.reassign_task_workflow(
  p_task_id UUID,
  p_assignee_id UUID
)
RETURNS public.tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.tasks;
BEGIN
  IF NOT public.is_admin_or_supervisor() THEN
    RAISE EXCEPTION 'Only admins and supervisors can reassign tasks';
  END IF;

  UPDATE public.tasks
  SET assignee_id = p_assignee_id
  WHERE id = p_task_id
  RETURNING * INTO v_task;

  IF v_task.id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_id, meta_json)
  VALUES (
    'task',
    v_task.id,
    'reassigned',
    auth.uid(),
    jsonb_build_object('assignee_id', p_assignee_id)
  );

  RETURN v_task;
END;
$$;

DROP FUNCTION IF EXISTS public.transition_task_workflow(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.transition_task_workflow(
  p_task_id UUID,
  p_target_status TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS public.tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.tasks;
  v_actor_is_manager BOOLEAN;
  v_actor_is_assignee BOOLEAN;
  v_next_status TEXT;
  v_action TEXT;
  v_previous_status TEXT;
BEGIN
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id;

  IF v_task.id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  v_actor_is_manager := public.is_admin_or_supervisor();
  v_actor_is_assignee := v_task.assignee_id = auth.uid();
  v_next_status := btrim(COALESCE(p_target_status, ''));
  v_previous_status := v_task.status;

  IF v_next_status = '' THEN
    RAISE EXCEPTION 'Target status is required';
  END IF;

  IF v_task.status = 'todo' AND v_next_status = 'in_progress' THEN
    IF NOT (v_actor_is_manager OR v_actor_is_assignee) THEN
      RAISE EXCEPTION 'Only the assignee or a manager can start this task';
    END IF;
    UPDATE public.tasks
    SET status = 'in_progress',
        start_at = COALESCE(start_at, NOW())
    WHERE id = p_task_id
    RETURNING * INTO v_task;
    v_action := 'started';
  ELSIF v_task.status IN ('in_progress', 'changes_requested') AND v_next_status = 'review' THEN
    IF NOT (v_actor_is_manager OR v_actor_is_assignee) THEN
      RAISE EXCEPTION 'Only the assignee or a manager can submit this task for review';
    END IF;
    UPDATE public.tasks
    SET status = 'review'
    WHERE id = p_task_id
    RETURNING * INTO v_task;
    v_action := 'submitted_for_review';
  ELSIF v_task.status = 'review' AND v_next_status = 'approved' THEN
    IF NOT v_actor_is_manager THEN
      RAISE EXCEPTION 'Only a manager can approve this task';
    END IF;
    INSERT INTO public.approvals (task_id, status, approver_id, note)
    VALUES (p_task_id, 'approved', auth.uid(), NULLIF(btrim(COALESCE(p_note, '')), ''));
    UPDATE public.tasks
    SET status = 'approved'
    WHERE id = p_task_id
    RETURNING * INTO v_task;
    v_action := 'approved';
  ELSIF v_task.status = 'review' AND v_next_status = 'changes_requested' THEN
    IF NOT v_actor_is_manager THEN
      RAISE EXCEPTION 'Only a manager can request changes';
    END IF;
    INSERT INTO public.approvals (task_id, status, approver_id, note)
    VALUES (p_task_id, 'changes_requested', auth.uid(), NULLIF(btrim(COALESCE(p_note, '')), ''));
    UPDATE public.tasks
    SET status = 'changes_requested'
    WHERE id = p_task_id
    RETURNING * INTO v_task;
    v_action := 'changes_requested';
  ELSIF v_task.status = 'changes_requested' AND v_next_status = 'in_progress' THEN
    IF NOT (v_actor_is_manager OR v_actor_is_assignee) THEN
      RAISE EXCEPTION 'Only the assignee or a manager can restart this task';
    END IF;
    UPDATE public.tasks
    SET status = 'in_progress',
        start_at = COALESCE(start_at, NOW())
    WHERE id = p_task_id
    RETURNING * INTO v_task;
    v_action := 'restarted';
  ELSE
    RAISE EXCEPTION 'Invalid task transition from % to %', v_task.status, v_next_status;
  END IF;

  INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_id, meta_json)
  VALUES (
    'task',
    v_task.id,
    v_action,
    auth.uid(),
    jsonb_build_object('from_status', v_previous_status, 'to_status', v_next_status)
  );

  RETURN v_task;
END;
$$;

DROP FUNCTION IF EXISTS public.save_task_output_workflow(UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.save_task_output_workflow(
  p_task_id UUID,
  p_output_url TEXT DEFAULT NULL,
  p_file_path TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL
)
RETURNS public.tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.tasks;
  v_output JSONB;
BEGIN
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id;

  IF v_task.id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF NOT (public.is_admin_or_supervisor() OR v_task.assignee_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only the assignee or a manager can update task output';
  END IF;

  v_output := COALESCE(v_task.output_json, '{}'::jsonb);
  v_output := jsonb_set(v_output, '{url}', to_jsonb(NULLIF(btrim(COALESCE(p_output_url, '')), '')), true);

  IF NULLIF(btrim(COALESCE(p_file_path, '')), '') IS NOT NULL THEN
    v_output := jsonb_set(v_output, '{file_path}', to_jsonb(NULLIF(btrim(p_file_path), '')), true);
    v_output := jsonb_set(v_output, '{file_name}', to_jsonb(NULLIF(btrim(COALESCE(p_file_name, '')), '')), true);
    v_output := v_output - 'file_url';
  END IF;

  UPDATE public.tasks
  SET output_json = v_output
  WHERE id = p_task_id
  RETURNING * INTO v_task;

  RETURN v_task;
END;
$$;

DROP FUNCTION IF EXISTS public.create_post_with_tasks_workflow(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, UUID);
CREATE OR REPLACE FUNCTION public.create_post_with_tasks_workflow(
  p_client_id UUID,
  p_platform TEXT,
  p_type TEXT,
  p_publish_at TIMESTAMPTZ,
  p_caption TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'draft',
  p_media_url TEXT DEFAULT NULL,
  p_assignee_id UUID DEFAULT NULL
)
RETURNS public.posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.posts;
  v_template RECORD;
  v_rule JSONB;
  v_task_type TEXT;
  v_buffer_days INTEGER;
BEGIN
  IF public.get_my_role() NOT IN ('ADMIN', 'SUPERVISOR', 'SMM') THEN
    RAISE EXCEPTION 'Only admins, supervisors, and SMM can create posts';
  END IF;

  IF COALESCE(btrim(p_platform), '') = '' OR COALESCE(btrim(p_type), '') = '' THEN
    RAISE EXCEPTION 'Platform and post type are required';
  END IF;

  IF p_status NOT IN ('draft', 'pending_approval', 'scheduled', 'published') THEN
    RAISE EXCEPTION 'Invalid post status';
  END IF;

  INSERT INTO public.posts (
    client_id,
    platform,
    type,
    publish_at,
    caption,
    status,
    media_url
  )
  VALUES (
    p_client_id,
    btrim(p_platform),
    btrim(p_type),
    p_publish_at,
    NULLIF(btrim(COALESCE(p_caption, '')), ''),
    p_status,
    NULLIF(btrim(COALESCE(p_media_url, '')), '')
  )
  RETURNING * INTO v_post;

  SELECT post_type, rules_json
  INTO v_template
  FROM public.task_templates
  WHERE post_type = v_post.type
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_template.post_type IS NULL THEN
    SELECT post_type, rules_json
    INTO v_template
    FROM public.task_templates
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_template.post_type IS NOT NULL THEN
    FOR v_rule IN
      SELECT value FROM jsonb_array_elements(COALESCE(v_template.rules_json -> 'tasks', '[]'::jsonb))
    LOOP
      v_task_type := NULLIF(btrim(v_rule ->> 'type'), '');
      IF v_task_type IS NULL THEN
        CONTINUE;
      END IF;

      v_buffer_days := CASE
        WHEN COALESCE(v_rule ->> 'buffer_days_before', '') ~ '^-?[0-9]+$' THEN (v_rule ->> 'buffer_days_before')::INTEGER
        ELSE 0
      END;

      INSERT INTO public.tasks (
        client_id,
        post_id,
        type,
        title,
        status,
        assignee_id,
        due_at,
        assigned_by
      )
      VALUES (
        v_post.client_id,
        v_post.id,
        v_task_type,
        v_task_type,
        'todo',
        p_assignee_id,
        v_post.publish_at - make_interval(days => v_buffer_days),
        auth.uid()
      );
    END LOOP;
  END IF;

  INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_id, meta_json)
  VALUES (
    'post',
    v_post.id,
    'created',
    auth.uid(),
    jsonb_build_object('client_id', v_post.client_id, 'status', v_post.status)
  );

  RETURN v_post;
END;
$$;

DROP FUNCTION IF EXISTS public.reschedule_post_with_tasks_workflow(UUID, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION public.reschedule_post_with_tasks_workflow(
  p_post_id UUID,
  p_publish_at TIMESTAMPTZ
)
RETURNS public.posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.posts;
  v_template RECORD;
  v_task RECORD;
  v_rule JSONB;
  v_buffer_days INTEGER;
BEGIN
  IF public.get_my_role() NOT IN ('ADMIN', 'SUPERVISOR', 'SMM') THEN
    RAISE EXCEPTION 'Only admins, supervisors, and SMM can reschedule posts';
  END IF;

  UPDATE public.posts
  SET publish_at = p_publish_at
  WHERE id = p_post_id
  RETURNING * INTO v_post;

  IF v_post.id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  SELECT post_type, rules_json
  INTO v_template
  FROM public.task_templates
  WHERE post_type = v_post.type
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_template.post_type IS NULL THEN
    SELECT post_type, rules_json
    INTO v_template
    FROM public.task_templates
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  FOR v_task IN
    SELECT id, type
    FROM public.tasks
    WHERE post_id = v_post.id
  LOOP
    v_rule := NULL;

    IF v_template.post_type IS NOT NULL THEN
      SELECT value
      INTO v_rule
      FROM jsonb_array_elements(COALESCE(v_template.rules_json -> 'tasks', '[]'::jsonb))
      WHERE value ->> 'type' = v_task.type
      LIMIT 1;
    END IF;

    v_buffer_days := CASE
      WHEN v_rule IS NOT NULL AND COALESCE(v_rule ->> 'buffer_days_before', '') ~ '^-?[0-9]+$'
        THEN (v_rule ->> 'buffer_days_before')::INTEGER
      ELSE 0
    END;

    UPDATE public.tasks
    SET due_at = v_post.publish_at - make_interval(days => v_buffer_days)
    WHERE id = v_task.id;
  END LOOP;

  INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_id, meta_json)
  VALUES (
    'post',
    v_post.id,
    'rescheduled',
    auth.uid(),
    jsonb_build_object('publish_at', v_post.publish_at)
  );

  RETURN v_post;
END;
$$;
