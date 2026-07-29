import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type ArchetypeStatus = "draft" | "training" | "deployed" | "retired";
export type PackStatus = "installed" | "available" | "pending";

export interface ArchetypeRow {
  id: string;
  codename: string;
  role: string;
  layer: "L3" | "L5";
  department: string;
  autonomy: 1 | 2 | 3 | 4;
  skills: string[];
  packs: string[];
  guardrails: string[];
  status: ArchetypeStatus;
  trained: number;
  deployed: number;
  updated: string;
}

export interface PackStateRow {
  id: string;
  status: PackStatus;
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

const CreateArchetypeInput = z.object({
  codename: z.string().min(3),
  role: z.string().min(3),
  layer: z.enum(["L3", "L5"]),
  department: z.string().min(2),
  autonomy: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  skills: z.array(z.string()),
  packs: z.array(z.string()),
  guardrails: z.array(z.string()),
});

function toRow(r: {
  id: string; codename: string; role: string; layer: string; department: string;
  autonomy: number; skills: unknown; packs: unknown; guardrails: unknown;
  status: string; trained: number; deployed: number; updated_label: string;
}): ArchetypeRow {
  return {
    id: r.id,
    codename: r.codename,
    role: r.role,
    layer: r.layer as "L3" | "L5",
    department: r.department,
    autonomy: r.autonomy as 1 | 2 | 3 | 4,
    skills: (r.skills as string[]) ?? [],
    packs: (r.packs as string[]) ?? [],
    guardrails: (r.guardrails as string[]) ?? [],
    status: r.status as ArchetypeStatus,
    trained: r.trained,
    deployed: r.deployed,
    updated: r.updated_label,
  };
}

export const listArchetypesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("secp_archetypes")
      .select("id,codename,role,layer,department,autonomy,skills,packs,guardrails,status,trained,deployed,updated_label")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toRow);
  });

export const listPackStateFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("secp_pack_state").select("pack_id,status");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ id: r.pack_id, status: r.status as PackStatus }));
  });

export const createArchetypeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateArchetypeInput.parse(i))
  .handler(async ({ data, context }) => {
    const idBase = data.codename.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase() || "NEW";
    const id = `AT-${idBase}-${Math.floor(Math.random() * 900 + 100)}`;
    const updated = stamp();
    const { error } = await context.supabase.from("secp_archetypes").insert({
      id,
      owner_id: context.userId,
      codename: data.codename,
      role: data.role,
      layer: data.layer,
      department: data.department,
      autonomy: data.autonomy,
      skills: data.skills,
      packs: data.packs,
      guardrails: data.guardrails,
      status: "draft",
      trained: 0,
      deployed: 0,
      updated_label: updated,
    });
    if (error) throw new Error(error.message);
    return { id, updated } as { id: string; updated: string };
  });

export const advanceArchetypeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("secp_archetypes")
      .select("status,trained,deployed")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Archetype not found");
    type Patch = { updated_label: string; status?: string; trained?: number; deployed?: number };
    let patch: Patch = { updated_label: stamp() };
    if (row.status === "draft") patch = { ...patch, status: "training", trained: 0.25 };
    else if (row.status === "training") {
      const next = Math.min(1, row.trained + 0.25);
      patch = next >= 1
        ? { ...patch, trained: 1, status: "deployed", deployed: Math.max(1, row.deployed) }
        : { ...patch, trained: next };
    } else if (row.status === "deployed") patch = { ...patch, deployed: row.deployed + 1 };
    const { error: upd } = await context.supabase.from("secp_archetypes").update(patch).eq("id", data.id);
    if (upd) throw new Error(upd.message);
    return { ok: true };
  });

export const retireArchetypeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("secp_archetypes")
      .update({ status: "retired", deployed: 0, updated_label: stamp() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const togglePackFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string(), status: z.enum(["installed","available","pending"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const next: PackStatus = data.status === "installed" ? "available" : data.status === "available" ? "pending" : "installed";
    const { error } = await context.supabase
      .from("secp_pack_state")
      .upsert({ pack_id: data.id, status: next }, { onConflict: "pack_id" });
    if (error) throw new Error(error.message);
    return { id: data.id, status: next };
  });