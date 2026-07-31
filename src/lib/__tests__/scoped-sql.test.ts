import { describe, expect, it } from "vitest";
import {
  authorizeQuery,
  checkStatementAllowlist,
  isSafeParameterValue,
  renderParameterizedSql,
  scopeForAgent,
} from "../secp-scopes";
import { validateStage, type TraceLike } from "../kg-rules";

describe("scoped SQL execution", () => {
  it("authorizes an in-scope read and parameterizes every value", () => {
    const check = authorizeQuery("STRATEGIC VISIONARY", {
      table: "secp_requests",
      columns: ["id", "title", "progress"],
      filters: [{ column: "priority", op: "eq", value: "P0" }],
      orderBy: "created_at",
      descending: true,
      limit: 10,
    });
    expect(check.allowed).toBe(true);
    expect(check.sql).toContain("SELECT id, title, progress FROM secp_requests");
    expect(check.sql).toContain("priority = $1");
    expect(check.sql).not.toContain("'P0'");
    expect(check.params).toEqual(["P0"]);
  });

  it("denies tables outside the executive scope", () => {
    const check = authorizeQuery("MARKET RESONANCE", { table: "retention_audit_entries", limit: 5 });
    expect(check.allowed).toBe(false);
    expect(check.reason).toMatch(/SCOPE_DENIED/);
  });

  it("clips the row limit to the executive's cap", () => {
    const cap = scopeForAgent("CAPITAL ALLOCATOR").rowCap;
    const check = authorizeQuery("CAPITAL ALLOCATOR", { table: "secp_requests", limit: 100000 });
    expect(check.query?.limit).toBe(cap);
  });

  it("strips masked columns from the projection", () => {
    const check = authorizeQuery("SIGNAL WARDEN", {
      table: "retention_audit_entries",
      columns: ["id", "actor_name", "category_name"],
      limit: 5,
    });
    expect(check.query?.columns).not.toContain("actor_name");
  });

  it("blocks injection attempts in bound values", () => {
    expect(isSafeParameterValue("P0")).toBe(true);
    expect(isSafeParameterValue("x'; DROP TABLE secp_requests;--")).toBe(false);
    const check = authorizeQuery("STRATEGIC VISIONARY", {
      table: "secp_requests",
      filters: [{ column: "priority", op: "eq", value: "P0' OR 1=1--" }],
      limit: 5,
    });
    expect(check.allowed).toBe(false);
    expect(check.reason).toMatch(/SQL_GUARD/);
  });

  it("drops unknown/illegal identifiers instead of emitting them", () => {
    const check = authorizeQuery("STRATEGIC VISIONARY", {
      table: "secp_requests",
      columns: ["id", "title; DROP TABLE x", "not_a_column"],
      limit: 5,
    });
    expect(check.query?.columns).toEqual(["id"]);
  });

  it("rejects any non-SELECT statement at the allowlist", () => {
    expect(checkStatementAllowlist("DELETE FROM secp_requests;", 0).ok).toBe(false);
    expect(checkStatementAllowlist("SELECT id FROM secp_requests; DROP TABLE x;", 0).ok).toBe(false);
    expect(checkStatementAllowlist("SELECT id FROM secp_requests -- comment", 0).ok).toBe(false);
    expect(checkStatementAllowlist("SELECT id FROM secp_requests LIMIT 5;", 0).ok).toBe(true);
  });

  it("renders deterministic parameterized SQL", () => {
    const { sql, params } = renderParameterizedSql({
      table: "knowledge_sources",
      columns: ["id", "name"],
      filters: [{ column: "name", op: "ilike", value: "policy" }],
      orderBy: "created_at",
      descending: false,
      limit: 3,
    });
    expect(sql).toBe("SELECT id, name FROM knowledge_sources WHERE name ILIKE $1 ORDER BY created_at ASC LIMIT 3;");
    expect(params).toEqual(["%policy%"]);
  });
});

