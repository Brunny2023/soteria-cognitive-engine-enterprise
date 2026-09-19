export type OrganizationRole = "owner" | "admin" | "member" | "viewer";

export type Membership = {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  active: boolean;
};

export type TenantRecord = {
  organizationId: string | null;
  ownerId?: string | null;
};

const roleRank: Record<OrganizationRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

export function hasActiveMembership(
  memberships: Membership[],
  userId: string,
  organizationId: string,
): Membership | null {
  return (
    memberships.find(
      (membership) =>
        membership.active &&
        membership.userId === userId &&
        membership.organizationId === organizationId,
    ) ?? null
  );
}

export function canReadTenantRecord(
  memberships: Membership[],
  userId: string,
  activeOrganizationId: string | null,
  record: TenantRecord,
): boolean {
  if (!activeOrganizationId || !record.organizationId) return false;
  if (record.organizationId !== activeOrganizationId) return false;
  return Boolean(hasActiveMembership(memberships, userId, activeOrganizationId));
}

export function canWriteTenantRecord(
  memberships: Membership[],
  userId: string,
  activeOrganizationId: string | null,
  record: TenantRecord,
  minimumRole: OrganizationRole = "member",
): boolean {
  if (!canReadTenantRecord(memberships, userId, activeOrganizationId, record)) return false;
  const membership = hasActiveMembership(memberships, userId, activeOrganizationId!);
  return Boolean(membership && roleRank[membership.role] >= roleRank[minimumRole]);
}

export function canUseServiceRole(
  actor: { kind: "user" | "service"; userId?: string },
  explicitOrganizationId: string | null,
  explicitUserId: string | null,
): boolean {
  return actor.kind === "service" && Boolean(explicitOrganizationId && explicitUserId);
}
