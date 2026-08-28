-- 1. Organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  plan_tier text NOT NULL DEFAULT 'enterprise',
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE public.org_role AS ENUM ('owner','admin','member','viewer');

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_role public.org_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions (security definer, avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = _org AND m.user_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org uuid, _user uuid, _roles public.org_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = _org AND m.user_id = _user AND m.org_role = ANY(_roles)
  );
$$;

-- 3. Organization policies
CREATE POLICY org_read_members ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id, auth.uid()) OR created_by = auth.uid());
CREATE POLICY org_insert_self ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY org_update_admins ON public.organizations FOR UPDATE TO authenticated
  USING (public.has_org_role(id, auth.uid(), ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));
CREATE POLICY org_delete_owner ON public.organizations FOR DELETE TO authenticated
  USING (public.has_org_role(id, auth.uid(), ARRAY['owner']::public.org_role[]));

CREATE POLICY om_read ON public.organization_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_member(organization_id, auth.uid()));
CREATE POLICY om_insert ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND org_role = 'viewer')
    OR public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[])
    OR NOT EXISTS (SELECT 1 FROM public.organization_members m2 WHERE m2.organization_id = organization_id)
  );
CREATE POLICY om_update_admins ON public.organization_members FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));
CREATE POLICY om_delete ON public.organization_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));

CREATE TRIGGER organizations_touch BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.ks_touch_updated_at();
CREATE TRIGGER organization_members_touch BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.ks_touch_updated_at();

-- 4. Active organization on profile
ALTER TABLE public.profiles ADD COLUMN active_organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 5. Org scoping on SECP tables
ALTER TABLE public.secp_requests ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.secp_workstreams ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.secp_tasks ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.secp_artifacts ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.secp_archetypes ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.knowledge_sources ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.learning_entries ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX idx_secp_requests_org ON public.secp_requests(organization_id);
CREATE INDEX idx_secp_workstreams_org ON public.secp_workstreams(organization_id);
CREATE INDEX idx_secp_tasks_org ON public.secp_tasks(organization_id);
CREATE INDEX idx_secp_artifacts_org ON public.secp_artifacts(organization_id);
CREATE INDEX idx_organization_members_user ON public.organization_members(user_id);

-- 6. Team sharing for owner-scoped tables
DROP POLICY IF EXISTS "Users manage their own workstreams" ON public.secp_workstreams;
CREATE POLICY ws_read ON public.secp_workstreams FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())));
CREATE POLICY ws_insert ON public.secp_workstreams FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY ws_update ON public.secp_workstreams FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR (organization_id IS NOT NULL AND public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[])))
  WITH CHECK (owner_id = auth.uid() OR (organization_id IS NOT NULL AND public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[])));
CREATE POLICY ws_delete ON public.secp_workstreams FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR (organization_id IS NOT NULL AND public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[])));

DROP POLICY IF EXISTS "Users manage their own tasks" ON public.secp_tasks;
CREATE POLICY tasks_read ON public.secp_tasks FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())));
CREATE POLICY tasks_insert ON public.secp_tasks FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY tasks_update ON public.secp_tasks FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())))
  WITH CHECK (owner_id = auth.uid() OR (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())));
CREATE POLICY tasks_delete ON public.secp_tasks FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR (organization_id IS NOT NULL AND public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[])));

DROP POLICY IF EXISTS "Users manage their own artifacts" ON public.secp_artifacts;
CREATE POLICY artifacts_read ON public.secp_artifacts FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())));
CREATE POLICY artifacts_insert ON public.secp_artifacts FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY artifacts_update ON public.secp_artifacts FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY artifacts_delete ON public.secp_artifacts FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR (organization_id IS NOT NULL AND public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[])));