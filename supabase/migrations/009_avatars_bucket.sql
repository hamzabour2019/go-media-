-- Storage bucket for profile avatars (public read; each user can upload only to their own folder)

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- User can upload only to folder named by their user id: avatars/{user_id}/*
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read (bucket is public)
CREATE POLICY "avatars_select_all"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
