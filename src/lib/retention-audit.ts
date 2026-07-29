// Retention & purge audit trail — now server-persisted in
// public.retention_audit_entries with RLS-guarded writes so the chain of
// custody survives session resets and is encrypted at rest.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";
import {
  listRetentionAuditFn,
  logRetentionAuditFn,
  type RetentionAuditRow,
} from "./retention-audit.functions";

export type RetentionAuditKind =
  | "retention_window"
  | "disposition_mode"
  | "legal_hold"
  | "purge_execution";

export type RetentionAuditEntry = RetentionAuditRow;

const KEY = ["secp", "retention-audit"] as const;

export function useRetentionAudit(): RetentionAuditEntry[] {
  const fetchAll = useServerFn(listRetentionAuditFn);
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: () => fetchAll(),
    staleTime: 15_000,
  });
  return data ?? [];
}

export function useLogRetentionAudit() {
  const qc = useQueryClient();
  const call = useServerFn(logRetentionAuditFn);
  const mut = useMutation({
    mutationFn: (input: Omit<RetentionAuditEntry, "id" | "ts" | "actor_id">) =>
      call({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  return useCallback(
    (entry: Omit<RetentionAuditEntry, "id" | "ts" | "actor_id">) => mut.mutate(entry),
    [mut],
  );
}

export function filterAudit(
  rows: RetentionAuditEntry[],
  kinds: RetentionAuditKind[] | "all",
): RetentionAuditEntry[] {
  if (kinds === "all") return rows;
  return rows.filter((r) => kinds.includes(r.kind));
}