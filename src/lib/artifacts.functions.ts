import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ArtifactRow = {
  id: string;
  request_id: string;
  stage: string;
  agent: string;
  kind: string;
  name: string;
  content: string;
  checksum: string;
  inputs: string;
  created_at: string;
};

export type ToolHealthRow = {
  name: string;
  calls: number;
  ok: number;
  failed: number;
  retried: number;
  fallbacks: number;
  p50: number;
  p95: number;
  lastError: string | null;
};

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type AuditPackage = {
  request: {
    id: string;
    title: string;
    brief: string;
    origin: string;
    priority: string;
    autonomy: number;
    progress: number;
    steps: Json;
    validators: Json;
    created_at: string;
    updated_at: string;
  } | null;
  artifacts: ArtifactRow[];
  generated_at: string;
};

/** Full audit package for one execution: directive record + every ledger artifact. */
export const auditPackageFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ requestId: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: reqRow, error: reqErr } = await context.supabase
      .from("secp_requests")
      .select("id,title,brief,origin,priority,autonomy,progress,steps,validators,created_at,updated_at")
      .eq("id", data.requestId)
      .maybeSingle();
    if (reqErr) throw new Error(reqErr.message);

    const { data: arts, error: artErr } = await context.supabase
      .from("secp_artifacts")
      .select("id,request_id,stage,agent,kind,name,content,checksum,inputs,created_at")
      .eq("request_id", data.requestId)
      .order("created_at", { ascending: true });
    if (artErr) throw new Error(artErr.message);

    const pkg: AuditPackage = {
      request: (reqRow as AuditPackage["request"]) ?? null,
      artifacts: ((arts ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        request_id: String(r.request_id),
        stage: String(r.stage),
        agent: String(r.agent),
        kind: String(r.kind),
        name: String(r.name),
        content: String(r.content),
        checksum: String(r.checksum),
        inputs: JSON.stringify(r.inputs ?? {}, null, 2),
        created_at: String(r.created_at),
      })),
      generated_at: new Date().toISOString(),
    };
    return pkg;
  });

export const listArtifactsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("secp_artifacts")
      .select("id,request_id,stage,agent,kind,name,content,checksum,inputs,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      request_id: String(r.request_id),
      stage: String(r.stage),
      agent: String(r.agent),
      kind: String(r.kind),
      name: String(r.name),
      content: String(r.content),
      checksum: String(r.checksum),
      inputs: JSON.stringify(r.inputs ?? {}, null, 2),
      created_at: String(r.created_at),
    })) as ArtifactRow[];
  });

/** Aggregate tool health from every persisted stage trace. */
export const toolHealthFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("secp_requests")
      .select("id,steps,updated_label")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const buckets = new Map<string, { ms: number[]; ok: number; failed: number; retried: number; fallbacks: number; lastError: string | null }>();
    for (const row of (data ?? []) as { steps: unknown }[]) {
      const steps = (row.steps as { toolCalls?: { name: string; ms: number; ok: boolean; attempts?: number; fallback?: boolean; output: string }[] }[]) ?? [];
      for (const s of steps) {
        for (const t of s.toolCalls ?? []) {
          const b = buckets.get(t.name) ?? { ms: [], ok: 0, failed: 0, retried: 0, fallbacks: 0, lastError: null };
          b.ms.push(t.ms);
          if (t.ok) b.ok += 1;
          else {
            b.failed += 1;
            b.lastError = b.lastError ?? String(t.output ?? "").slice(0, 200);
          }
          if ((t.attempts ?? 1) > 1) b.retried += 1;
          if (t.fallback) b.fallbacks += 1;
          buckets.set(t.name, b);
        }
      }
    }

    const pct = (arr: number[], p: number) => {
      if (!arr.length) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
    };

    const rows: ToolHealthRow[] = [...buckets.entries()]
      .map(([name, b]) => ({
        name,
        calls: b.ms.length,
        ok: b.ok,
        failed: b.failed,
        retried: b.retried,
        fallbacks: b.fallbacks,
        p50: pct(b.ms, 50),
        p95: pct(b.ms, 95),
        lastError: b.lastError,
      }))
      .sort((a, b) => b.calls - a.calls);

    return rows;
  });
