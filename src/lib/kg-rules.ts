// Deterministic knowledge-graph rule engine.
// Every check here is pure and reproducible: no model calls, no randomness.
// A stage is only marked "validated" when this engine returns verdict === "validated".
import { evaluateExpression, datasetAggregates } from "./safe-math";
import { WAREHOUSE, scopeForAgent, type WarehouseTable } from "./secp-scopes";

export type Severity = "blocking" | "advisory";
export type FindingStatus = "pass" | "fail" | "skip";

export interface RuleFinding {
  rule: string;
  severity: Severity;
  status: FindingStatus;
  detail: string;
}

export interface ValidationReport {
  verdict: "validated" | "rejected" | "insufficient-evidence";
  checked: number;
  passed: number;
  failed: number;
  findings: RuleFinding[];
}

export interface TraceLike {
  name: string;
  input: string;
  output: string;
  ok: boolean;
  ms: number;
}

/** Domain invariants that must hold for any row surfaced from the graph. */
const COLUMN_RULES: { column: string; test: (v: number) => boolean; detail: string }[] = [
  { column: "autonomy", test: (v) => v >= 1 && v <= 4, detail: "autonomy must sit in L1..L4" },
  { column: "progress", test: (v) => v >= 0 && v <= 1, detail: "progress must be a 0..1 fraction" },
  { column: "rating", test: (v) => v >= 1 && v <= 5, detail: "learning rating must be 1..5" },
  { column: "entities", test: (v) => v >= 0, detail: "entity count cannot be negative" },
  { column: "edges", test: (v) => v >= 0, detail: "edge count cannot be negative" },
  { column: "records_affected", test: (v) => v >= 0, detail: "records_affected cannot be negative" },
  { column: "trained", test: (v) => v >= 0 && v <= 1, detail: "training completion must be a 0..1 fraction" },
];

const ALLOWED_STATUS: Record<string, string[]> = {
  knowledge_sources: ["queued", "parsing", "embedding", "indexing", "indexed", "failed", "held"],
  secp_archetypes: ["draft", "training", "deployed", "retired"],
};

function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Validate a stage's tool trace against the knowledge-graph rules.
 * `requireArtifact` forces a persisted, checksummed deliverable.
 */
