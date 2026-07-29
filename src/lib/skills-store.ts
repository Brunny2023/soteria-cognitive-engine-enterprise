import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  advanceArchetypeFn,
  createArchetypeFn,
  listArchetypesFn,
  listPackStateFn,
  retireArchetypeFn,
  togglePackFn,
  type ArchetypeRow,
} from "./skills.functions";

export type ArchetypeStatus = "draft" | "training" | "deployed" | "retired";
export type PackStatus = "installed" | "available" | "pending";

export type Archetype = ArchetypeRow & { seed?: boolean };
export interface DomainPack {
  id: string;
  name: string;
  domain: string;
  version: string;
  skills: number;
  policies: number;
  corpora: number;
  status: PackStatus;
  summary: string;
  seed?: boolean;
}

const SEED_PACKS: DomainPack[] = [
  { id: "PK-FIN-CORE", name: "Financial Controls Core", domain: "Finance", version: "3.2.1", skills: 42, policies: 128, corpora: 17, status: "installed", summary: "IFRS, GAAP, revenue recognition, materiality thresholds, close cycle playbooks.", seed: true },
  { id: "PK-LGL-EU",   name: "EU Regulatory Codex", domain: "Legal", version: "2024.11", skills: 31, policies: 214, corpora: 22, status: "installed", summary: "GDPR, DSA, AI Act, DORA — clause-level annotations and enforcement precedent.", seed: true },
  { id: "PK-SEC-SOC2", name: "SOC 2 + ISO 27001", domain: "Security", version: "1.8.0", skills: 28, policies: 96, corpora: 9, status: "installed", summary: "Trust services criteria, control mappings, evidence collection templates.", seed: true },
  { id: "PK-SCM-GLB",  name: "Global Supply Chain", domain: "Supply Chain", version: "4.0.0", skills: 51, policies: 74, corpora: 31, status: "installed", summary: "Multi-tier supplier telemetry, INCOTERMS, sanctions screening, dual-sourcing heuristics.", seed: true },
  { id: "PK-HLT-HIPAA",name: "HIPAA + HITECH", domain: "Healthcare", version: "2.1.4", skills: 22, policies: 143, corpora: 12, status: "available", summary: "PHI handling, minimum necessary, breach notification workflows.", seed: true },
  { id: "PK-MFG-LEAN", name: "Lean Manufacturing", domain: "Operations", version: "1.4.2", skills: 36, policies: 41, corpora: 14, status: "available", summary: "OEE, Kanban, SMED, Kaizen loops with plant-floor telemetry adapters.", seed: true },
  { id: "PK-HR-DEI",   name: "HR — Talent & DEI", domain: "People", version: "2.0.0", skills: 24, policies: 58, corpora: 8, status: "available", summary: "Competency frameworks, calibration bias controls, pay-equity models.", seed: true },
  { id: "PK-ENG-SRE",  name: "SRE Operations", domain: "Engineering", version: "5.3.0", skills: 44, policies: 39, corpora: 21, status: "pending", summary: "SLO/SLA math, error budget policies, incident command patterns.", seed: true },
];

