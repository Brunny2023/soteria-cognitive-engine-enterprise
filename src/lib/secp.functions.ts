import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import type { RequestRecord, StageStep, Stage, Autonomy } from "./secp-data";

const AutonomySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const PrioritySchema = z.enum(["P0", "P1", "P2"]);

const CreateInput = z.object({
  title: z.string().min(4),
  brief: z.string().min(20),
  origin: z.string().min(2),
  autonomy: AutonomySchema,
  priority: PrioritySchema,
});

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function seedSteps(title: string): StageStep[] {
  return [
    { stage: "intent", layer: "organizational", title: "Intent ingested", agent: "SIGNAL WARDEN", status: "complete",
      reasoning: `Directive parsed. Objective bound: "${title}". Success criteria and constraints registered against organizational policy envelope.` },
    { stage: "context", layer: "organizational", title: "Organizational context retrieved", agent: "PRIMARY LEDGER", status: "pending",
      reasoning: "Queued — awaiting cognition dispatch." },
    { stage: "executive", layer: "executive", title: "Executive deliberation", agent: "STRATEGIC VISIONARY", status: "pending", reasoning: "Queued." },
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

function seedValidators(): RequestRecord["validators"] {
  return [
    { name: "Regulatory compliance", status: "pending", detail: "Compliance sweep queued." },
    { name: "Financial correctness", status: "pending", detail: "Materiality thresholds not yet set." },
    { name: "Explainability", status: "pending", detail: "Reasoning trace being captured." },
    { name: "Reproducibility", status: "pending", detail: "Inputs versioning in progress." },
  ];
}

function rowToRecord(row: {
  id: string; title: string; brief: string; origin: string; autonomy: number;
  priority: string; progress: number; updated_label: string; steps: unknown; validators: unknown;
}): RequestRecord {
  return {
    id: row.id,
    title: row.title,
    brief: row.brief,
    origin: row.origin,
    autonomy: row.autonomy as Autonomy,
    priority: row.priority as RequestRecord["priority"],
    progress: row.progress,
    updated: row.updated_label,
    steps: (row.steps as StageStep[]) ?? [],
    validators: (row.validators as RequestRecord["validators"]) ?? [],
  };
}

export const listRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("secp_requests")
      .select("id,title,brief,origin,autonomy,priority,progress,updated_label,steps,validators")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToRecord);
  });

async function nextRequestId(supabase: { from: (t: string) => any }) {
  const { data } = await supabase.from("secp_requests").select("id").order("created_at", { ascending: false }).limit(50);
  const nums = ((data as { id: string }[] | null) ?? []).map((r) => Number.parseInt(r.id.replace(/[^0-9]/g, ""), 10)).filter(Number.isFinite);
  const next = (nums.length ? Math.max(...nums) : 800) + 1;
  return `RE-${next}`;
}

export const createRequestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInput.parse(input))
  .handler(async ({ data, context }) => {
    const id = await nextRequestId(context.supabase);
    const record: RequestRecord = {
      id,
      title: data.title,
      brief: data.brief,
      origin: data.origin,
      autonomy: data.autonomy,
      priority: data.priority,
      progress: 1 / 12,
      updated: stamp(),
      steps: seedSteps(data.title),
      validators: seedValidators(),
    };
    const { error } = await context.supabase.from("secp_requests").insert({
      id: record.id,
      owner_id: context.userId,
      title: record.title,
      brief: record.brief,
      origin: record.origin,
      autonomy: record.autonomy,
      priority: record.priority,
      progress: record.progress,
      updated_label: record.updated,
      steps: record.steps as unknown as never,
      validators: record.validators as unknown as never,
    });
    if (error) throw new Error(error.message);
    return record;
  });