function trace(partial: Partial<TraceLike>): TraceLike {
  return { name: "run_sql_query", input: "{}", output: "{}", ok: true, ms: 10, ...partial };
}

describe("deterministic validator outcomes per stage", () => {
  const goodRead = trace({
    input: JSON.stringify({ table: "secp_requests" }),
    output: JSON.stringify({ table: "secp_requests", rowCount: 2, rows: [{ id: "R-1", progress: 0.5, autonomy: 3 }] }),
  });

  it("validates a grounded, in-scope stage with no artifact requirement", () => {
    const report = validateStage({ agent: "STRATEGIC VISIONARY", stage: "analyze", trace: [goodRead], requireArtifact: false });
    expect(report.verdict).toBe("validated");
    expect(report.failed).toBe(0);
  });

  it("returns insufficient-evidence when no read grounded the stage", () => {
    const report = validateStage({ agent: "STRATEGIC VISIONARY", stage: "intent", trace: [], requireArtifact: false });
    expect(report.verdict).toBe("insufficient-evidence");
  });

  it("rejects out-of-scope queries", () => {
    const offScope = trace({
      input: JSON.stringify({ table: "retention_audit_entries" }),
      output: JSON.stringify({ table: "retention_audit_entries", rowCount: 1, rows: [] }),
    });
    const report = validateStage({ agent: "MARKET RESONANCE", stage: "execute", trace: [offScope], requireArtifact: false });
    expect(report.verdict).toBe("rejected");
    expect(report.findings.find((f) => f.rule.startsWith("R2"))?.status).toBe("fail");
  });

  it("rejects rows that break graph invariants", () => {
    const bad = trace({
      input: JSON.stringify({ table: "secp_requests" }),
      output: JSON.stringify({ table: "secp_requests", rowCount: 1, rows: [{ id: "R-2", progress: 4.2, autonomy: 9 }] }),
    });
    const report = validateStage({ agent: "STRATEGIC VISIONARY", stage: "execute", trace: [bad], requireArtifact: false });
    expect(report.findings.find((f) => f.rule.startsWith("R5"))?.status).toBe("fail");
    expect(report.verdict).toBe("rejected");
  });

  it("rejects a non-reproducible metric", () => {
    const metric = trace({
      name: "compute_metric",
      input: JSON.stringify({ label: "burn", expression: "2+2", dataset: null }),
      output: JSON.stringify({ label: "burn", value: 5 }),
    });
    const report = validateStage({ agent: "CAPITAL ALLOCATOR", stage: "execute", trace: [goodRead, metric], requireArtifact: false });
    expect(report.findings.find((f) => f.rule.startsWith("R6"))?.status).toBe("fail");
  });

  it("requires a checksummed artifact at delivery stages", () => {
    const withoutArtifact = validateStage({ agent: "STRATEGIC VISIONARY", stage: "deliver", trace: [goodRead], requireArtifact: true });
    expect(withoutArtifact.verdict).toBe("rejected");

    const artifact = trace({
      name: "produce_artifact",
      output: JSON.stringify({ artifact: { id: "a1" }, checksum: "a".repeat(64) }),
    });
    const withArtifact = validateStage({ agent: "STRATEGIC VISIONARY", stage: "deliver", trace: [goodRead, artifact], requireArtifact: true });
    expect(withArtifact.verdict).toBe("validated");
  });

  it("rejects stages backed by degraded fallback evidence", () => {
    const degraded = trace({ fallback: true, output: JSON.stringify({ table: "secp_requests", rowCount: 0, rows: [], degraded: true }) });
    const report = validateStage({ agent: "STRATEGIC VISIONARY", stage: "execute", trace: [degraded], requireArtifact: false });
    expect(report.findings.find((f) => f.rule.startsWith("R9"))?.status).toBe("fail");
    expect(report.verdict).toBe("rejected");
  });
});