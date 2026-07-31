// Execution tools bound to the cognition pipeline. These are real:
// every call hits the project's own governed data plane under RLS, and
// artifacts are persisted with a SHA-256 checksum.
import { tool } from "ai";
import { z } from "zod";
import { datasetAggregates, evaluateExpression } from "./safe-math";
import { authorizeQuery, scopeForAgent, WAREHOUSE, type Operator, type WarehouseTable } from "./secp-scopes";

export type ToolCallTrace = {
  name: string;
  input: string;
  output: string;
  ms: number;
  ok: boolean;
  /** How many execution attempts the tool health supervisor needed. */
  attempts?: number;
  /** True when the supervisor served a safe degraded result after retries. */
  fallback?: boolean;
  /** Rendered SQL for scoped warehouse reads (audit trail). */
  sql?: string;
  /** Scope decision recorded for per-executive data governance. */
  scope?: string;
};

type SupabaseLike = { from: (t: string) => any };

const READABLE_TABLES = {
  secp_requests: "id,title,origin,priority,autonomy,progress,updated_label",
  knowledge_sources: "id,name,kind,source,status,entities,edges,target_layer,tags",
  learning_entries: "id,request_id,lesson,category,applied,created_at",
  retention_audit_entries: "id,kind,category_name,field,records_affected,disposition,ts",
  secp_archetypes: "id,codename,role,layer,department,status",
} as const;

