
-- Drop potentially conflicting policies first
DROP POLICY IF EXISTS "Admins can read all CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Employers can read CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON storage.objects;

-- Recreate all policies
CREATE POLICY "Users can upload their own CVs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own CVs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Employers can read CVs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cvs' AND public.has_role(auth.uid(), 'employer'));

CREATE POLICY "Admins can read all CVs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cvs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own CVs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own CVs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);
