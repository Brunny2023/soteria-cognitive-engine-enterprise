// Per-executive data scoping for the SQL warehouse tool.
// Client-safe: pure metadata + validation, no server imports.

export type WarehouseTable =
  | "secp_requests"
  | "secp_artifacts"
  | "knowledge_sources"
  | "learning_entries"
  | "retention_audit_entries"
  | "secp_archetypes"
  | "secp_pack_state";

export interface TableSpec {
  table: WarehouseTable;
  label: string;
  columns: string[];
  labelColumn: string;
  numericColumns: string[];
}

export const WAREHOUSE: Record<WarehouseTable, TableSpec> = {
  secp_requests: {
    table: "secp_requests",
    label: "Directive register",
    columns: [
      "id",
      "title",
      "origin",
      "priority",
      "autonomy",
      "progress",
      "updated_label",
      "created_at",
    ],
    labelColumn: "title",
    numericColumns: ["autonomy", "progress"],
  },
  secp_artifacts: {
    table: "secp_artifacts",
    label: "Artifact ledger",
    columns: ["id", "request_id", "stage", "agent", "kind", "name", "checksum", "created_at"],
    labelColumn: "name",
    numericColumns: [],
  },
  knowledge_sources: {
    table: "knowledge_sources",
    label: "L1 knowledge index",
    columns: [
      "id",
      "name",
      "kind",
      "source",
      "status",
      "entities",
      "edges",
      "target_layer",
      "size_bytes",
      "created_at",
    ],
    labelColumn: "name",
    numericColumns: ["entities", "edges", "size_bytes"],
  },
  learning_entries: {
    table: "learning_entries",
    label: "Learning loop",
    columns: [
      "id",
      "request_id",
      "request_title",
      "category",
      "rating",
      "outcome",
      "lesson",
      "target_layer",
      "applied",
      "created_at",
    ],
    labelColumn: "lesson",
    numericColumns: ["rating"],
  },
  retention_audit_entries: {
    table: "retention_audit_entries",
    label: "Retention audit",
    columns: [
      "id",
      "ts",
      "kind",
      "category_code",
      "category_name",
      "actor_name",
      "field",
      "records_affected",
      "disposition",
    ],
    labelColumn: "category_name",
    numericColumns: ["records_affected"],
  },
  secp_archetypes: {
    table: "secp_archetypes",
    label: "Archetype registry",
    columns: [
      "id",
      "codename",
      "role",
      "layer",
      "department",
      "autonomy",
      "status",
      "trained",
      "deployed",
    ],
    labelColumn: "codename",
    numericColumns: ["autonomy", "trained", "deployed"],
  },
  secp_pack_state: {
    table: "secp_pack_state",
    label: "Domain pack state",
    columns: ["pack_id", "status", "updated_at"],
    labelColumn: "pack_id",
    numericColumns: [],
  },
};

export interface ExecutiveScope {
  /** Agent codename as used by the pipeline. */
  agent: string;
  title: string;
  tables: WarehouseTable[];
  rowCap: number;
  /** Columns stripped from every result row for this executive. */
  masked: string[];
}

export const EXECUTIVE_SCOPES: ExecutiveScope[] = [
  {
    agent: "STRATEGIC VISIONARY",
    title: "Chief Executive Officer",
    tables: [
      "secp_requests",
      "secp_artifacts",
      "learning_entries",
      "knowledge_sources",
      "secp_archetypes",
    ],
    rowCap: 100,
    masked: [],
  },
  {
    agent: "OPERATIONAL GRAPH",
    title: "Chief Operating Officer",
    tables: ["secp_requests", "secp_artifacts", "secp_archetypes", "secp_pack_state"],
    rowCap: 100,
    masked: [],
  },
  {
    agent: "CAPITAL ALLOCATOR",
    title: "Chief Financial Officer",
    tables: ["secp_requests", "secp_artifacts", "learning_entries"],
    rowCap: 50,
    masked: ["actor_name"],
  },
  {
    agent: "SYSTEMS ARCHITECT",
    title: "Chief Technology Officer",
    tables: ["knowledge_sources", "secp_pack_state", "secp_archetypes"],
    rowCap: 75,
    masked: [],
  },
  {
    agent: "SIGNAL WARDEN",
    title: "Chief Information Officer",
    tables: ["knowledge_sources", "retention_audit_entries", "secp_requests"],
    rowCap: 75,
    masked: ["actor_name"],
  },
  {
    agent: "PRIMARY LEDGER",
    title: "Chief Data Officer",
    tables: [
      "knowledge_sources",
      "secp_requests",
      "secp_artifacts",
      "learning_entries",
      "retention_audit_entries",
    ],
    rowCap: 200,
    masked: [],
  },
  {
    agent: "COVENANT KEEPER",
    title: "Chief Legal Officer",
    tables: ["retention_audit_entries", "secp_artifacts", "secp_requests"],
    rowCap: 100,
    masked: [],
  },
  {
    agent: "THREAT MODEL",
    title: "Chief Risk Officer",
    tables: ["retention_audit_entries", "knowledge_sources", "secp_requests"],
    rowCap: 100,
    masked: [],
  },
  {
    agent: "PEOPLE FABRIC",
    title: "Chief Human Resources Officer",
    tables: ["secp_archetypes", "learning_entries"],
    rowCap: 50,
    masked: ["actor_name"],
  },
  {
    agent: "MARKET RESONANCE",
    title: "Chief Marketing Officer",
    tables: ["secp_requests", "knowledge_sources"],
    rowCap: 50,
    masked: [],
  },
  {
    agent: "HORIZON PLANNER",
    title: "Chief Strategy Officer",
    tables: ["secp_requests", "secp_artifacts", "knowledge_sources", "learning_entries"],
    rowCap: 100,
    masked: [],
  },
];

