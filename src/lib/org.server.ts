import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves the caller's active organization (from their profile).
 * Returns null when the user works in a personal, unshared workspace.
 */
export async function activeOrgId(
  supabase: SupabaseClient<never>,
  userId: string,
): Promise<string | null> {
  const { data } = await (supabase as unknown as SupabaseClient)
    .from("profiles")
    .select("active_organization_id")
    .eq("id", userId)
    .maybeSingle();
  const orgId = (data as { active_organization_id?: string | null } | null)?.active_organization_id;
  return orgId ?? null;
}
