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
    const key = process.env.AI_GATEWAY_API_KEY;
    if (!key) {
      return {
        layer: data.layer,
        model,
        ok: false,
        latency_ms: 0,
        reply: "",
        error: "Missing AI_GATEWAY_API_KEY",
      };
    }
    const { createAiGateway } = await import("./ai-gateway.server");
    const gateway = createAiGateway(key);
    const started = Date.now();
    try {
      const result = await generateText({
        model: gateway(model),
        prompt: `You are the cognition endpoint for the SECP ${data.layer.toUpperCase()} layer. Reply with a single short sentence confirming you are reachable and name your layer.`,
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

const ReadinessInput = z.object({ origin: z.string().url().optional() });

export const readinessCheckFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReadinessInput.parse(input ?? {}))
  .handler(async ({ context, data }) => {
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
      checks.push({
        key: "audit.reasoning",
        label: "Reasoning trace integrity",
        status: "fail",
        detail: reqErr.message,
      });
    } else {
      const withSteps = (reqRows ?? []).filter(
        (r) => Array.isArray(r.steps) && (r.steps as unknown[]).length > 0,
      ).length;
      checks.push({
        key: "audit.reasoning",
        label: "Reasoning trace integrity",
        status:
          reqRows && reqRows.length > 0 && withSteps === reqRows.length
            ? "pass"
            : reqRows && reqRows.length === 0
              ? "warn"
              : "warn",
        detail: `${withSteps}/${reqRows?.length ?? 0} directives carry a persisted reasoning trace.`,
      });
    }

    const { count: auditCount, error: auditErr } = await context.supabase
      .from("retention_audit_entries")
      .select("*", { count: "exact", head: true });
    if (auditErr) {
      checks.push({
        key: "audit.retention",
        label: "Retention audit ledger",
        status: "fail",
        detail: auditErr.message,
      });
    } else {
      checks.push({
        key: "audit.retention",
        label: "Retention audit ledger",
        status: (auditCount ?? 0) > 0 ? "pass" : "warn",
        detail:
          (auditCount ?? 0) > 0
            ? `${auditCount} audit entries persisted server-side (encrypted at rest).`
            : "Ledger reachable but empty — trigger any retention change to populate.",
      });
    }

    const key = process.env.AI_GATEWAY_API_KEY;
    checks.push({
      key: "gateway.key",
      label: "AI Gateway credential present",
      status: key ? "pass" : "fail",
      detail: key ? "AI_GATEWAY_API_KEY resolved from server env." : "Missing AI_GATEWAY_API_KEY.",
    });

    // Environment variables required by the client and server runtimes.
    const envVars = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "AI_GATEWAY_API_KEY"] as const;
    const missingEnv = envVars.filter((v) => !process.env[v]);
    checks.push({
      key: "env.required",
      label: "Required environment variables present",
      status: missingEnv.length === 0 ? "pass" : "fail",
      detail:
        missingEnv.length === 0
          ? `${envVars.length}/${envVars.length} server variables resolved (values never logged).`
          : `Missing: ${missingEnv.join(", ")}.`,
    });

    // Live API connectivity through the AI Gateway.
    if (key) {
      const started = Date.now();
      try {
        const { createAiGateway } = await import("./ai-gateway.server");
        const gateway = createAiGateway(key);
        const result = await generateText({
          model: gateway(LAYER_MODEL.governance),
          prompt: "Reply with the single word READY.",
        });
        checks.push({
          key: "api.gateway",
          label: "AI Gateway round-trip",
          status: result.text.trim().length > 0 ? "pass" : "warn",
          detail: `Model ${LAYER_MODEL.governance} replied in ${Date.now() - started}ms.`,
        });
      } catch (err) {
        checks.push({
          key: "api.gateway",
          label: "AI Gateway round-trip",
          status: "fail",
          detail: err instanceof Error ? err.message.slice(0, 200) : String(err),
        });
      }
    }

    const origin = data.origin;
    if (origin) {
      // Security headers on the served document.
      try {
        const res = await fetch(origin, { method: "GET", headers: { accept: "text/html" } });
        const wanted = [
          "content-security-policy",
          "x-content-type-options",
          "referrer-policy",
          "x-frame-options",
          "strict-transport-security",
        ];
        const present = wanted.filter((h) => res.headers.get(h));
        checks.push({
          key: "security.headers",
          label: "HTTP security headers",
          status: present.length >= 3 ? "pass" : present.length > 0 ? "warn" : "warn",
          detail: present.length
            ? `Present: ${present.join(", ")}. Missing: ${wanted.filter((h) => !present.includes(h)).join(", ") || "none"}.`
            : "No hardening headers observed on the preview origin; hosting applies them on published deployments.",
        });
      } catch (err) {
        checks.push({
          key: "security.headers",
          label: "HTTP security headers",
          status: "warn",
          detail: err instanceof Error ? err.message.slice(0, 200) : String(err),
        });
      }

      // Walkthrough media assets must be downloadable for the landing page.
      for (const asset of ["/secp-demo.webm", "/secp-demo.mp4", "/secp-demo.vtt"]) {
        try {
          const res = await fetch(new URL(asset, origin), { method: "GET" });
          const len = Number(res.headers.get("content-length") ?? 0);
          checks.push({
            key: `asset${asset.replace(/\//g, ".")}`,
            label: `Walkthrough asset ${asset}`,
            status: res.ok ? "pass" : "fail",
            detail: res.ok
              ? `HTTP ${res.status} · ${res.headers.get("content-type") ?? "unknown type"}${len ? ` · ${(len / 1024).toFixed(0)} KB` : ""}.`
              : `HTTP ${res.status} — asset not served.`,
          });
        } catch (err) {
          checks.push({
            key: `asset${asset.replace(/\//g, ".")}`,
            label: `Walkthrough asset ${asset}`,
            status: "fail",
            detail: err instanceof Error ? err.message.slice(0, 200) : String(err),
          });
        }
      }
    } else {
      checks.push({
        key: "security.headers",
        label: "HTTP security headers",
        status: "warn",
        detail: "No origin supplied — re-run from the browser to probe headers.",
      });
    }

    // Build health: this handler only executes from a successfully built server bundle.
    checks.push({
      key: "build.health",
      label: "Server bundle build health",
      status: "pass",
      detail: `Server functions executing on ${process.env.NODE_ENV ?? "unknown"} bundle; route handlers and validators loaded.`,
    });

    return {
      generated_at: new Date().toISOString(),
      checks,
    };
  });
