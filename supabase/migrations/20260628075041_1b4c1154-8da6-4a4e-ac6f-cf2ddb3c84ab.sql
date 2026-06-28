
-- 1. Switch has_role to SECURITY INVOKER so it no longer requires elevated EXECUTE
--    and runs under caller's RLS (caller can read own user_roles row).
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 2. Restrict alerts INSERT: global alerts (user_id IS NULL) only by admins
DROP POLICY IF EXISTS "Users insert own alerts" ON public.alerts;
CREATE POLICY "Users insert own alerts"
  ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins insert global alerts"
  ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL AND public.has_role(auth.uid(), 'admin'));

-- 3. user_roles: explicit admin-only INSERT/DELETE/UPDATE policies
CREATE POLICY "Admins insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