export function validateStage(opts: {
  agent: string;
  stage: string;
  trace: TraceLike[];
  requireArtifact: boolean;
}): ValidationReport {
  const findings: RuleFinding[] = [];
  const scope = scopeForAgent(opts.agent);
  const push = (rule: string, severity: Severity, status: FindingStatus, detail: string) =>
    findings.push({ rule, severity, status, detail });

  // R1 — grounding: at least one successful read before any assertion.
  const reads = opts.trace.filter((t) => ["run_sql_query", "query_org_data", "search_knowledge"].includes(t.name));
  const okReads = reads.filter((t) => t.ok);
  push(
    "R1 · Evidence grounding",
    "blocking",
    okReads.length > 0 ? "pass" : "fail",
    okReads.length > 0
      ? `${okReads.length} successful governed read(s) recorded.`
      : "No successful governed read — output is ungrounded.",
  );

  // R2 — scope containment: every query stayed inside the executive's scope.
  const queries = opts.trace.filter((t) => t.name === "run_sql_query");
  if (queries.length === 0) {
    push("R2 · Scope containment", "advisory", "skip", "No SQL warehouse query issued at this stage.");
  } else {
    const violations = queries.filter((q) => {
      const input = safeParse(q.input);
      const table = input?.table as WarehouseTable | undefined;
      return !table || !scope.tables.includes(table);
    });
    push(
      "R2 · Scope containment",
      "blocking",
      violations.length === 0 ? "pass" : "fail",
      violations.length === 0
        ? `All ${queries.length} query(ies) inside ${scope.agent} scope (${scope.tables.join(", ")}).`
        : `${violations.length} query(ies) targeted tables outside ${scope.agent} scope.`,
    );

    // R3 — row cap: no query returned more rows than its scope permits.
    const overCap = queries.filter((q) => {
      const out = safeParse(q.output);
      return typeof out?.rowCount === "number" && out.rowCount > scope.rowCap;
    });
    push(
      "R3 · Row-cap enforcement",
      "blocking",
      overCap.length === 0 ? "pass" : "fail",
      overCap.length === 0 ? `Row counts within the ${scope.rowCap}-row cap.` : `${overCap.length} result set exceeded the row cap.`,
    );

    // R4 — column legality against the graph schema.
    const badColumns: string[] = [];
    for (const q of queries) {
      const out = safeParse(q.output);
      const table = out?.table as WarehouseTable | undefined;
      const spec = table ? WAREHOUSE[table] : undefined;
      if (!spec || !Array.isArray(out?.rows)) continue;
      for (const row of out.rows.slice(0, 25)) {
        for (const key of Object.keys(row ?? {})) if (!spec.columns.includes(key)) badColumns.push(`${table}.${key}`);
      }
    }
    push(
      "R4 · Schema conformance",
      "blocking",
      badColumns.length === 0 ? "pass" : "fail",
      badColumns.length === 0 ? "Every returned column exists in the graph schema." : `Unknown columns: ${[...new Set(badColumns)].slice(0, 5).join(", ")}`,
    );

    // R5 — domain invariants on numeric + status columns.
    const invariantBreaks: string[] = [];
    for (const q of queries) {
      const out = safeParse(q.output);
      const table = out?.table as string | undefined;
      if (!Array.isArray(out?.rows)) continue;
      for (const row of out.rows.slice(0, 50)) {
        for (const r of COLUMN_RULES) {
          const v = row?.[r.column];
          if (typeof v === "number" && !r.test(v)) invariantBreaks.push(`${r.column}=${v} (${r.detail})`);
        }
        const allowed = table ? ALLOWED_STATUS[table] : undefined;
        if (allowed && typeof row?.status === "string" && !allowed.includes(row.status)) {
          invariantBreaks.push(`${table}.status="${row.status}" outside the permitted lifecycle`);
        }
      }
    }
    push(
      "R5 · Graph invariants",
      "blocking",
      invariantBreaks.length === 0 ? "pass" : "fail",
      invariantBreaks.length === 0 ? "All numeric ranges and lifecycle states are legal." : [...new Set(invariantBreaks)].slice(0, 4).join(" · "),
    );
  }

  // R6 — metric reproducibility: recompute every claimed metric.
  const metrics = opts.trace.filter((t) => t.name === "compute_metric");
  if (metrics.length === 0) {
    push("R6 · Metric reproducibility", "advisory", "skip", "No metric was asserted at this stage.");
  } else {
    const mismatches: string[] = [];
    for (const m of metrics) {
      const input = safeParse(m.input);
      const out = safeParse(m.output);
      if (!input?.expression || typeof out?.value !== "number") {
        mismatches.push(`${input?.label ?? "metric"}: unreadable`);
        continue;
      }
      try {
        const recomputed = evaluateExpression(input.expression, datasetAggregates(input.dataset ?? []));
        if (Math.abs(recomputed - out.value) > 1e-9) mismatches.push(`${input.label}: ${out.value} ≠ ${recomputed}`);
      } catch (err) {
        mismatches.push(`${input.label}: ${(err as Error).message}`);
      }
    }
    push(
      "R6 · Metric reproducibility",
      "blocking",
      mismatches.length === 0 ? "pass" : "fail",
      mismatches.length === 0 ? `${metrics.length} metric(s) recomputed deterministically and matched.` : mismatches.slice(0, 3).join(" · "),
    );
  }

  // R7 — artifact provenance.
  const artifacts = opts.trace.filter((t) => t.name === "produce_artifact" && t.ok);
  if (!opts.requireArtifact) {
    push("R7 · Artifact provenance", "advisory", artifacts.length ? "pass" : "skip", artifacts.length ? `${artifacts.length} artifact(s) checksummed.` : "No artifact required at this stage.");
  } else {
    const checksummed = artifacts.filter((a) => /"checksum":"[0-9a-f]{64}"/.test(a.output.replace(/\s/g, "")));
    push(
      "R7 · Artifact provenance",
      "blocking",
      checksummed.length > 0 ? "pass" : "fail",
      checksummed.length > 0 ? `${checksummed.length} artifact(s) persisted with a SHA-256 checksum.` : "Stage requires a persisted, checksummed artifact but none was produced.",
    );
  }

  // R8 — tool reliability: no unresolved tool failures left in the trace.
  const failed = opts.trace.filter((t) => !t.ok);
  push(
    "R8 · Tool reliability",
    "blocking",
    failed.length === 0 ? "pass" : "fail",
    failed.length === 0 ? "Every tool call resolved successfully." : `${failed.length} unrecovered tool failure(s): ${[...new Set(failed.map((f) => f.name))].join(", ")}`,
  );

  const checked = findings.filter((f) => f.status !== "skip").length;
  const failedCount = findings.filter((f) => f.status === "fail" && f.severity === "blocking").length;
  const passed = findings.filter((f) => f.status === "pass").length;
  const verdict: ValidationReport["verdict"] =
    failedCount > 0 ? "rejected" : okReads.length === 0 ? "insufficient-evidence" : "validated";

  return { verdict, checked, passed, failed: failedCount, findings };
}
