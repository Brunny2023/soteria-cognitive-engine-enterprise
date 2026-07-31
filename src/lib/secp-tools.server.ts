// Execution tools bound to the cognition pipeline. These are real:
// every call hits the project's own governed data plane under RLS, and
// artifacts are persisted with a SHA-256 checksum.
import { tool } from "ai";
import { z } from "zod";
import { datasetAggregates, evaluateExpression } from "./safe-math";

export type ToolCallTrace = {
  name: string;
  input: string;
  output: string;
  ms: number;
  ok: boolean;
};

type SupabaseLike = { from: (t: string) => any };

const READABLE_TABLES = {
  secp_requests: "id,title,origin,priority,autonomy,progress,updated_label",
  knowledge_sources: "id,name,kind,source,status,entities,edges,target_layer,tags",
  learning_entries: "id,request_id,lesson,category,applied,created_at",
  retention_audit_entries: "id,action,category,detail,actor,created_at",
  secp_archetypes: "id,name,domain,skills,status",
} as const;

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function buildExecutionTools(opts: {
  supabase: SupabaseLike;
  requestId: string;
  stage: string;
  agent: string;
}) {
  const trace: ToolCallTrace[] = [];

  const record = async <T>(name: string, rawInput: unknown, run: () => Promise<T>): Promise<T | string> => {
    const input = JSON.stringify(rawInput).slice(0, 2000);
    const started = Date.now();
    try {
      const result = await run();
      const output = typeof result === "string" ? result : JSON.stringify(result);
      trace.push({ name, input, output: output.slice(0, 4000), ms: Date.now() - started, ok: true });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.push({ name, input, output: msg.slice(0, 500), ms: Date.now() - started, ok: false });
      return `TOOL_ERROR: ${msg}`;
    }
  };

  const tools = {
    query_org_data: tool({
      description:
        "Run a governed read against the organization's own data plane. Returns real rows the caller is permitted to see. Use before asserting any number or fact.",
      inputSchema: z.object({
        table: z.enum(["secp_requests", "knowledge_sources", "learning_entries", "retention_audit_entries", "secp_archetypes"]),
        contains: z.string().nullable().describe("Optional free-text filter applied to the row's primary label column."),
        limit: z.number().describe("Row cap; keep it small, 1-25."),
      }),
      execute: async (input) =>
        record("query_org_data", input, async () => {
          const columns = READABLE_TABLES[input.table];
          const labelColumn =
            input.table === "learning_entries" ? "lesson" : input.table === "retention_audit_entries" ? "detail" : input.table === "secp_requests" ? "title" : "name";
          let q = opts.supabase.from(input.table).select(columns).limit(Math.max(1, Math.min(25, Math.round(input.limit || 10))));
          if (input.contains) q = q.ilike(labelColumn, `%${input.contains}%`);
          const { data, error } = await q;
          if (error) throw new Error(error.message);
          return { table: input.table, rowCount: (data ?? []).length, rows: data ?? [] };
        }),
    }),

    compute_metric: tool({
      description:
        "Deterministically evaluate an arithmetic expression, optionally over a dataset exposing count/sum/avg/min/max. Use this instead of estimating arithmetic in prose.",
      inputSchema: z.object({
        label: z.string(),
        expression: z.string().describe("Arithmetic only: numbers, + - * / % ^, parentheses, and count/sum/avg/min/max."),
        dataset: z.array(z.number()).nullable(),
      }),
      execute: async (input) =>
        record("compute_metric", input, async () => {
          const vars = datasetAggregates(input.dataset ?? []);
          const value = evaluateExpression(input.expression, vars);
          return { label: input.label, expression: input.expression, value, aggregates: vars };
        }),
    }),

    search_knowledge: tool({
      description: "Search the ingested L1 knowledge index for sources relevant to a keyword, returning indexing status and graph coverage.",
      inputSchema: z.object({ keyword: z.string() }),
      execute: async (input) =>
        record("search_knowledge", input, async () => {
          const { data, error } = await opts.supabase
            .from("knowledge_sources")
            .select("id,name,kind,status,entities,edges,target_layer,tags")
            .ilike("name", `%${input.keyword}%`)
            .limit(10);
          if (error) throw new Error(error.message);
          return { keyword: input.keyword, matches: data ?? [] };
        }),
    }),

    produce_artifact: tool({
      description:
        "Persist a real work product (memo, plan, analysis, validation report) to the artifact ledger. Returns its id and SHA-256 checksum. Use at execution, validation and delivery stages.",
      inputSchema: z.object({
        name: z.string(),
        kind: z.enum(["memo", "plan", "analysis", "validation", "delivery"]),
        content: z.string().describe("The full artifact body in plain text."),
      }),
      execute: async (input) =>
        record("produce_artifact", input, async () => {
          const checksum = await sha256(input.content);
          const { data, error } = await opts.supabase
            .from("secp_artifacts")
            .insert({
              request_id: opts.requestId,
              stage: opts.stage,
              agent: opts.agent,
              kind: input.kind,
              name: input.name,
              content: input.content,
              checksum,
              inputs: { stage: opts.stage, agent: opts.agent },
            })
            .select("id,name,kind,checksum")
            .maybeSingle();
          if (error) throw new Error(error.message);
          return { artifact: data, checksum };
        }),
    }),
  };

  return { tools, trace };
}
