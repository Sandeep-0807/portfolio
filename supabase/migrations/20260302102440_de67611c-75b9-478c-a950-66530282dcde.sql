
-- Create education table
CREATE TABLE public.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution text NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  start_date text,
  end_date text,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read education" ON public.education FOR SELECT USING (true);
CREATE POLICY "Admins can manage education" ON public.education FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create experience table
CREATE TABLE public.experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  position text NOT NULL,
  location text,
  start_date text,
  end_date text,
  description text,
  currently_working boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read experience" ON public.experience FOR SELECT USING (true);
CREATE POLICY "Admins can manage experience" ON public.experience FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