/** Fallback scope for consultant / program / workforce meshes. */
export const DEFAULT_SCOPE: ExecutiveScope = {
  agent: "MESH",
  title: "Non-executive mesh",
  tables: ["secp_requests", "knowledge_sources", "secp_artifacts"],
  rowCap: 25,
  masked: ["actor_name"],
};

export function scopeForAgent(agent: string): ExecutiveScope {
  const upper = (agent ?? "").toUpperCase();
  return EXECUTIVE_SCOPES.find((s) => upper.includes(s.agent)) ?? DEFAULT_SCOPE;
}

export type Operator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "ilike";

export interface ScopedQuery {
  table: WarehouseTable;
  columns: string[];
  filters: { column: string; op: Operator; value: string }[];
  orderBy: string | null;
  descending: boolean;
  limit: number;
}

export interface ScopeCheck {
  allowed: boolean;
  reason?: string;
  query?: ScopedQuery;
  sql?: string;
  /** Bound parameter values for the placeholders in `sql`. */
  params?: string[];
  /** Allowlist / parameterization findings recorded for the audit trail. */
  guard?: SqlGuardReport;
}

// ---------------------------------------------------------------------------
// SQL statement allowlist + safe parameterization
// ---------------------------------------------------------------------------

/** The only statement verb the warehouse tool may ever emit. */
export const ALLOWED_STATEMENTS = ["SELECT"] as const;

/** Tokens that must never appear in a generated statement or a bound value. */
export const BLOCKED_TOKENS = [
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "truncate",
  "grant",
  "revoke",
  "create",
  "merge",
  "copy",
  "call",
  "do",
  "vacuum",
  "pg_sleep",
  "pg_read_file",
  "union",
  "into",
  "returning",
  "information_schema",
  "pg_catalog",
  "set_config",
  "current_setting",
  "dblink",
  "lo_import",
  "lo_export",
];

