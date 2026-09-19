import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InboxTask = {
  id: string;
  request_id: string;
  request_title: string;
  workstream_id: string;
  workstream_code: string;
  workstream_title: string;
  title: string;
  detail: string;
  specialist_id: string;
  specialist_role: string;
  department: string;
  effort_hours: number;
  status: "todo" | "in_progress" | "blocked" | "done";
  artifact_id: string | null;
  artifact_checksum: string | null;
  updated_at: string;
};

export const listInboxFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InboxTask[]> => {
    const { data: tasks, error } = await context.supabase
      .from("secp_tasks")
      .select(
        "id,request_id,workstream_id,title,detail,specialist_id,specialist_role,department,effort_hours,status,updated_at,position",
      )
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (tasks ?? []) as (Omit<
      InboxTask,
      "request_title" | "workstream_code" | "workstream_title" | "artifact_id" | "artifact_checksum"
    > & { position: number })[];
    if (!rows.length) return [];

    const { data: ws } = await context.supabase.from("secp_workstreams").select("id,code,title");
    const { data: reqs } = await context.supabase.from("secp_requests").select("id,title");
    const { data: arts } = await context.supabase
      .from("secp_artifacts")
      .select("id,checksum,name,stage,request_id,created_at")
      .eq("stage", "workforce")
      .order("created_at", { ascending: false });

    const wsMap = new Map(
      ((ws ?? []) as { id: string; code: string; title: string }[]).map((w) => [w.id, w]),
    );
    const reqMap = new Map(
      ((reqs ?? []) as { id: string; title: string }[]).map((r) => [r.id, r.title]),
    );
    const artMap = new Map<string, { id: string; checksum: string }>();
    for (const a of (arts ?? []) as { id: string; checksum: string; name: string }[]) {
      if (!artMap.has(a.name)) artMap.set(a.name, { id: a.id, checksum: a.checksum });
    }

    return rows.map((t) => {
      const w = wsMap.get(t.workstream_id);
      const art = artMap.get(`${t.id}`) ?? artMap.get(t.title);
      return {
        ...t,
        request_title: reqMap.get(t.request_id) ?? t.request_id,
        workstream_code: w?.code ?? "WS-??",
        workstream_title: w?.title ?? "Unassigned workstream",
        artifact_id: art?.id ?? null,
        artifact_checksum: art?.checksum ?? null,
      };
    });
  });

/** Execute an assigned task: the specialist produces a real, checksummed deliverable. */
export const executeTaskFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ taskId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: task, error } = await context.supabase
      .from("secp_tasks")
      .select("id,request_id,workstream_id,title,detail,specialist_id,specialist_role,department")
      .eq("id", data.taskId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!task) throw new Error("Task not found");

    const t = task as {
      id: string;
      request_id: string;
      workstream_id: string;
      title: string;
      detail: string;
      specialist_id: string;
      specialist_role: string;
      department: string;
    };

    const { data: req } = await context.supabase
      .from("secp_requests")
      .select("title,brief")
      .eq("id", t.request_id)
      .maybeSingle();
    const { data: ws } = await context.supabase
      .from("secp_workstreams")
      .select("code,title,objective,acceptance")
      .eq("id", t.workstream_id)
      .maybeSingle();

    const directive = (req as { title?: string } | null)?.title ?? t.request_id;
    const brief = (req as { brief?: string } | null)?.brief ?? "";
    const stream = ws as {
      code?: string;
      title?: string;
      objective?: string;
      acceptance?: string;
    } | null;

    const { sha256, synthesize, taskDeliverableFallback } = await import("./exec.server");
    const fallback = taskDeliverableFallback({
      title: t.title,
      detail: t.detail,
      specialistRole: t.specialist_role,
      department: t.department,
      directive,
    });
    const { content, source } = await synthesize(
      `You are ${t.specialist_role} (${t.department}) in the SECP L5 specialist workforce. Execute this assigned task and produce the actual deliverable in markdown.

Directive: ${directive}
Directive brief: ${brief}
Workstream: ${stream?.code ?? ""} ${stream?.title ?? ""} — ${stream?.objective ?? ""}
Acceptance criteria: ${stream?.acceptance ?? "Reviewed by the governance layer."}
Task: ${t.title}
Task detail: ${t.detail}

Produce the finished work product itself, not a plan to do it. Include sections: Scope, Method, Findings/Output, Assumptions, Handover to validation. Be concrete, quantified where possible, and never invent named customers or regulations.`,
      fallback,
    );

    const checksum = await sha256(content);
    const { data: artifact, error: artErr } = await context.supabase
      .from("secp_artifacts")
      .insert({
        owner_id: context.userId,
        request_id: t.request_id,
        stage: "workforce",
        agent: `${t.specialist_id} · ${t.specialist_role}`,
        kind: "deliverable",
        name: t.id,
        content,
        checksum,
        inputs: {
          task_title: t.title,
          task_detail: t.detail,
          workstream: stream?.code ?? null,
          department: t.department,
          source,
        },
      })
      .select("id,checksum")
      .maybeSingle();
    if (artErr) throw new Error(artErr.message);

    await context.supabase
      .from("secp_tasks")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", t.id);

    return { artifactId: (artifact as { id: string } | null)?.id ?? null, checksum, source };
  });

export const getTaskArtifactFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ artifactId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("secp_artifacts")
      .select("id,name,content,checksum,agent,created_at")
      .eq("id", data.artifactId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row as {
      id: string;
      name: string;
      content: string;
      checksum: string;
      agent: string;
      created_at: string;
    } | null;
  });
