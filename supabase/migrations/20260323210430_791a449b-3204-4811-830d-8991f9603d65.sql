-- RLS policies for cvs storage bucket
CREATE POLICY "Candidates can upload their CV"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Candidates can update their CV"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Candidates can read their own CV"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Employers can read CVs from applications"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs' AND
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.cv_url LIKE '%' || storage.filename(name) || '%'
      AND j.employer_id = auth.uid()
  )
);

CREATE POLICY "Admins can read all CVs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Candidates can delete their CV"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);