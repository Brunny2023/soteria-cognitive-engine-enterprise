-- Keep the designated super administrator as a platform administrator and
-- provide an explicit self-read policy for the protected control-plane table.
CREATE OR REPLACE FUNCTION public.guard_admin_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE'
     AND OLD.role = 'admin'::public.app_role
     AND public.is_super_admin(OLD.user_id) THEN
    RAISE EXCEPTION 'The designated super administrator cannot be removed from the platform admin role';
  END IF;

  IF TG_OP <> 'DELETE'
     AND NEW.role = 'admin'::public.app_role
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only a super administrator can assign the platform admin role';
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.role = 'admin'::public.app_role
     AND NEW.role <> 'admin'::public.app_role
     AND public.is_super_admin(OLD.user_id) THEN
    RAISE EXCEPTION 'The designated super administrator cannot be demoted';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS user_roles_admin_assignment_guard ON public.user_roles;
CREATE TRIGGER user_roles_admin_assignment_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.guard_admin_role_assignment();

CREATE POLICY super_admins_read_own
ON public.super_admins FOR SELECT TO authenticated
USING (user_id = auth.uid());
