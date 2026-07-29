import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";
import { REQUESTS, type Autonomy, type RequestRecord } from "./secp-data";
import { advanceRequestFn, createRequestFn, listRequestsFn } from "./secp.functions";

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
    mutationFn: (input: { title: string; brief: string; origin: string; autonomy: Autonomy; priority: "P0" | "P1" | "P2" }) =>
      call({ data: input }),
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