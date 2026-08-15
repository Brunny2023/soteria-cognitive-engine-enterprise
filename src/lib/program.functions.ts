import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TaskRow = {
  id: string;
  workstream_id: string;
  request_id: string;
  title: string;
  detail: string;
  specialist_id: string;
  specialist_role: string;
  department: string;
  effort_hours: number;
  status: "todo" | "in_progress" | "blocked" | "done";
  position: number;
  updated_at: string;
};

export type WorkstreamRow = {
  id: string;
  request_id: string;
  code: string;
  title: string;
  objective: string;
  owner_role: string;
  duration_days: number;
  acceptance: string;
  risk: string;
  position: number;
  tasks: TaskRow[];
};

export type ProgramSummary = {
  request_id: string;
  title: string;
  priority: string;
  autonomy: number;
  workstreams: number;
  tasks: number;
  done: number;
};

const RequestIdSchema = z.object({ requestId: z.string().min(1).max(120) });

export const listProgramsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProgramSummary[]> => {
    const { data: reqs, error: reqErr } = await context.supabase
      .from("secp_requests")
      .select("id,title,priority,autonomy")
      .order("created_at", { ascending: false });
    if (reqErr) throw new Error(reqErr.message);
    const { data: ws } = await context.supabase.from("secp_workstreams").select("id,request_id");
    const { data: tasks } = await context.supabase.from("secp_tasks").select("request_id,status");
    return ((reqs ?? []) as { id: string; title: string; priority: string; autonomy: number }[]).map((r) => {
      const t = ((tasks ?? []) as { request_id: string; status: string }[]).filter((x) => x.request_id === r.id);
      return {
        request_id: r.id,
        title: r.title,
        priority: r.priority,
        autonomy: r.autonomy,
        workstreams: ((ws ?? []) as { request_id: string }[]).filter((x) => x.request_id === r.id).length,
        tasks: t.length,
        done: t.filter((x) => x.status === "done").length,
      };
    });
  });

export const getProgramFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RequestIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<WorkstreamRow[]> => {
    const { data: ws, error } = await context.supabase
      .from("secp_workstreams")
      .select("id,request_id,code,title,objective,owner_role,duration_days,acceptance,risk,position")
      .eq("request_id", data.requestId)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    const { data: tasks, error: tErr } = await context.supabase
      .from("secp_tasks")
      .select("id,workstream_id,request_id,title,detail,specialist_id,specialist_role,department,effort_hours,status,position,updated_at")
      .eq("request_id", data.requestId)
      .order("position", { ascending: true });
    if (tErr) throw new Error(tErr.message);
    return ((ws ?? []) as Omit<WorkstreamRow, "tasks">[]).map((w) => ({
      ...w,
      tasks: ((tasks ?? []) as TaskRow[]).filter((t) => t.workstream_id === w.id),
    }));
  });

/** Decompose a directive into workstreams and assign specialists (L4 → L5). */
export const generatePlanFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RequestIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: req, error: reqErr } = await context.supabase
      .from("secp_requests")
      .select("id,title,brief,priority,autonomy")
      .eq("id", data.requestId)
      .maybeSingle();
    if (reqErr) throw new Error(reqErr.message);
    if (!req) throw new Error("Directive not found");

    const { fallbackPlan, matchSpecialist, normalizeDepartment } = await import("./program.server");
    const { z: zod } = await import("zod");

    const PlanSchema = zod.object({
      workstreams: zod
        .array(
          zod.object({
            code: zod.string(),
            title: zod.string(),
            objective: zod.string(),
            owner_role: zod.string(),
            duration_days: zod.number(),
            acceptance: zod.string(),
            risk: zod.enum(["low", "medium", "high"]),
            tasks: zod.array(
              zod.object({
                title: zod.string(),
                detail: zod.string(),
                department: zod.string(),
                effort_hours: zod.number(),
              }),
            ),
          }),
        )
        .min(3),
    });

    let plan = fallbackPlan(req.title as string);
    let source = "deterministic fallback";
    const key = process.env.LOVABLE_API_KEY;
    if (key) {
      try {
        const { createLovableAiGateway } = await import("./ai-gateway.server");
        const { generateObject } = await import("ai");
        const gateway = createLovableAiGateway(key);
        const result = await generateObject({
          model: gateway("openai/gpt-5.6-luna"),
          schema: PlanSchema,
          prompt: `You are the SECP Program Management layer (L4). Decompose this directive into an executable work breakdown of 4-6 workstreams, each with 2-4 concrete tasks.

Directive: ${req.title}
Brief: ${req.brief}
Priority: ${req.priority} · Autonomy level: ${req.autonomy}

Rules: workstream codes are WS-01, WS-02, ... Each task department MUST be one of: Data & AI, Software, Finance, Marketing, HR, Legal, Operations. Effort hours are integers between 2 and 40. Acceptance criteria must be measurable.`,
          providerOptions: { lovable: { reasoningEffort: "none" } },
        });
        plan = result.object.workstreams.map((w) => ({
          ...w,
          tasks: w.tasks.map((t) => ({ ...t, department: normalizeDepartment(t.department) })),
        }));
        source = "cognition-generated";
      } catch {
        source = "deterministic fallback (gateway unavailable)";
      }
    }

    // Replace any prior plan for this directive.
    await context.supabase.from("secp_workstreams").delete().eq("request_id", req.id);

    const taken = new Set<string>();
    let created = 0;
    for (let i = 0; i < plan.length; i++) {
      const w = plan[i];
      const { data: wsRow, error: wsErr } = await context.supabase
        .from("secp_workstreams")
        .insert({
          owner_id: context.userId,
          request_id: req.id,
          code: w.code || `WS-${String(i + 1).padStart(2, "0")}`,
          title: w.title,
          objective: w.objective,
          owner_role: w.owner_role,
          duration_days: Math.max(1, Math.round(w.duration_days)),
          acceptance: w.acceptance,
          risk: w.risk,
          position: i,
        })
        .select("id")
        .maybeSingle();
      if (wsErr) throw new Error(wsErr.message);
      const rows = w.tasks.map((t, j) => {
        const dept = normalizeDepartment(t.department);
        const s = matchSpecialist(dept, taken);
        created += 1;
        return {
          owner_id: context.userId,
          workstream_id: (wsRow as { id: string }).id,
          request_id: req.id,
          title: t.title,
          detail: t.detail,
          specialist_id: s.id,
          specialist_role: s.role,
          department: dept,
          effort_hours: Math.min(40, Math.max(2, Math.round(t.effort_hours))),
          status: "todo",
          position: j,
        };
      });
      if (rows.length) {
        const { error: tErr } = await context.supabase.from("secp_tasks").insert(rows as never);
        if (tErr) throw new Error(tErr.message);
      }
    }
    return { requestId: req.id, workstreams: plan.length, tasks: created, source };
  });

const StatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]),
});

export const setTaskStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("secp_tasks")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ReassignSchema = z.object({
  taskId: z.string().uuid(),
  specialistId: z.string().min(2).max(40),
  specialistRole: z.string().min(2).max(120),
  department: z.string().min(2).max(60),
});

export const reassignTaskFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReassignSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("secp_tasks")
      .update({
        specialist_id: data.specialistId,
        specialist_role: data.specialistRole,
        department: data.department,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
