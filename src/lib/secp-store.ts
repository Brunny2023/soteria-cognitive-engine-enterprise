import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { REQUESTS, type Autonomy, type RequestRecord, type Stage } from "./secp-data";
import { advanceRequestFn, createRequestFn, listRequestsFn } from "./secp.functions";

// Stages that require a co-approver before the auto-run may proceed.
// These are the decision + validation gates of the pipeline.
export const APPROVAL_STAGES: Stage[] = ["executive", "validate", "deliver"];

export type ApprovalRecord = {
  requestId: string;
  stage: Stage;
  requester: string;
  approver: string;
  note: string;
  ts: string;
};

const APPROVAL_KEY = "secp.approvals.v1";

function loadApprovals(): ApprovalRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(APPROVAL_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveApproval(rec: ApprovalRecord) {
  if (typeof window === "undefined") return;
  const all = loadApprovals();
  all.unshift(rec);
  localStorage.setItem(APPROVAL_KEY, JSON.stringify(all.slice(0, 500)));
}
export function useApprovalLedger(requestId?: string) {
  const all = loadApprovals();
  return requestId ? all.filter((a) => a.requestId === requestId) : all;
}

const KEY = ["secp", "requests"] as const;

function merge(remote: RequestRecord[]): RequestRecord[] {
  const ids = new Set(remote.map((r) => r.id));
  return [...remote, ...REQUESTS.filter((r) => !ids.has(r.id))];
}

export function useRequests(): RequestRecord[] {
  const fetchRequests = useServerFn(listRequestsFn);
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: () => fetchRequests(),
    staleTime: 15_000,
  });
  return merge(data ?? []);
}

export function useRequest(id: string): RequestRecord | undefined {
  const all = useRequests();
  return all.find((r) => r.id.toLowerCase() === id.toLowerCase());
}

export function useCreateRequest() {
  const qc = useQueryClient();
  const call = useServerFn(createRequestFn);
  const mut = useMutation({
    mutationFn: (input: {
      title: string;
      brief: string;
      origin: string;
      autonomy: Autonomy;
      priority: "P0" | "P1" | "P2";
    }) => call({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const create = useCallback(
    (input: Parameters<typeof mut.mutateAsync>[0]) => mut.mutateAsync(input),
    [mut],
  );
  return { create, isPending: mut.isPending };
}

export function useAdvanceRequest() {
  const qc = useQueryClient();
  const call = useServerFn(advanceRequestFn);
  const mut = useMutation({
    mutationFn: (id: string) => call({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  return { advance: (id: string) => mut.mutateAsync(id), isPending: mut.isPending };
}

export function useAutoRunRequest() {
  const qc = useQueryClient();
  const call = useServerFn(advanceRequestFn);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingApproval, setAwaitingApproval] = useState<{
    requestId: string;
    stage: Stage;
  } | null>(null);

  const start = useCallback(
    async (id: string, opts?: { requester: string; approvedStages?: Set<string> }) => {
      setRunning(true);
      setError(null);
      try {
        for (let i = 0; i < 14; i += 1) {
          // Peek at the current pending stage BEFORE dispatching.
          const cache = qc.getQueryData<RequestRecord[]>(KEY) ?? [];
          const current = cache.find((r) => r.id === id);
          const nextStep = current?.steps.find(
            (s) => s.status === "pending" || s.status === "active",
          );
          if (nextStep && APPROVAL_STAGES.includes(nextStep.stage)) {
            const gateKey = `${id}:${nextStep.stage}`;
            if (!opts?.approvedStages?.has(gateKey)) {
              setAwaitingApproval({ requestId: id, stage: nextStep.stage });
              setRunning(false);
              return { paused: true, stage: nextStep.stage } as const;
            }
          }
          const record = await call({ data: { id } });
          const done = record.steps.every((s) => s.status === "complete");
          if (done) break;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Auto-run failed");
      } finally {
        setRunning(false);
        qc.invalidateQueries({ queryKey: KEY });
      }
      return { paused: false } as const;
    },
    [call, qc],
  );
  const approveAndContinue = useCallback(
    async (approver: string, note: string, requester: string) => {
      if (!awaitingApproval) return;
      const gate = awaitingApproval;
      saveApproval({
        requestId: gate.requestId,
        stage: gate.stage,
        requester,
        approver,
        note,
        ts: new Date().toISOString(),
      });
      const approved = new Set([`${gate.requestId}:${gate.stage}`]);
      setAwaitingApproval(null);
      await start(gate.requestId, { requester, approvedStages: approved });
    },
    [awaitingApproval, start],
  );
  const cancelApproval = useCallback(() => setAwaitingApproval(null), []);
  return { start, running, error, awaitingApproval, approveAndContinue, cancelApproval };
}
