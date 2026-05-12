
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_address text;

CREATE OR REPLACE FUNCTION public.increment_job_views(_job_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.jobs SET views_count = views_count + 1 WHERE id = _job_id AND status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.increment_job_views(uuid) TO anon, authenticated;
