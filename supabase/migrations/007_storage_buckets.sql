-- Storage buckets for task attachments and task outputs (private + signed URLs recommended)

INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('task-outputs', 'task-outputs', false)
ON CONFLICT (id) DO NOTHING;

-- Policies: authenticated users can read/write their own or if they have task access (simplified: allow authenticated for now; refine with RLS on storage.objects)
CREATE POLICY "task_attachments_authenticated" ON storage.objects FOR ALL USING (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');
CREATE POLICY "task_outputs_authenticated" ON storage.objects FOR ALL USING (bucket_id = 'task-outputs' AND auth.role() = 'authenticated');
