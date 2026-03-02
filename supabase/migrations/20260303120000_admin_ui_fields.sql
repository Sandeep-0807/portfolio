-- Align Supabase schema with the Admin UI fields used in the frontend.

-- About: supports description alignment
ALTER TABLE public.about_content
  ADD COLUMN IF NOT EXISTS description_align text;

-- Certificates: supports description alignment
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS description_align text;

-- Projects: supports description alignment and highlights
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description_align text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]'::jsonb;

-- Education: supports parent/child (internships under a parent entry)
ALTER TABLE public.education
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.education(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_education_parent_id ON public.education(parent_id);
