-- RLS Policies for GO Media M-TM

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: is admin or supervisor
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('ADMIN', 'SUPERVISOR')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: can user read task (assignee or admin/supervisor)
CREATE OR REPLACE FUNCTION public.can_read_task(tid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = tid
    AND (t.assignee_id = auth.uid() OR is_admin_or_supervisor())
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------- PROFILES ----------
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_select_all_admin" ON profiles
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin_or_supervisor());

-- ---------- CLIENTS ----------
CREATE POLICY "clients_all_admin_supervisor" ON clients
  FOR ALL USING (is_admin_or_supervisor());

-- Others can read if they have a task for this client or a post linked
CREATE POLICY "clients_select_linked" ON clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.client_id = clients.id AND t.assignee_id = auth.uid())
    OR EXISTS (SELECT 1 FROM posts p WHERE p.client_id = clients.id AND get_my_role() = 'SMM')
  );

-- ---------- BRAND_KITS ----------
CREATE POLICY "brand_kits_admin_supervisor" ON brand_kits
  FOR ALL USING (is_admin_or_supervisor());

CREATE POLICY "brand_kits_select_linked" ON brand_kits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.client_id = brand_kits.client_id AND t.assignee_id = auth.uid())
    OR EXISTS (SELECT 1 FROM posts p WHERE p.client_id = brand_kits.client_id AND get_my_role() = 'SMM')
  );

-- ---------- POSTS ----------
CREATE POLICY "posts_smm_all" ON posts
  FOR ALL USING (get_my_role() = 'SMM');

CREATE POLICY "posts_admin_supervisor_all" ON posts
  FOR ALL USING (is_admin_or_supervisor());

-- Other roles: read only if they have a task linked to this post
CREATE POLICY "posts_select_linked_task" ON posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.post_id = posts.id AND t.assignee_id = auth.uid())
  );

-- ---------- TASKS ----------
CREATE POLICY "tasks_assignee_select_update" ON tasks
  FOR SELECT USING (assignee_id = auth.uid());
CREATE POLICY "tasks_assignee_update" ON tasks
  FOR UPDATE USING (assignee_id = auth.uid());

CREATE POLICY "tasks_admin_supervisor_all" ON tasks
  FOR ALL USING (is_admin_or_supervisor());

-- ---------- DYNAMIC_FIELDS ----------
CREATE POLICY "dynamic_fields_select_all" ON dynamic_fields
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "dynamic_fields_admin_all" ON dynamic_fields
  FOR ALL USING (is_admin_or_supervisor());

-- ---------- TASK_TEMPLATES ----------
CREATE POLICY "task_templates_select_all" ON task_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "task_templates_admin_all" ON task_templates
  FOR ALL USING (is_admin_or_supervisor());

-- ---------- TASK_DEPENDENCIES ----------
CREATE POLICY "task_dependencies_select_via_task" ON task_dependencies
  FOR SELECT USING (
    can_read_task(task_id) OR can_read_task(depends_on_task_id)
  );
CREATE POLICY "task_dependencies_admin_all" ON task_dependencies
  FOR ALL USING (is_admin_or_supervisor());

-- ---------- COMMENTS ----------
CREATE POLICY "comments_select_task_readable" ON comments
  FOR SELECT USING (can_read_task(task_id));

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id AND can_read_task(task_id));

CREATE POLICY "comments_update_author_or_admin" ON comments
  FOR UPDATE USING (author_id = auth.uid() OR is_admin_or_supervisor());

CREATE POLICY "comments_delete_author_or_admin" ON comments
  FOR DELETE USING (author_id = auth.uid() OR is_admin_or_supervisor());

-- ---------- ACTIVITY_LOGS ----------
CREATE POLICY "activity_logs_insert_authenticated" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "activity_logs_select_entity_readable" ON activity_logs
  FOR SELECT USING (
    (entity_type = 'task' AND can_read_task(entity_id))
    OR (entity_type = 'post' AND EXISTS (SELECT 1 FROM posts p WHERE p.id = entity_id AND (get_my_role() = 'SMM' OR is_admin_or_supervisor() OR EXISTS (SELECT 1 FROM tasks t WHERE t.post_id = entity_id AND t.assignee_id = auth.uid()))))
    OR (entity_type = 'client' AND (is_admin_or_supervisor() OR EXISTS (SELECT 1 FROM tasks t WHERE t.client_id = entity_id AND t.assignee_id = auth.uid())))
  );

CREATE POLICY "activity_logs_select_admin_all" ON activity_logs
  FOR SELECT USING (is_admin_or_supervisor());

-- ---------- APPROVALS ----------
CREATE POLICY "approvals_select_task_readable" ON approvals
  FOR SELECT USING (can_read_task(task_id));

CREATE POLICY "approvals_admin_supervisor_write" ON approvals
  FOR ALL USING (is_admin_or_supervisor());

-- ---------- NOTIFICATIONS ----------
CREATE POLICY "notifications_own_only" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_own_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (true); -- server/service role or triggers

-- ---------- PRIVATE_TASKS ----------
CREATE POLICY "private_tasks_owner_only" ON private_tasks
  FOR ALL USING (owner_id = auth.uid());
