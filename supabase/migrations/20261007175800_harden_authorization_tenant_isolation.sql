-- Authorization and tenant-isolation hardening identified by the post-auth audit.
-- Preserve intended platform-admin and organization-member access while removing
-- broad authenticated-user read/insert policies from legacy tables.

-- Profiles: expose a profile to its owner, a shared organization member, or a
-- platform administrator; do not expose every profile to every user.
DROP POLICY IF EXISTS profiles_read_all_authed ON public.profiles;
CREATE POLICY profiles_read_scoped ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.organization_members target_membership
    JOIN public.organization_members viewer_membership
      ON viewer_membership.organization_id = target_membership.organization_id
    WHERE target_membership.user_id = profiles.id
      AND viewer_membership.user_id = auth.uid()
  )
);

-- Requests and archetypes: retain owner, shared-tenant, and platform-admin access.
DROP POLICY IF EXISTS secp_req_read ON public.secp_requests;
CREATE POLICY secp_req_read_scoped ON public.secp_requests
FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
);

DROP POLICY IF EXISTS secp_at_read ON public.secp_archetypes;
CREATE POLICY secp_at_read_scoped ON public.secp_archetypes
FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
);

-- Knowledge sources and learning entries: remove global reads.
DROP POLICY IF EXISTS ks_read_all_authed ON public.knowledge_sources;
CREATE POLICY ks_read_scoped ON public.knowledge_sources
FOR SELECT TO authenticated
USING (
  uploader_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
);

DROP POLICY IF EXISTS learning_read_all_authed ON public.learning_entries;
CREATE POLICY learning_read_scoped ON public.learning_entries
FOR SELECT TO authenticated
USING (
  author_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
);

-- Audit entries are append-only. Callers may append only their own actor_id and
-- may read their own entries; platform administrators may review the ledger.
DROP POLICY IF EXISTS ra_read_authed ON public.retention_audit_entries;
DROP POLICY IF EXISTS ra_insert_authed ON public.retention_audit_entries;
CREATE POLICY ra_read_scoped ON public.retention_audit_entries
FOR SELECT TO authenticated
USING (actor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY ra_insert_self ON public.retention_audit_entries
FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

-- Pack-state writes remain available to the intended admin/operator roles, but
-- the audit actor cannot be forged when supplied.
DROP POLICY IF EXISTS secp_pack_upsert ON public.secp_pack_state;
CREATE POLICY secp_pack_upsert ON public.secp_pack_state
FOR INSERT TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::public.app_role)
   OR public.has_role(auth.uid(), 'operator'::public.app_role))
  AND (updated_by IS NULL OR updated_by = auth.uid())
);
DROP POLICY IF EXISTS secp_pack_update ON public.secp_pack_state;
CREATE POLICY secp_pack_update ON public.secp_pack_state
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'operator'::public.app_role)
)
WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::public.app_role)
   OR public.has_role(auth.uid(), 'operator'::public.app_role))
  AND (updated_by IS NULL OR updated_by = auth.uid())
);