const SEED_ARCHETYPES: Archetype[] = [
  { id: "AT-FIN-ANL", codename: "LEDGER SCRIBE", role: "Financial Analyst", layer: "L5", department: "Finance", autonomy: 2, skills: ["Variance analysis", "Cash-flow modeling", "Board packaging"], packs: ["PK-FIN-CORE"], guardrails: ["Materiality > $250K → escalate", "Cross-check w/ ledger"], status: "deployed", trained: 0.94, deployed: 6, updated: "12:14 UTC", seed: true },
  { id: "AT-LGL-DPO", codename: "PRIVACY WARDEN", role: "Data Protection Officer", layer: "L3", department: "Legal", autonomy: 2, skills: ["DPIA drafting", "Article-6 mapping", "Vendor DPA review"], packs: ["PK-LGL-EU"], guardrails: ["Never auto-approve cross-border transfer", "Log every ruling"], status: "deployed", trained: 0.88, deployed: 3, updated: "11:02 UTC", seed: true },
  { id: "AT-SEC-IR",  codename: "COVENANT SENTRY", role: "Incident Responder", layer: "L5", department: "Security", autonomy: 3, skills: ["Containment", "Chain-of-custody", "Comms drafts"], packs: ["PK-SEC-SOC2"], guardrails: ["Human-in-loop for eradication", "Legal notified < 30m"], status: "deployed", trained: 0.91, deployed: 4, updated: "10:41 UTC", seed: true },
  { id: "AT-SCM-BUY", codename: "TIER TRACER", role: "Strategic Buyer", layer: "L5", department: "Supply Chain", autonomy: 2, skills: ["RFQ orchestration", "Should-cost modeling", "Sanctions screen"], packs: ["PK-SCM-GLB"], guardrails: ["Concentration > 30% → risk-officer review"], status: "training", trained: 0.62, deployed: 0, updated: "09:20 UTC", seed: true },
  { id: "AT-CON-MA",  codename: "MERGER LENS", role: "M&A Consultant", layer: "L3", department: "Strategy", autonomy: 1, skills: ["Synergy modeling", "Diligence checklist", "Cultural fit assay"], packs: ["PK-FIN-CORE", "PK-LGL-EU"], guardrails: ["Recommend only — never bind"], status: "draft", trained: 0.18, deployed: 0, updated: "08:07 UTC", seed: true },
];

const A_KEY = ["secp", "archetypes"] as const;
const P_KEY = ["secp", "packState"] as const;

export function useArchetypes(): Archetype[] {
  const fetchArchetypes = useServerFn(listArchetypesFn);
  const { data } = useQuery({
    queryKey: A_KEY,
    queryFn: () => fetchArchetypes(),
    staleTime: 15_000,
  });
  const remote = (data ?? []) as Archetype[];
  const ids = new Set(remote.map((a) => a.id));
  return [...remote, ...SEED_ARCHETYPES.filter((s) => !ids.has(s.id))];
}

export function usePacks(): DomainPack[] {
  const fetchPackState = useServerFn(listPackStateFn);
  const { data } = useQuery({
    queryKey: P_KEY,
    queryFn: () => fetchPackState(),
    staleTime: 15_000,
  });
  const overrides = new Map((data ?? []).map((r) => [r.id, r.status as PackStatus] as const));
  return SEED_PACKS.map((p) => (overrides.has(p.id) ? { ...p, status: overrides.get(p.id)! } : p));
}

export function useCreateArchetype() {
  const qc = useQueryClient();
  const call = useServerFn(createArchetypeFn);
  const mut = useMutation({
    mutationFn: (input: {
      codename: string; role: string; layer: "L3" | "L5"; department: string;
      autonomy: 1 | 2 | 3 | 4; skills: string[]; packs: string[]; guardrails: string[];
    }) => call({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: A_KEY }),
  });
  return { create: (i: Parameters<typeof mut.mutateAsync>[0]) => mut.mutateAsync(i), isPending: mut.isPending };
}

export function useAdvanceArchetype() {
  const qc = useQueryClient();
  const call = useServerFn(advanceArchetypeFn);
  const mut = useMutation({
    mutationFn: (id: string) => call({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: A_KEY }),
  });
  return (id: string) => mut.mutateAsync(id);
}

export function useRetireArchetype() {
  const qc = useQueryClient();
  const call = useServerFn(retireArchetypeFn);
  const mut = useMutation({
    mutationFn: (id: string) => call({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: A_KEY }),
  });
  return (id: string) => mut.mutateAsync(id);
}

export function useTogglePack() {
  const qc = useQueryClient();
  const call = useServerFn(togglePackFn);
  const mut = useMutation({
    mutationFn: (input: { id: string; status: PackStatus }) => call({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }),
  });
  return (input: { id: string; status: PackStatus }) => mut.mutateAsync(input);
}