const IDENTIFIER_RE = /^[a-z_][a-z0-9_]*$/;
const VALUE_METACHARS = /[;'"`\\]|--|\/\*|\*\//;

export interface SqlGuardReport {
  ok: boolean;
  statement: string;
  violations: string[];
  /** Number of values passed as bound parameters rather than inlined literals. */
  boundParams: number;
}

export function isSafeIdentifier(name: string): boolean {
  return IDENTIFIER_RE.test(name) && !BLOCKED_TOKENS.includes(name.toLowerCase());
}

/** A bound value must be a plain scalar: no quotes, comments, or statement separators. */
export function isSafeParameterValue(value: string): boolean {
  if (value.length > 200) return false;
  if (VALUE_METACHARS.test(value)) return false;
  const lowered = value.toLowerCase();
  return !BLOCKED_TOKENS.some((t) => new RegExp(`\\b${t}\\b`).test(lowered));
}

/** Deterministic allowlist check over a fully rendered statement. */
export function checkStatementAllowlist(sql: string, boundParams: number): SqlGuardReport {
  const violations: string[] = [];
  const trimmed = sql.trim();
  const statement = (trimmed.split(/\s+/)[0] ?? "").toUpperCase();
  if (!ALLOWED_STATEMENTS.includes(statement as (typeof ALLOWED_STATEMENTS)[number])) {
    violations.push(
      `Statement "${statement || "∅"}" is not on the allowlist (${ALLOWED_STATEMENTS.join(", ")}).`,
    );
  }
  const withoutTrailingSemicolon = trimmed.replace(/;$/, "");
  if (withoutTrailingSemicolon.includes(";"))
    violations.push("Statement batching (`;`) is blocked.");
  if (/--|\/\*/.test(withoutTrailingSemicolon)) violations.push("SQL comments are blocked.");
  const lowered = withoutTrailingSemicolon.toLowerCase();
  for (const t of BLOCKED_TOKENS) {
    if (new RegExp(`\\b${t}\\b`).test(lowered)) violations.push(`Blocked keyword "${t}".`);
  }
  if (/'/.test(withoutTrailingSemicolon))
    violations.push("Inline string literals are blocked — values must be parameterized.");
  return {
    ok: violations.length === 0,
    statement: statement || "∅",
    violations: [...new Set(violations)],
    boundParams,
  };
}

/** Deterministically validate + normalize a query against an executive's scope. */
export function authorizeQuery(agent: string, raw: Partial<ScopedQuery>): ScopeCheck {
  const scope = scopeForAgent(agent);
  const table = raw.table as WarehouseTable;
  const spec = table ? WAREHOUSE[table] : undefined;
  if (!spec) return { allowed: false, reason: `Unknown warehouse table "${String(table)}"` };
  if (!isSafeIdentifier(String(table)))
    return { allowed: false, reason: `Illegal table identifier "${String(table)}"` };
  if (!scope.tables.includes(table)) {
    return {
      allowed: false,
      reason: `SCOPE_DENIED: ${scope.agent} (${scope.title}) is not scoped to ${table}. Permitted: ${scope.tables.join(", ")}`,
    };
  }
  const requested = raw.columns?.length ? raw.columns : spec.columns;
  const columns = requested.filter(
    (c) => isSafeIdentifier(c) && spec.columns.includes(c) && !scope.masked.includes(c),
  );
  if (columns.length === 0) {
    return {
      allowed: false,
      reason: `No readable columns remain after scope masking for ${table}`,
    };
  }
  const rawFilters = raw.filters ?? [];
  const unsafeValue = rawFilters.find((f) => !isSafeParameterValue(String(f.value ?? "")));
  if (unsafeValue) {
    return {
      allowed: false,
      reason: `SQL_GUARD: filter value on "${unsafeValue.column}" contains characters or keywords that cannot be safely parameterized.`,
    };
  }
  const filters = rawFilters.filter(
    (f) =>
      isSafeIdentifier(f.column) &&
      spec.columns.includes(f.column) &&
      !scope.masked.includes(f.column) &&
      OP_SQL[f.op] !== undefined,
  );
  const orderBy =
    raw.orderBy && isSafeIdentifier(raw.orderBy) && spec.columns.includes(raw.orderBy)
      ? raw.orderBy
      : null;
  const limit = Math.max(1, Math.min(scope.rowCap, Math.round(raw.limit || 25)));
  const query: ScopedQuery = {
    table,
    columns,
    filters,
    orderBy,
    descending: raw.descending ?? true,
    limit,
  };
  const { sql, params } = renderParameterizedSql(query);
  const guard = checkStatementAllowlist(sql, params.length);
  if (!guard.ok) {
    return { allowed: false, reason: `SQL_GUARD: ${guard.violations.join(" ")}`, guard };
  }
  return { allowed: true, query, sql, params, guard };
}

const OP_SQL: Record<Operator, string> = {
  eq: "=",
  neq: "<>",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  ilike: "ILIKE",
};

/**
 * Render the scoped query with bound placeholders ($1, $2, …). No user value is
 * ever inlined into the statement text — only identifiers the scope allowlist
 * has already validated appear literally.
 */
export function renderParameterizedSql(q: ScopedQuery): { sql: string; params: string[] } {
  const params: string[] = [];
  const where = q.filters.length
    ? ` WHERE ${q.filters
        .map((f) => {
          params.push(f.op === "ilike" ? `%${f.value}%` : String(f.value));
          return `${f.column} ${OP_SQL[f.op]} $${params.length}`;
        })
        .join(" AND ")}`
    : "";
  const order = q.orderBy ? ` ORDER BY ${q.orderBy} ${q.descending ? "DESC" : "ASC"}` : "";
  return {
    sql: `SELECT ${q.columns.join(", ")} FROM ${q.table}${where}${order} LIMIT ${q.limit};`,
    params,
  };
}

/** Human-auditable SQL rendering of the scoped query (audit trail, not execution). */
export function renderSql(q: ScopedQuery): string {
  const where = q.filters.length
    ? ` WHERE ${q.filters.map((f) => `${f.column} ${OP_SQL[f.op]} '${String(f.value).replace(/'/g, "''")}'`).join(" AND ")}`
    : "";
  const order = q.orderBy ? ` ORDER BY ${q.orderBy} ${q.descending ? "DESC" : "ASC"}` : "";
  return `SELECT ${q.columns.join(", ")} FROM ${q.table}${where}${order} LIMIT ${q.limit};`;
}
