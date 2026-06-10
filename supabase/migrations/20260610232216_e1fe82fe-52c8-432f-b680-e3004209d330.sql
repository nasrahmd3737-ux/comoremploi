
-- 1) PROFILES: drop public read, add authenticated read, hide email/phone via column grants
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT (email, phone) ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, role, full_name, location, bio, avatar_url, cv_url,
  cv_published, cv_education, cv_experience, cv_languages, skills,
  experience_years, company_name, company_website, company_description,
  created_at, updated_at
) ON public.profiles TO authenticated;
GRANT SELECT (
  id, user_id, role, full_name, location, bio, avatar_url, cv_url,
  cv_published, cv_education, cv_experience, cv_languages, skills,
  experience_years, company_name, company_website, company_description,
  created_at, updated_at
) ON public.profiles TO anon;

-- 2) RPC for admins/moderators to retrieve contact info (email, phone)
CREATE OR REPLACE FUNCTION public.get_user_contact(_user_id uuid)
RETURNS TABLE(email text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email, p.phone
  FROM public.profiles p
  WHERE p.user_id = _user_id
    AND (
      auth.uid() = p.user_id
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'moderator'::app_role)
    );
$$;
REVOKE EXECUTE ON FUNCTION public.get_user_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_contact(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_contacts()
RETURNS TABLE(user_id uuid, email text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.email, p.phone
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'moderator'::app_role);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_contacts() TO authenticated;

-- 3) Prevent privilege escalation via profiles.role
CREATE OR REPLACE FUNCTION public.enforce_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role NOT IN ('candidate'::app_role, 'employer'::app_role)
       AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.role := 'candidate'::app_role;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_role_trg ON public.profiles;
CREATE TRIGGER enforce_profile_role_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role();

-- 4) STORAGE: remove overly broad employer-read policy on cvs
DROP POLICY IF EXISTS "Employers can read CVs" ON storage.objects;

-- 5) Tighten EXECUTE on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
