
-- Create admin_tasks table for task assignment
CREATE TABLE public.admin_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid NOT NULL,
  assigned_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  due_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all tasks" ON public.admin_tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can view their tasks" ON public.admin_tasks
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Moderators can update their tasks" ON public.admin_tasks
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Moderators can manage jobs" ON public.jobs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can view all applications" ON public.applications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can update applications" ON public.applications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));
