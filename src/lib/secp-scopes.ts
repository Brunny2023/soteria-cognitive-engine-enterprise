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
    columns: ["id", "title", "origin", "priority", "autonomy", "progress", "updated_label", "created_at"],
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
    columns: ["id", "name", "kind", "source", "status", "entities", "edges", "target_layer", "size_bytes", "created_at"],
    labelColumn: "name",
    numericColumns: ["entities", "edges", "size_bytes"],
  },
  learning_entries: {
    table: "learning_entries",
    label: "Learning loop",
    columns: ["id", "request_id", "request_title", "category", "rating", "outcome", "lesson", "target_layer", "applied", "created_at"],
    labelColumn: "lesson",
    numericColumns: ["rating"],
  },
  retention_audit_entries: {
    table: "retention_audit_entries",
    label: "Retention audit",
    columns: ["id", "ts", "kind", "category_code", "category_name", "actor_name", "field", "records_affected", "disposition"],
    labelColumn: "category_name",
    numericColumns: ["records_affected"],
  },
  secp_archetypes: {
    table: "secp_archetypes",
    label: "Archetype registry",
    columns: ["id", "codename", "role", "layer", "department", "autonomy", "status", "trained", "deployed"],
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
  { agent: "STRATEGIC VISIONARY", title: "Chief Executive Officer", tables: ["secp_requests", "secp_artifacts", "learning_entries", "knowledge_sources", "secp_archetypes"], rowCap: 100, masked: [] },
  { agent: "OPERATIONAL GRAPH", title: "Chief Operating Officer", tables: ["secp_requests", "secp_artifacts", "secp_archetypes", "secp_pack_state"], rowCap: 100, masked: [] },
  { agent: "CAPITAL ALLOCATOR", title: "Chief Financial Officer", tables: ["secp_requests", "secp_artifacts", "learning_entries"], rowCap: 50, masked: ["actor_name"] },
  { agent: "SYSTEMS ARCHITECT", title: "Chief Technology Officer", tables: ["knowledge_sources", "secp_pack_state", "secp_archetypes"], rowCap: 75, masked: [] },
  { agent: "SIGNAL WARDEN", title: "Chief Information Officer", tables: ["knowledge_sources", "retention_audit_entries", "secp_requests"], rowCap: 75, masked: ["actor_name"] },
  { agent: "PRIMARY LEDGER", title: "Chief Data Officer", tables: ["knowledge_sources", "secp_requests", "secp_artifacts", "learning_entries", "retention_audit_entries"], rowCap: 200, masked: [] },
  { agent: "COVENANT KEEPER", title: "Chief Legal Officer", tables: ["retention_audit_entries", "secp_artifacts", "secp_requests"], rowCap: 100, masked: [] },
  { agent: "THREAT MODEL", title: "Chief Risk Officer", tables: ["retention_audit_entries", "knowledge_sources", "secp_requests"], rowCap: 100, masked: [] },
  { agent: "PEOPLE FABRIC", title: "Chief Human Resources Officer", tables: ["secp_archetypes", "learning_entries"], rowCap: 50, masked: ["actor_name"] },
  { agent: "MARKET RESONANCE", title: "Chief Marketing Officer", tables: ["secp_requests", "knowledge_sources"], rowCap: 50, masked: [] },
  { agent: "HORIZON PLANNER", title: "Chief Strategy Officer", tables: ["secp_requests", "secp_artifacts", "knowledge_sources", "learning_entries"], rowCap: 100, masked: [] },
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
}

/** Deterministically validate + normalize a query against an executive's scope. */
export function authorizeQuery(agent: string, raw: Partial<ScopedQuery>): ScopeCheck {
  const scope = scopeForAgent(agent);
  const table = raw.table as WarehouseTable;
  const spec = table ? WAREHOUSE[table] : undefined;
  if (!spec) return { allowed: false, reason: `Unknown warehouse table "${String(table)}"` };
  if (!scope.tables.includes(table)) {
    return {
      allowed: false,
      reason: `SCOPE_DENIED: ${scope.agent} (${scope.title}) is not scoped to ${table}. Permitted: ${scope.tables.join(", ")}`,
    };
  }
  const requested = raw.columns?.length ? raw.columns : spec.columns;
  const columns = requested.filter((c) => spec.columns.includes(c) && !scope.masked.includes(c));
  if (columns.length === 0) {
    return { allowed: false, reason: `No readable columns remain after scope masking for ${table}` };
  }
  const filters = (raw.filters ?? []).filter((f) => spec.columns.includes(f.column) && !scope.masked.includes(f.column));
  const orderBy = raw.orderBy && spec.columns.includes(raw.orderBy) ? raw.orderBy : null;
  const limit = Math.max(1, Math.min(scope.rowCap, Math.round(raw.limit || 25)));
  const query: ScopedQuery = { table, columns, filters, orderBy, descending: raw.descending ?? true, limit };
  return { allowed: true, query, sql: renderSql(query) };
}

const OP_SQL: Record<Operator, string> = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", ilike: "ILIKE" };

/** Human-auditable SQL rendering of the scoped query (audit trail, not execution). */
export function renderSql(q: ScopedQuery): string {
  const where = q.filters.length
    ? ` WHERE ${q.filters.map((f) => `${f.column} ${OP_SQL[f.op]} '${String(f.value).replace(/'/g, "''")}'`).join(" AND ")}`
    : "";
  const order = q.orderBy ? ` ORDER BY ${q.orderBy} ${q.descending ? "DESC" : "ASC"}` : "";
  return `SELECT ${q.columns.join(", ")} FROM ${q.table}${where}${order} LIMIT ${q.limit};`;
}