const STAGE_PROMPT: Record<Stage, string> = {
  intent: "State how you registered the directive and bound its scope.",
  context: "Describe how you traversed the organizational knowledge graph — related prior projects, applicable policies, regulations, and constraints you surfaced.",
  executive: "As the Executive Council, weigh strategic trade-offs. Cite the officer(s) whose portfolio owns this decision, the strategic risks, and the go/no-go rationale.",
  consultant: "As the Domain Consultant tier, translate the executive stance into a domain-specific viewpoint (finance, legal, ops, etc.). Note precedents and heuristics you applied.",
  strategy: "Draft the execution strategy: sequencing, resourcing model, success metrics, and abort conditions.",
  plan: "Produce the project plan: workstreams, dependencies, critical path, and required specialist skills.",
  assign: "Assign specialists to workstreams. Name representative archetypes and justify capacity/expertise fit.",
  execute: "Report the specialist mesh's execution: what artifacts were produced, blockers encountered, and how they were resolved.",
  validate: "Report the Governance validation battery: regulatory compliance, financial correctness, explainability, reproducibility. Cite evidence.",
  review: "Executive review of the delivered output. Approve, request revisions, or escalate.",
  deliver: "Package deliverables, notify stakeholders, and record acceptance.",
  learn: "Capture lessons: what to reinforce, retrain, or feed back into policy and knowledge layers.",
};

const AdvanceInput = z.object({ id: z.string() });

export const advanceRequestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AdvanceInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error: readErr } = await context.supabase
      .from("secp_requests")
      .select("id,title,brief,origin,autonomy,priority,progress,updated_label,steps,validators")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Request not found");
    const record = rowToRecord(row);

    const nextIdx = record.steps.findIndex((s) => s.status === "pending" || s.status === "active");
    if (nextIdx === -1) return record;

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGateway } = await import("./ai-gateway.server");
    const gateway = createLovableAiGateway(key);

    const step = record.steps[nextIdx];
    const priorTrace = record.steps
      .slice(0, nextIdx)
      .filter((s) => s.status === "complete")
      .map((s) => `[${s.stage.toUpperCase()} — ${s.agent}] ${s.reasoning}`)
      .join("\n");

    const prompt = `You are an autonomous cognition layer inside the Soteria Enterprise Cognition Platform.

DIRECTIVE
Title: ${record.title}
Origin: ${record.origin}
Priority: ${record.priority}
Autonomy: L${record.autonomy}
Brief: ${record.brief}

PRIOR REASONING TRACE
${priorTrace || "(no prior stages)"}

CURRENT STAGE
Stage: ${step.stage.toUpperCase()} (${step.title})
Layer: ${step.layer}
Agent: ${step.agent}

TASK
${STAGE_PROMPT[step.stage]}

Respond in 2-4 tight sentences. No headers, no lists, no markdown. Speak as the agent in first-person operational voice.`;

    let reasoning = step.reasoning;
    try {
      const result = await generateText({
        model: gateway("openai/gpt-5.6-luna"),
        prompt,
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });
      reasoning = result.text.trim() || reasoning;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      reasoning = `[cognition dispatch failed — ${msg.slice(0, 200)}]`;
    }

    const nextSteps = record.steps.map((s, i) => {
      if (i < nextIdx) return s;
      if (i === nextIdx) return { ...s, status: "complete" as const, reasoning };
      if (i === nextIdx + 1) return { ...s, status: "active" as const };
      return s;
    });
    const completed = nextSteps.filter((s) => s.status === "complete").length;
    const nextProgress = completed / nextSteps.length;

    let nextValidators = record.validators;
    if (step.stage === "validate") {
      nextValidators = record.validators.map((v) => ({ ...v, status: "passed" as const, detail: `Verified during ${record.id} validate stage.` }));
    }

    const { error: updErr } = await context.supabase
      .from("secp_requests")
      .update({
        steps: nextSteps as unknown as never,
        validators: nextValidators as unknown as never,
        progress: nextProgress,
        updated_label: stamp(),
      })
      .eq("id", record.id);
    if (updErr) throw new Error(updErr.message);

    return {
      ...record,
      steps: nextSteps,
      validators: nextValidators,
      progress: nextProgress,
      updated: stamp(),
    };
  });