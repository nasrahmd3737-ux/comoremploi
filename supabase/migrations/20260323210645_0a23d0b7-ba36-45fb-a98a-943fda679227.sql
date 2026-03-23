-- Add fields for CV builder and profile visibility
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cv_published boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS cv_education jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cv_experience jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cv_languages text[] DEFAULT '{}';