const RETRYABLE = /timeout|network|fetch failed|ECONN|503|502|504|rate limit|temporarily/i;
const MAX_ATTEMPTS = 3;

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
  const scope = scopeForAgent(opts.agent);

  /**
   * Tool health supervisor: bounded retries with backoff for transient faults,
   * then a safe degraded fallback so the pipeline stays reliable and auditable.
   */
  const record = async <T>(
    name: string,
    rawInput: unknown,
    run: () => Promise<T>,
    fallback?: () => T,
    extra?: Partial<ToolCallTrace>,
  ): Promise<T | string> => {
    const input = JSON.stringify(rawInput).slice(0, 2000);
    const started = Date.now();
    let attempts = 0;
    let lastError = "";
    while (attempts < MAX_ATTEMPTS) {
      attempts += 1;
      try {
        const result = await run();
        const output = typeof result === "string" ? result : JSON.stringify(result);
        trace.push({ name, input, output: output.slice(0, 4000), ms: Date.now() - started, ok: true, attempts, ...extra });
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempts >= MAX_ATTEMPTS || !RETRYABLE.test(lastError)) break;
        await new Promise((r) => setTimeout(r, 150 * attempts));
      }
    }
    if (fallback) {
      const degraded = fallback();
      trace.push({
        name,
        input,
        output: JSON.stringify(degraded).slice(0, 4000),
        ms: Date.now() - started,
        ok: true,
        attempts,
        fallback: true,
        ...extra,
      });
      return degraded;
    }
    trace.push({ name, input, output: lastError.slice(0, 500), ms: Date.now() - started, ok: false, attempts, ...extra });
    return `TOOL_ERROR: ${lastError}`;
  };

  const tools = {
    run_sql_query: tool({
      description:
        "Run a governed, scoped SQL read against the organization's Supabase data warehouse. Your executive scope decides which tables and columns you may read. Returns real rows plus the exact SQL that was authorized.",
      inputSchema: z.object({
        table: z.enum([
          "secp_requests",
          "secp_artifacts",
          "knowledge_sources",
          "learning_entries",
          "retention_audit_entries",
          "secp_archetypes",
          "secp_pack_state",
        ]),
        columns: z.array(z.string()).describe("Columns to project; empty array means all columns your scope permits."),
        filters: z
          .array(
            z.object({
              column: z.string(),
              op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "ilike"]),
              value: z.string(),
            }),
          )
          .describe("WHERE clauses; use an empty array for none."),
        orderBy: z.string().nullable(),
        descending: z.boolean(),
        limit: z.number().describe("Row cap; clipped to your scope's maximum."),
      }),
      execute: async (input) => {
        const check = authorizeQuery(opts.agent, {
          table: input.table as WarehouseTable,
          columns: input.columns ?? [],
          filters: (input.filters ?? []) as { column: string; op: Operator; value: string }[],
          orderBy: input.orderBy,
          descending: input.descending,
          limit: input.limit,
        });
        if (!check.allowed || !check.query) {
          trace.push({
            name: "run_sql_query",
            input: JSON.stringify(input).slice(0, 2000),
            output: check.reason ?? "denied",
            ms: 0,
            ok: false,
            attempts: 0,
            scope: `${scope.agent} · denied`,
          });
          return `SCOPE_DENIED: ${check.reason}`;
        }
        const q = check.query;
        return record(
          "run_sql_query",
          { ...input, authorizedSql: check.sql },
          async () => {
            let builder = opts.supabase.from(q.table).select(q.columns.join(",")).limit(q.limit);
            for (const f of q.filters) {
              builder = f.op === "ilike" ? builder.ilike(f.column, `%${f.value}%`) : builder[f.op](f.column, f.value);
            }
            if (q.orderBy) builder = builder.order(q.orderBy, { ascending: !q.descending });
            const { data, error } = await builder;
            if (error) throw new Error(error.message);
            return { table: q.table, sql: check.sql, rowCount: (data ?? []).length, rows: data ?? [] };
          },
          () => ({ table: q.table, sql: check.sql, rowCount: 0, rows: [], degraded: true, note: "warehouse unavailable — safe empty result served" }),
          { sql: check.sql, scope: `${scope.agent} · ${scope.title} · cap ${scope.rowCap}` },
        );
      },
    }),

    describe_warehouse: tool({
      description: "List the warehouse tables and columns your executive scope is permitted to read before writing a query.",
      inputSchema: z.object({ reason: z.string() }),
      execute: async (input) =>
        record("describe_warehouse", input, async () => ({
          agent: scope.agent,
          title: scope.title,
          rowCap: scope.rowCap,
          masked: scope.masked,
          tables: scope.tables.map((t) => ({
            table: t,
            label: WAREHOUSE[t].label,
            columns: WAREHOUSE[t].columns.filter((c) => !scope.masked.includes(c)),
          })),
        })),
    }),

    query_org_data: tool({
      description:
        "Convenience read against a small set of governed tables. Prefer run_sql_query when you need specific columns or filters.",
      inputSchema: z.object({
        table: z.enum(["secp_requests", "knowledge_sources", "learning_entries", "retention_audit_entries", "secp_archetypes"]),
        contains: z.string().nullable().describe("Optional free-text filter applied to the row's primary label column."),
        limit: z.number().describe("Row cap; keep it small, 1-25."),
      }),
      execute: async (input) => {
        if (!scope.tables.includes(input.table as WarehouseTable)) {
          trace.push({
            name: "query_org_data",
            input: JSON.stringify(input).slice(0, 2000),
            output: `SCOPE_DENIED: ${scope.agent} is not scoped to ${input.table}`,
            ms: 0,
            ok: false,
            attempts: 0,
            scope: `${scope.agent} · denied`,
          });
          return `SCOPE_DENIED: ${scope.agent} (${scope.title}) may read ${scope.tables.join(", ")}.`;
        }
        return record(
          "query_org_data",
          input,
          async () => {
            const columns = READABLE_TABLES[input.table];
            const labelColumn = WAREHOUSE[input.table as WarehouseTable].labelColumn;
            let q = opts.supabase
              .from(input.table)
              .select(columns)
              .limit(Math.max(1, Math.min(25, Math.round(input.limit || 10))));
            if (input.contains) q = q.ilike(labelColumn, `%${input.contains}%`);
            const { data, error } = await q;
            if (error) throw new Error(error.message);
            return { table: input.table, rowCount: (data ?? []).length, rows: data ?? [] };
          },
          () => ({ table: input.table, rowCount: 0, rows: [], degraded: true, note: "read unavailable — safe empty result served" }),
          { scope: `${scope.agent} · ${scope.title}` },
        );
      },
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
        record(
          "search_knowledge",
          input,
          async () => {
            const { data, error } = await opts.supabase
              .from("knowledge_sources")
              .select("id,name,kind,status,entities,edges,target_layer,tags")
              .ilike("name", `%${input.keyword}%`)
              .limit(10);
            if (error) throw new Error(error.message);
            return { keyword: input.keyword, matches: data ?? [] };
          },
          () => ({ keyword: input.keyword, matches: [], degraded: true, note: "index unavailable — safe empty result served" }),
        ),
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
              inputs: { stage: opts.stage, agent: opts.agent, scope: scope.agent, tables: scope.tables },
            })
            .select("id,name,kind,checksum")
            .maybeSingle();
          if (error) throw new Error(error.message);
          return { artifact: data, checksum };
        }),
    }),
  };

  return { tools, trace, scope };
}
