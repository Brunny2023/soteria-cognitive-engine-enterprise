// Retention & purge audit trail (client-persisted).
// Records every settings change and every purge execution so operators
// have a defensible chain of custody for compliance review.
import { useSyncExternalStore } from "react";

export type RetentionAuditKind =
  | "retention_window"
  | "disposition_mode"
  | "legal_hold"
  | "purge_execution";

export type RetentionAuditEntry = {
  id: string;
  ts: string; // ISO UTC
  kind: RetentionAuditKind;
  category_code: string;
  category_name: string;
  actor_id: string | null;
  actor_name: string;
  approver_name: string | null; // second operator for purge executions
  field: string;
  before: string;
  after: string;
  records_affected: number;
  disposition: string;
  note: string;
};

const KEY = "secp.retention.audit.v1";

function read(): RetentionAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RetentionAuditEntry[]) : [];
  } catch {
    return [];
  }
}

let cache: RetentionAuditEntry[] = read();
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  }
  listeners.forEach((l) => l());
}

function rid() {
  return `RA-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const retentionAudit = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  snapshot(): RetentionAuditEntry[] {
    return cache;
  },
  log(entry: Omit<RetentionAuditEntry, "id" | "ts">) {
    cache = [{ id: rid(), ts: new Date().toISOString(), ...entry }, ...cache].slice(0, 500);
    emit();
  },
  clear() {
    cache = [];
    emit();
  },
};

export function useRetentionAudit(): RetentionAuditEntry[] {
  return useSyncExternalStore(retentionAudit.subscribe, retentionAudit.snapshot, retentionAudit.snapshot);
}

export function filterAudit(
  rows: RetentionAuditEntry[],
  kinds: RetentionAuditKind[] | "all",
): RetentionAuditEntry[] {
  if (kinds === "all") return rows;
  return rows.filter((r) => kinds.includes(r.kind));
}