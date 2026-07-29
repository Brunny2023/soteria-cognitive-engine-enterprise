import { useSyncExternalStore } from "react";
import {
  REQUESTS,
  type Autonomy,
  type RequestRecord,
  type StageStep,
} from "./secp-data";

const KEY = "secp.requests.v1";

type Listener = () => void;
const listeners = new Set<Listener>();
let state: RequestRecord[] = load();

function load(): RequestRecord[] {
  if (typeof window === "undefined") return REQUESTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return REQUESTS;
    const parsed = JSON.parse(raw) as RequestRecord[];
    // Merge: prefer stored, append seed defaults it lacks.
    const ids = new Set(parsed.map((r) => r.id));
    return [...parsed, ...REQUESTS.filter((r) => !ids.has(r.id))];
  } catch {
    return REQUESTS;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    // Only persist non-seed (user-created) items to keep seed edits fresh.
    const seedIds = new Set(REQUESTS.map((r) => r.id));
    const created = state.filter((r) => !seedIds.has(r.id));
    window.localStorage.setItem(KEY, JSON.stringify(created));
  } catch {
    /* noop */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useRequests(): RequestRecord[] {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => REQUESTS,
  );
}

export function useRequest(id: string): RequestRecord | undefined {
  const all = useRequests();
  return all.find((r) => r.id.toLowerCase() === id.toLowerCase());
}

function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function nextRequestId(): string {
  const nums = state
    .map((r) => Number.parseInt(r.id.replace(/[^0-9]/g, ""), 10))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 800) + 1;
  return `RE-${next}`;
}

function seedSteps(title: string): StageStep[] {
  return [
    {
      stage: "intent",
      layer: "organizational",
      title: "Intent ingested",
      agent: "SIGNAL WARDEN",
      status: "complete",
      reasoning: `Directive parsed. Objective bound: "${title}". Success criteria and constraints registered against organizational policy envelope.`,
    },
    {
      stage: "context",
      layer: "organizational",
      title: "Organizational context retrieved",
      agent: "PRIMARY LEDGER",
      status: "active",
      reasoning:
        "Traversing knowledge graph for related projects, policies, prior decisions, and applicable regulations.",
    },
    { stage: "executive", layer: "executive", title: "Executive deliberation", agent: "STRATEGIC VISIONARY", status: "pending", reasoning: "Queued — awaiting context bundle." },
    { stage: "consultant", layer: "consultant", title: "Domain consultation", agent: "Consultant mesh", status: "pending", reasoning: "Queued." },
    { stage: "strategy", layer: "consultant", title: "Execution strategy", agent: "HORIZON PLANNER", status: "pending", reasoning: "Queued." },
    { stage: "plan", layer: "program", title: "Project plan generated", agent: "Program Manager v3", status: "pending", reasoning: "Queued." },
    { stage: "assign", layer: "workforce", title: "Specialist assignment", agent: "OPERATIONAL GRAPH", status: "pending", reasoning: "Queued." },
    { stage: "execute", layer: "workforce", title: "Workforce execution", agent: "Specialist mesh", status: "pending", reasoning: "Queued." },
    { stage: "validate", layer: "governance", title: "Multi-stage validation", agent: "COVENANT KEEPER", status: "pending", reasoning: "Queued." },
    { stage: "review", layer: "executive", title: "Executive review", agent: "STRATEGIC VISIONARY", status: "pending", reasoning: "Queued." },
    { stage: "deliver", layer: "executive", title: "Deliver results", agent: "COVENANT KEEPER", status: "pending", reasoning: "Queued." },
    { stage: "learn", layer: "organizational", title: "Capture feedback", agent: "PRIMARY LEDGER", status: "pending", reasoning: "Queued." },
  ];
}

export function createRequest(input: {
  title: string;
  brief: string;
  origin: string;
  autonomy: Autonomy;
  priority: "P0" | "P1" | "P2";
}): RequestRecord {
  const rec: RequestRecord = {
    id: nextRequestId(),
    title: input.title,
    origin: input.origin,
    autonomy: input.autonomy,
    priority: input.priority,
    progress: 0.08,
    updated: nowStamp(),
    brief: input.brief,
    steps: seedSteps(input.title),
    validators: [
      { name: "Regulatory compliance", status: "pending", detail: "Compliance sweep queued." },
      { name: "Financial correctness", status: "pending", detail: "Materiality thresholds not yet set." },
      { name: "Explainability", status: "pending", detail: "Reasoning trace being captured." },
      { name: "Reproducibility", status: "pending", detail: "Inputs versioning in progress." },
    ],
  };
  state = [rec, ...state];
  persist();
  emit();
  return rec;
}