import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PortfolioStream = {
  id: string;
  code: string;
  title: string;
  risk: string;
  duration_days: number;
  tasks: number;
  done: number;
  blocked: number;
  effort_hours: number;
  departments: string[];
};

export type PortfolioProgram = {
  request_id: string;
  title: string;
  priority: string;
  autonomy: number;
  progress: number;
  streams: PortfolioStream[];
  critical_path_days: number;
  effort_hours: number;
  tasks: number;
  done: number;
  blocked: number;
  deliverables: number;
};

export type PortfolioView = {
  programs: PortfolioProgram[];
  capacity: { department: string; hours: number; specialists: number }[];
  contention: {
    specialist_id: string;
    specialist_role: string;
    directives: string[];
    open_tasks: number;
  }[];
  totals: {
    directives: number;
    tasks: number;
    done: number;
    blocked: number;
    effort_hours: number;
    deliverables: number;
  };
};

/** Cross-directive portfolio: critical path, capacity, and specialist contention. */
export const portfolioFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PortfolioView> => {
    const { data: reqs, error } = await context.supabase
      .from("secp_requests")
      .select("id,title,priority,autonomy,progress")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: ws } = await context.supabase
      .from("secp_workstreams")
      .select("id,request_id,code,title,risk,duration_days,position")
      .order("position", { ascending: true });
    const { data: tasks } = await context.supabase
      .from("secp_tasks")
      .select(
        "id,request_id,workstream_id,status,effort_hours,department,specialist_id,specialist_role",
      );
    const { data: arts } = await context.supabase
      .from("secp_artifacts")
      .select("request_id,stage")
      .eq("stage", "workforce");

    const requests = (reqs ?? []) as {
      id: string;
      title: string;
      priority: string;
      autonomy: number;
      progress: number;
    }[];
    const streams = (ws ?? []) as {
      id: string;
      request_id: string;
      code: string;
      title: string;
      risk: string;
      duration_days: number;
    }[];
    const rows = (tasks ?? []) as {
      id: string;
      request_id: string;
      workstream_id: string;
      status: string;
      effort_hours: number;
      department: string;
      specialist_id: string;
      specialist_role: string;
    }[];
    const deliverables = (arts ?? []) as { request_id: string }[];

    const programs: PortfolioProgram[] = requests.map((r) => {
      const rStreams = streams.filter((s) => s.request_id === r.id);
      const rTasks = rows.filter((t) => t.request_id === r.id);
      const streamViews: PortfolioStream[] = rStreams.map((s) => {
        const st = rTasks.filter((t) => t.workstream_id === s.id);
        return {
          id: s.id,
          code: s.code,
          title: s.title,
          risk: s.risk,
          duration_days: s.duration_days,
          tasks: st.length,
          done: st.filter((t) => t.status === "done").length,
          blocked: st.filter((t) => t.status === "blocked").length,
          effort_hours: st.reduce((a, t) => a + t.effort_hours, 0),
          departments: Array.from(new Set(st.map((t) => t.department))),
        };
      });
      return {
        request_id: r.id,
        title: r.title,
        priority: r.priority,
        autonomy: r.autonomy,
        progress: r.progress,
        streams: streamViews,
        critical_path_days: rStreams.reduce((a, s) => Math.max(a, s.duration_days), 0),
        effort_hours: rTasks.reduce((a, t) => a + t.effort_hours, 0),
        tasks: rTasks.length,
        done: rTasks.filter((t) => t.status === "done").length,
        blocked: rTasks.filter((t) => t.status === "blocked").length,
        deliverables: deliverables.filter((a) => a.request_id === r.id).length,
      };
    });

    const capMap = new Map<string, { hours: number; specialists: Set<string> }>();
    for (const t of rows) {
      const e = capMap.get(t.department) ?? { hours: 0, specialists: new Set<string>() };
      e.hours += t.effort_hours;
      e.specialists.add(t.specialist_id);
      capMap.set(t.department, e);
    }

    const contMap = new Map<string, { role: string; directives: Set<string>; open: number }>();
    for (const t of rows) {
      const e = contMap.get(t.specialist_id) ?? {
        role: t.specialist_role,
        directives: new Set<string>(),
        open: 0,
      };
      e.directives.add(t.request_id);
      if (t.status !== "done") e.open += 1;
      contMap.set(t.specialist_id, e);
    }

    return {
      programs,
      capacity: Array.from(capMap.entries())
        .map(([department, v]) => ({ department, hours: v.hours, specialists: v.specialists.size }))
        .sort((a, b) => b.hours - a.hours),
      contention: Array.from(contMap.entries())
        .map(([specialist_id, v]) => ({
          specialist_id,
          specialist_role: v.role,
          directives: Array.from(v.directives),
          open_tasks: v.open,
        }))
        .filter((c) => c.directives.length > 1 || c.open_tasks > 2)
        .sort((a, b) => b.directives.length - a.directives.length || b.open_tasks - a.open_tasks),
      totals: {
        directives: requests.length,
        tasks: rows.length,
        done: rows.filter((t) => t.status === "done").length,
        blocked: rows.filter((t) => t.status === "blocked").length,
        effort_hours: rows.reduce((a, t) => a + t.effort_hours, 0),
        deliverables: deliverables.length,
      },
    };
  });
