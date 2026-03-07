-- Profile extensions: full profile info and avatar
-- الاسم الكامل = name (existing), العنوان، الايميل (existing in 006), الرقم، صورة شخصية، ملاحظات

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- No RLS change needed: existing profiles_update_own allows user to update their row (all columns).
