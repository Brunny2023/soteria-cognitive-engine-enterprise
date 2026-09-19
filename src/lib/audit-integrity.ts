import type { RetentionAuditRow } from "./retention-audit.functions";
import { sha256Hex } from "./export";

// Canonical serialization: sort keys and stringify. Deterministic so the same
// row always hashes to the same digest — regardless of column read order.
function canonicalize(row: RetentionAuditRow): string {
  const ordered = {
    id: row.id,
    ts: row.ts,
    kind: row.kind,
    category_code: row.category_code,
    category_name: row.category_name,
    actor_id: row.actor_id ?? "",
    actor_name: row.actor_name,
    approver_name: row.approver_name ?? "",
    field: row.field,
    before: row.before ?? "",
    after: row.after ?? "",
    records_affected: row.records_affected,
    disposition: row.disposition ?? "",
    note: row.note ?? "",
  };
  return JSON.stringify(ordered);
}

export interface IntegrityRowHash {
  id: string;
  ts: string;
  hash: string;
}

export interface IntegrityManifest {
  algorithm: "sha256";
  from: string;
  to: string;
  count: number;
  rows: IntegrityRowHash[];
  chain_hash: string;
  generated_at: string;
}

export async function computeManifest(
  rows: RetentionAuditRow[],
  from: string,
  to: string,
): Promise<IntegrityManifest> {
  const sorted = [...rows].sort((a, b) => a.ts.localeCompare(b.ts));
  const rowHashes: IntegrityRowHash[] = [];
  let chain = "";
  for (const r of sorted) {
    const h = await sha256Hex(canonicalize(r));
    rowHashes.push({ id: r.id, ts: r.ts, hash: h });
    chain = await sha256Hex(chain + h);
  }
  return {
    algorithm: "sha256",
    from,
    to,
    count: sorted.length,
    rows: rowHashes,
    chain_hash: chain || "empty",
    generated_at: new Date().toISOString(),
  };
}

export interface ManifestDiff {
  matched: number;
  mismatched: { id: string; expected: string; actual: string }[];
  missing: string[]; // in prior but not in current
  extra: string[]; // in current but not in prior
  chain_match: boolean;
  prior_chain: string;
  current_chain: string;
}

export function diffManifests(prior: IntegrityManifest, current: IntegrityManifest): ManifestDiff {
  const priorMap = new Map(prior.rows.map((r) => [r.id, r.hash]));
  const currentMap = new Map(current.rows.map((r) => [r.id, r.hash]));
  const mismatched: ManifestDiff["mismatched"] = [];
  let matched = 0;
  for (const [id, hash] of currentMap) {
    const expected = priorMap.get(id);
    if (expected === undefined) continue;
    if (expected === hash) matched += 1;
    else mismatched.push({ id, expected, actual: hash });
  }
  const missing: string[] = [];
  for (const id of priorMap.keys()) if (!currentMap.has(id)) missing.push(id);
  const extra: string[] = [];
  for (const id of currentMap.keys()) if (!priorMap.has(id)) extra.push(id);
  return {
    matched,
    mismatched,
    missing,
    extra,
    chain_match: prior.chain_hash === current.chain_hash,
    prior_chain: prior.chain_hash,
    current_chain: current.chain_hash,
  };
}
