-- Storage bucket for brand assets (run in Supabase Dashboard or SQL)
-- In Dashboard: Storage -> New bucket -> "brand-assets" (public or private with policy)

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "brand_assets_upload_admin"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-assets' AND public.get_my_role() IN ('ADMIN', 'SUPERVISOR'));

CREATE POLICY "brand_assets_read_all"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

-- Enable Realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
