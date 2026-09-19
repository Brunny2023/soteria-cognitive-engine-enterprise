import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OrgRole = "owner" | "admin" | "member" | "viewer";

export type OrgMember = {
  id: string;
  user_id: string;
  org_role: OrgRole;
  display_name: string;
  title: string | null;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  invite_code: string | null;
  plan_tier: string;
  created_at: string;
  my_role: OrgRole;
  member_count: number;
};

export type OrgWorkspace = {
  organizations: Organization[];
  activeOrganizationId: string | null;
  members: OrgMember[];
  shared: { directives: number; workstreams: number; tasks: number; artifacts: number };
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "org";

/** Full tenancy workspace: orgs the user belongs to, members of the active org, shared record counts. */
export const orgWorkspaceFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrgWorkspace> => {
    const sb = context.supabase;
    const { data: memberships, error } = await sb
      .from("organization_members")
      .select("organization_id,org_role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    const ids = (memberships ?? []).map((m) => (m as { organization_id: string }).organization_id);
    const roleById = new Map<string, OrgRole>(
      (memberships ?? []).map((m) => [
        (m as { organization_id: string }).organization_id,
        (m as { org_role: OrgRole }).org_role,
      ]),
    );

    let orgs: Organization[] = [];
    let allMembers: {
      organization_id: string;
      user_id: string;
      org_role: OrgRole;
      id: string;
      created_at: string;
    }[] = [];
    if (ids.length) {
      const { data: orgRows } = await sb
        .from("organizations")
        .select("id,name,slug,invite_code,plan_tier,created_at")
        .in("id", ids);
      const { data: memberRows } = await sb
        .from("organization_members")
        .select("id,organization_id,user_id,org_role,created_at")
        .in("organization_id", ids);
      allMembers = (memberRows ?? []) as typeof allMembers;
      orgs = (
        (orgRows ?? []) as {
          id: string;
          name: string;
          slug: string;
          invite_code: string;
          plan_tier: string;
          created_at: string;
        }[]
      ).map((o) => {
        const role = roleById.get(o.id) ?? "viewer";
        return {
          id: o.id,
          name: o.name,
          slug: o.slug,
          // Only owners/admins may see and share the join code.
          invite_code: role === "owner" || role === "admin" ? o.invite_code : null,
          plan_tier: o.plan_tier,
          created_at: o.created_at,
          my_role: role,
          member_count: allMembers.filter((m) => m.organization_id === o.id).length,
        };
      });
      orgs.sort((a, b) => a.name.localeCompare(b.name));
    }

    const { data: profile } = await sb
      .from("profiles")
      .select("active_organization_id")
      .eq("id", context.userId)
      .maybeSingle();
    let activeOrganizationId =
      (profile as { active_organization_id?: string | null } | null)?.active_organization_id ??
      null;
    if (activeOrganizationId && !ids.includes(activeOrganizationId)) activeOrganizationId = null;

    let members: OrgMember[] = [];
    if (activeOrganizationId) {
      const rows = allMembers.filter((m) => m.organization_id === activeOrganizationId);
      const { data: profiles } = await sb
        .from("profiles")
        .select("id,display_name,title")
        .in(
          "id",
          rows.map((r) => r.user_id),
        );
      const pById = new Map(
        (
          (profiles ?? []) as { id: string; display_name: string | null; title: string | null }[]
        ).map((p) => [p.id, p]),
      );
      const rank: Record<OrgRole, number> = { owner: 0, admin: 1, member: 2, viewer: 3 };
      members = rows
        .map((r) => ({
          id: r.id,
          user_id: r.user_id,
          org_role: r.org_role,
          display_name: pById.get(r.user_id)?.display_name ?? "Unnamed operator",
          title: pById.get(r.user_id)?.title ?? null,
          created_at: r.created_at,
        }))
        .sort(
          (a, b) =>
            rank[a.org_role] - rank[b.org_role] || a.display_name.localeCompare(b.display_name),
        );
    }

    const count = async (
      table: "secp_requests" | "secp_workstreams" | "secp_tasks" | "secp_artifacts",
    ) => {
      if (!activeOrganizationId) return 0;
      const { count: c } = await sb
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("organization_id", activeOrganizationId);
      return c ?? 0;
    };

    return {
      organizations: orgs,
      activeOrganizationId,
      members,
      shared: {
        directives: await count("secp_requests"),
        workstreams: await count("secp_workstreams"),
        tasks: await count("secp_tasks"),
        artifacts: await count("secp_artifacts"),
      },
    };
  });

/** Create a tenant and enrol the creator as owner. */
export const createOrgFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ name: z.string().min(2).max(80) }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const slug = `${slugify(data.name)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const { data: org, error } = await sb
      .from("organizations")
      .insert({ name: data.name.trim(), slug, created_by: context.userId } as never)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    const id = (org as { id: string } | null)?.id;
    if (!id) throw new Error("Organization was not created");
    const { error: mErr } = await sb
      .from("organization_members")
      .insert({ organization_id: id, user_id: context.userId, org_role: "owner" } as never);
    if (mErr) throw new Error(mErr.message);
    await sb
      .from("profiles")
      .update({ active_organization_id: id } as never)
      .eq("id", context.userId);
    return { id, slug };
  });

/** Join an existing tenant with its invite code. */
export const joinOrgFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ code: z.string().min(4).max(64) }).parse(i))
  .handler(async ({ data, context }) => {
    const code = data.code.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Invite-code lookup must bypass RLS (the joiner is not a member yet);
    // only the org id is returned, never other org data.
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id,name")
      .eq("invite_code", code)
      .maybeSingle();
    const found = org as { id: string; name: string } | null;
    if (!found) throw new Error("No organization matches that invite code");
    const { error } = await context.supabase
      .from("organization_members")
      .upsert({ organization_id: found.id, user_id: context.userId, org_role: "viewer" } as never, {
        onConflict: "organization_id,user_id",
      });
    if (error) throw new Error(error.message);
    await context.supabase
      .from("profiles")
      .update({ active_organization_id: found.id } as never)
      .eq("id", context.userId);
    return { id: found.id, name: found.name };
  });

/** Switch the caller's active tenant (or return to a personal workspace with null). */
export const setActiveOrgFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ organizationId: z.string().uuid().nullable() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    if (data.organizationId) {
      const { data: m } = await context.supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", data.organizationId)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (!m) throw new Error("You are not a member of that organization");
    }
    const { error } = await context.supabase
      .from("profiles")
      .update({ active_organization_id: data.organizationId } as never)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Owner/admin only: change a member's tenant role. */
export const setMemberRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        memberId: z.string().uuid(),
        role: z.enum(["owner", "admin", "member", "viewer"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("organization_members")
      .update({ org_role: data.role } as never)
      .eq("id", data.memberId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Owner/admin removes a member; members may remove themselves. */
export const removeMemberFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ memberId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("organization_members")
      .delete()
      .eq("id", data.memberId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Owner/admin rotates the invite code, revoking outstanding invitations. */
export const rotateInviteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ organizationId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const code = Array.from(
      { length: 12 },
      () => "0123456789abcdef"[Math.floor(Math.random() * 16)],
    ).join("");
    const { error } = await context.supabase
      .from("organizations")
      .update({ invite_code: code } as never)
      .eq("id", data.organizationId);
    if (error) throw new Error(error.message);
    return { code };
  });

/** Attach the caller's existing personal records to the active tenant so the team can see them. */
export const shareWorkspaceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: profile } = await sb
      .from("profiles")
      .select("active_organization_id")
      .eq("id", context.userId)
      .maybeSingle();
    const orgId = (profile as { active_organization_id?: string | null } | null)
      ?.active_organization_id;
    if (!orgId) throw new Error("Select an active organization first");
    const tables = [
      "secp_requests",
      "secp_workstreams",
      "secp_tasks",
      "secp_artifacts",
      "secp_archetypes",
      "knowledge_sources",
      "learning_entries",
    ] as const;
    let shared = 0;
    for (const table of tables) {
      const ownerCol =
        table === "knowledge_sources"
          ? "uploader_id"
          : table === "learning_entries"
            ? "author_id"
            : "owner_id";
      const { data: rows, error } = await sb
        .from(table)
        .update({ organization_id: orgId } as never)
        // Supabase's generated union type cannot express the table/owner-column discriminator.
        .eq(ownerCol as never, context.userId)
        .is("organization_id", null)
        .select("id");
      if (error) throw new Error(`${table}: ${error.message}`);
      shared += (rows ?? []).length;
    }
    return { shared };
  });
