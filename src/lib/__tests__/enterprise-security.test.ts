import { describe, expect, it } from "vitest";
import { computeManifest, diffManifests } from "../audit-integrity";
import {
  canReadTenantRecord,
  canUseServiceRole,
  canWriteTenantRecord,
  type Membership,
} from "../security-boundaries";
import type { RetentionAuditRow } from "../retention-audit.functions";

const memberships: Membership[] = [
  { userId: "alice", organizationId: "org-a", role: "admin", active: true },
  { userId: "bob", organizationId: "org-b", role: "member", active: true },
  { userId: "carol", organizationId: "org-a", role: "viewer", active: true },
];

const tenantRecord = { organizationId: "org-a", ownerId: "alice" };

function auditRow(id: string, after: string): RetentionAuditRow {
  return {
    id,
    ts: `2026-09-19T00:00:0${id}Z`,
    kind: "retention_window",
    category_code: "SEC",
    category_name: "Security",
    actor_id: "alice",
    actor_name: "Alice",
    approver_name: "Owner",
    field: "retention_days",
    before: "30",
    after,
    records_affected: 1,
    disposition: "approved",
    note: "test",
  };
}

describe("enterprise authorization contracts", () => {
  it("allows an active member to read only the selected organization", () => {
    expect(canReadTenantRecord(memberships, "alice", "org-a", tenantRecord)).toBe(true);
    expect(canReadTenantRecord(memberships, "bob", "org-b", tenantRecord)).toBe(false);
    expect(canReadTenantRecord(memberships, "alice", "org-b", { organizationId: "org-b" })).toBe(
      false,
    );
  });

  it("rejects null and legacy organization IDs instead of silently broadening access", () => {
    expect(canReadTenantRecord(memberships, "alice", "org-a", { organizationId: null })).toBe(
      false,
    );
    expect(canReadTenantRecord(memberships, "alice", null, tenantRecord)).toBe(false);
  });

  it("enforces role changes and membership removal immediately", () => {
    expect(canWriteTenantRecord(memberships, "carol", "org-a", tenantRecord, "member")).toBe(false);
    const removed = memberships.map((membership) =>
      membership.userId === "alice" ? { ...membership, active: false } : membership,
    );
    expect(canReadTenantRecord(removed, "alice", "org-a", tenantRecord)).toBe(false);
  });

  it("requires explicit user and organization context for service-role operations", () => {
    expect(canUseServiceRole({ kind: "service" }, "org-a", "alice")).toBe(true);
    expect(canUseServiceRole({ kind: "service" }, null, "alice")).toBe(false);
    expect(canUseServiceRole({ kind: "service" }, "org-a", null)).toBe(false);
    expect(canUseServiceRole({ kind: "user", userId: "alice" }, "org-a", "alice")).toBe(false);
  });
});

describe("audit integrity contracts", () => {
  it("detects an altered prior audit row", async () => {
    const rows = [auditRow("1", "45"), auditRow("2", "60")];
    const prior = await computeManifest(rows, "2026-09-19", "2026-09-20");
    const current = await computeManifest(
      [auditRow("1", "99"), rows[1]],
      "2026-09-19",
      "2026-09-20",
    );
    const diff = diffManifests(prior, current);
    expect(diff.mismatched).toHaveLength(1);
    expect(diff.chain_match).toBe(false);
  });

  it("detects missing and extra audit rows", async () => {
    const prior = await computeManifest([auditRow("1", "45"), auditRow("2", "60")], "a", "b");
    const current = await computeManifest([auditRow("2", "60"), auditRow("3", "90")], "a", "b");
    const diff = diffManifests(prior, current);
    expect(diff.missing).toEqual(["1"]);
    expect(diff.extra).toEqual(["3"]);
  });
});
