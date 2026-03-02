-- Fix admin RLS policies to allow INSERT/UPDATE by adding WITH CHECK.
-- Without WITH CHECK, INSERTs fail with: "new row violates row-level security policy".

-- about_content
DROP POLICY IF EXISTS "Admins can update about content" ON public.about_content;
CREATE POLICY "Admins can update about content" ON public.about_content
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- skills
DROP POLICY IF EXISTS "Admins can manage skills" ON public.skills;
CREATE POLICY "Admins can manage skills" ON public.skills
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- certificates
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
CREATE POLICY "Admins can manage certificates" ON public.certificates
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- projects
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
CREATE POLICY "Admins can manage projects" ON public.projects
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- resume_content
DROP POLICY IF EXISTS "Admins can manage resume content" ON public.resume_content;
CREATE POLICY "Admins can manage resume content" ON public.resume_content
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- contact_info
DROP POLICY IF EXISTS "Admins can manage contact info" ON public.contact_info;
CREATE POLICY "Admins can manage contact info" ON public.contact_info
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- profile_content
DROP POLICY IF EXISTS "Admins can manage profile content" ON public.profile_content;
CREATE POLICY "Admins can manage profile content" ON public.profile_content
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- education
DROP POLICY IF EXISTS "Admins can manage education" ON public.education;
CREATE POLICY "Admins can manage education" ON public.education
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- experience
DROP POLICY IF EXISTS "Admins can manage experience" ON public.experience;
CREATE POLICY "Admins can manage experience" ON public.experience
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
