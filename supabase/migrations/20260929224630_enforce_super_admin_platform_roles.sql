-- Platform role governance:
-- * every new account receives operator, never admin;
-- * only a designated super administrator can assign app_role=admin;
-- * the designated super administrator cannot be demoted through the app.

CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text NOT NULL DEFAULT ''
);

GRANT ALL ON public.super_admins TO service_role;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _user_id);
$$;

REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;

-- Preserve the named account as the current platform administrator and seed it
-- as the sole super administrator. The email lookup avoids hardcoding a UUID.
UPDATE public.user_roles r
SET role = 'admin'::public.app_role
FROM auth.users u
WHERE r.user_id = u.id
  AND lower(u.email) = 'manifoldgraceltd@gmail.com';

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'manifoldgraceltd@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.super_admins (user_id, note)
SELECT u.id, 'Initial platform super administrator'
FROM auth.users u
WHERE lower(u.email) = 'manifoldgraceltd@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Replace the historical first-user-admin behavior with a uniform operator
-- default for all future signups.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operator'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_admin_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin'::public.app_role
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only a super administrator can assign the platform admin role';
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.role = 'admin'::public.app_role
     AND NEW.role <> 'admin'::public.app_role
     AND public.is_super_admin(OLD.user_id) THEN
    RAISE EXCEPTION 'The designated super administrator cannot be demoted';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_admin_role_assignment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS user_roles_admin_assignment_guard ON public.user_roles;
CREATE TRIGGER user_roles_admin_assignment_guard
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.guard_admin_role_assignment();

DROP POLICY IF EXISTS user_roles_read_own ON public.user_roles;
CREATE POLICY user_roles_read_own_or_super_admin
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY user_roles_insert_super_admin
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY user_roles_update_super_admin
ON public.user_roles FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY user_roles_delete_super_admin
ON public.user_roles FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));
