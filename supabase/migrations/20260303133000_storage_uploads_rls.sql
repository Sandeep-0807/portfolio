-- Supabase Storage RLS policies for Admin uploads.
-- Fixes: "new row violates row-level security policy" during file upload.

-- Ensure bucket exists and is public for read access.
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Policies are attached to the storage.objects table.
-- Note: storage schema uses RLS by default; without an INSERT policy, uploads will fail.

DROP POLICY IF EXISTS "Anyone can read uploads" ON storage.objects;
CREATE POLICY "Anyone can read uploads" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Admins can upload to uploads" ON storage.objects;
CREATE POLICY "Admins can upload to uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can update uploads" ON storage.objects;
CREATE POLICY "Admins can update uploads" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'uploads'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id = 'uploads'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can delete uploads" ON storage.objects;
CREATE POLICY "Admins can delete uploads" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'uploads'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
