import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";

const LAYER_MODEL: Record<string, string> = {
  organizational: "openai/gpt-5.6-luna",
  executive: "openai/gpt-5.6-sol",
  consultant: "openai/gpt-5.6-terra",
  program: "openai/gpt-5.6-terra",
  workforce: "openai/gpt-5.6-luna",
  governance: "openai/gpt-5.6-sol",
};

export const LAYER_MODEL_CATALOG = LAYER_MODEL;

const PingInput = z.object({
  layer: z.enum([
    "organizational",
    "executive",
    "consultant",
    "program",
    "workforce",
    "governance",
  ]),
});

export type LayerPingResult = {
  layer: string;
  model: string;
  ok: boolean;
  latency_ms: number;
  reply: string;
  error: string | null;
};

export const pingLayerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PingInput.parse(input))
  .handler(async ({ data }): Promise<LayerPingResult> => {
    const model = LAYER_MODEL[data.layer];
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { layer: data.layer, model, ok: false, latency_ms: 0, reply: "", error: "Missing LOVABLE_API_KEY" };
    }
    const { createLovableAiGateway } = await import("./ai-gateway.server");
    const gateway = createLovableAiGateway(key);
    const started = Date.now();
    try {
      const result = await generateText({
        model: gateway(model),
        prompt: `You are the cognition endpoint for the SECP ${data.layer.toUpperCase()} layer. Reply with a single short sentence confirming you are reachable and name your layer.`,
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });
      return {
        layer: data.layer,
        model,
        ok: true,
        latency_ms: Date.now() - started,
        reply: result.text.trim().slice(0, 240),
        error: null,
      };
    } catch (err) {
      return {
        layer: data.layer,
        model,
        ok: false,
        latency_ms: Date.now() - started,
        reply: "",
        error: err instanceof Error ? err.message.slice(0, 240) : String(err),
      };
    }
  });

export const readinessCheckFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tables = [
      "secp_requests",
      "secp_archetypes",
      "learning_entries",
      "knowledge_sources",
      "retention_audit_entries",
      "profiles",
      "user_roles",
    ] as const;
    const checks: {
      key: string;
      label: string;
      status: "pass" | "warn" | "fail";
      detail: string;
    }[] = [];

    checks.push({
      key: "auth.session",
      label: "Authenticated session verified",
      status: "pass",
      detail: `Bearer accepted for user ${context.userId}.`,
    });

    for (const t of tables) {
      const { error, count } = await context.supabase
        .from(t)
        .select("*", { count: "exact", head: true });
      if (error) {
        checks.push({
          key: `db.${t}`,
          label: `Table public.${t} reachable`,
          status: "fail",
          detail: error.message,
        });
      } else {
        checks.push({
          key: `db.${t}`,
          label: `Table public.${t} reachable`,
          status: "pass",
          detail: `RLS-scoped count returned ${count ?? 0} rows.`,
        });
      }
    }

    const { data: reqRows, error: reqErr } = await context.supabase
      .from("secp_requests")
      .select("id,steps")
      .limit(100);
    if (reqErr) {
      checks.push({ key: "audit.reasoning", label: "Reasoning trace integrity", status: "fail", detail: reqErr.message });
    } else {
      const withSteps = (reqRows ?? []).filter((r) => Array.isArray(r.steps) && (r.steps as unknown[]).length > 0).length;
      checks.push({
        key: "audit.reasoning",
        label: "Reasoning trace integrity",
        status: reqRows && reqRows.length > 0 && withSteps === reqRows.length ? "pass" : reqRows && reqRows.length === 0 ? "warn" : "warn",
        detail: `${withSteps}/${reqRows?.length ?? 0} directives carry a persisted reasoning trace.`,
      });
    }

    const { count: auditCount, error: auditErr } = await context.supabase
      .from("retention_audit_entries")
      .select("*", { count: "exact", head: true });
    if (auditErr) {
      checks.push({ key: "audit.retention", label: "Retention audit ledger", status: "fail", detail: auditErr.message });
    } else {
      checks.push({
        key: "audit.retention",
        label: "Retention audit ledger",
        status: (auditCount ?? 0) > 0 ? "pass" : "warn",
        detail: (auditCount ?? 0) > 0
          ? `${auditCount} audit entries persisted server-side (encrypted at rest).`
          : "Ledger reachable but empty — trigger any retention change to populate.",
      });
    }

    const key = process.env.LOVABLE_API_KEY;
    checks.push({
      key: "gateway.key",
      label: "AI Gateway credential present",
      status: key ? "pass" : "fail",
      detail: key ? "LOVABLE_API_KEY resolved from server env." : "Missing LOVABLE_API_KEY.",
    });

    return {
      generated_at: new Date().toISOString(),
      checks,
    };
  });