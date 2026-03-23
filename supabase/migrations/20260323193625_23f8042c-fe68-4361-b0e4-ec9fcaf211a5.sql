
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('candidate', 'employer');

-- Create enum for job status
CREATE TYPE public.job_status AS ENUM ('draft', 'published', 'closed');

-- Create enum for application status
CREATE TYPE public.application_status AS ENUM ('pending', 'reviewed', 'shortlisted', 'rejected', 'accepted');

-- Create enum for job type
CREATE TYPE public.job_type AS ENUM ('CDI', 'CDD', 'Stage', 'Freelance');

-- =====================
-- PROFILES TABLE
-- =====================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  cv_url TEXT,
  skills TEXT[],
  experience_years INTEGER,
  company_name TEXT,
  company_website TEXT,
  company_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- =====================
-- USER ROLES TABLE
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- =====================
-- JOBS TABLE
-- =====================
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  job_type job_type NOT NULL DEFAULT 'CDI',
  salary_min INTEGER,
  salary_max INTEGER,
  requirements TEXT[],
  status job_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published jobs are viewable by everyone"
  ON public.jobs FOR SELECT USING (status = 'published' OR auth.uid() = employer_id);

CREATE POLICY "Employers can create jobs"
  ON public.jobs FOR INSERT WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own jobs"
  ON public.jobs FOR UPDATE USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete their own jobs"
  ON public.jobs FOR DELETE USING (auth.uid() = employer_id);

-- =====================
-- APPLICATIONS TABLE
-- =====================
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  cv_url TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, candidate_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Employers can view applications for their jobs"
  ON public.applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid()
  ));

CREATE POLICY "Candidates can apply to jobs"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Employers can update application status"
  ON public.applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid()
  ));

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_jobs_employer ON public.jobs(employer_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_category ON public.jobs(category);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_applications_job ON public.applications(job_id);
CREATE INDEX idx_applications_candidate ON public.applications(candidate_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);

-- =====================
-- TRIGGERS
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'candidate'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'candidate')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- CV STORAGE BUCKET
-- =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false);

CREATE POLICY "Users can upload their own CV"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own CV"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Employers can view candidate CVs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cvs' AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE j.employer_id = auth.uid()
      AND a.candidate_id::text = (storage.foldername(name))[1]
    )
  );
