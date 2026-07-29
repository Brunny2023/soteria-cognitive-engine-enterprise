import { useSyncExternalStore } from "react";

export type ArchetypeStatus = "draft" | "training" | "deployed" | "retired";
export type PackStatus = "installed" | "available" | "pending";

export interface Archetype {
  id: string;
  codename: string;
  role: string;
  layer: "L3" | "L5";
  department: string;
  autonomy: 1 | 2 | 3 | 4;
  skills: string[];
  packs: string[];
  guardrails: string[];
  status: ArchetypeStatus;
  trained: number;
  deployed: number;
  updated: string;
  seed?: boolean;
}

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

const A_KEY = "secp.archetypes.v1";
const P_KEY = "secp.packs.v1";

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

type Listener = () => void;
const listeners = new Set<Listener>();
let archetypes: Archetype[] = loadArchetypes();
let packs: DomainPack[] = loadPacks();

function loadArchetypes(): Archetype[] {
  if (typeof window === "undefined") return SEED_ARCHETYPES;
  try {
    const raw = window.localStorage.getItem(A_KEY);
    if (!raw) return SEED_ARCHETYPES;
    const stored = JSON.parse(raw) as Archetype[];
    const ids = new Set(stored.map((a) => a.id));
    const seed = SEED_ARCHETYPES.filter((s) => !ids.has(s.id));
    return [...stored, ...seed];
  } catch { return SEED_ARCHETYPES; }
}
function loadPacks(): DomainPack[] {
  if (typeof window === "undefined") return SEED_PACKS;
  try {
    const raw = window.localStorage.getItem(P_KEY);
    if (!raw) return SEED_PACKS;
    const stored = JSON.parse(raw) as DomainPack[];
    const map = new Map(SEED_PACKS.map((p) => [p.id, p] as const));
    stored.forEach((p) => map.set(p.id, { ...map.get(p.id), ...p }));
    return Array.from(map.values());
  } catch { return SEED_PACKS; }
}
function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(A_KEY, JSON.stringify(archetypes));
    window.localStorage.setItem(P_KEY, JSON.stringify(packs));
  } catch {}
}
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; }

export function useArchetypes(): Archetype[] {
  return useSyncExternalStore(subscribe, () => archetypes, () => SEED_ARCHETYPES);
}
export function usePacks(): DomainPack[] {
  return useSyncExternalStore(subscribe, () => packs, () => SEED_PACKS);
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

export function createArchetype(input: {
  codename: string;
  role: string;
  layer: "L3" | "L5";
  department: string;
  autonomy: 1 | 2 | 3 | 4;
  skills: string[];
  packs: string[];
  guardrails: string[];
}): Archetype {
  const idBase = input.codename.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase() || "NEW";
  const rec: Archetype = {
    id: `AT-${idBase}-${Math.floor(Math.random() * 900 + 100)}`,
    ...input,
    status: "draft",
    trained: 0,
    deployed: 0,
    updated: stamp(),
  };
  archetypes = [rec, ...archetypes];
  persist(); emit();
  return rec;
}

export function advanceArchetype(id: string) {
  archetypes = archetypes.map((a) => {
    if (a.id !== id) return a;
    if (a.status === "draft") return { ...a, status: "training", trained: 0.25, updated: stamp() };
    if (a.status === "training") {
      const next = Math.min(1, a.trained + 0.25);
      if (next >= 1) return { ...a, trained: 1, status: "deployed", deployed: Math.max(1, a.deployed), updated: stamp() };
      return { ...a, trained: next, updated: stamp() };
    }
    if (a.status === "deployed") return { ...a, deployed: a.deployed + 1, updated: stamp() };
    return a;
  });
  persist(); emit();
}

export function retireArchetype(id: string) {
  archetypes = archetypes.map((a) => a.id === id ? { ...a, status: "retired", deployed: 0, updated: stamp() } : a);
  persist(); emit();
}

export function togglePack(id: string) {
  packs = packs.map((p) => {
    if (p.id !== id) return p;
    if (p.status === "installed") return { ...p, status: "available" };
    if (p.status === "available") return { ...p, status: "pending" };
    return { ...p, status: "installed" };
  });
  persist(); emit();
}
