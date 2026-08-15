import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { SPECIALISTS } from "@/lib/secp-data";
import {
  generatePlanFn,
  getProgramFn,
  listProgramsFn,
  reassignTaskFn,
  setTaskStatusFn,
  type TaskRow,
} from "@/lib/program.functions";

export const Route = createFileRoute("/_authenticated/program")({
  head: () => ({
    meta: [
      { title: "Program Management — Soteria SECP" },
      { name: "description", content: "Convert directives into executable work: AI-generated work breakdown, specialist assignment, effort, risk, and acceptance criteria." },
      { property: "og:title", content: "Program Management — Soteria SECP" },
      { property: "og:description", content: "The orchestration layer between strategy and specialist workforce execution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramPage,
});

const STATUS: { id: TaskRow["status"]; label: string; tone: string }[] = [
  { id: "todo", label: "TODO", tone: "text-muted-foreground border-border" },
  { id: "in_progress", label: "IN FLIGHT", tone: "text-primary border-primary/40 bg-primary/10" },
  { id: "blocked", label: "BLOCKED", tone: "text-[color:var(--danger)] border-[color:var(--danger)]/40" },
  { id: "done", label: "DONE", tone: "text-[color:var(--signal)] border-[color:var(--signal)]/40" },
];

const RISK_TONE: Record<string, string> = {
  high: "text-[color:var(--danger)]",
  medium: "text-[color:var(--warn)]",
  low: "text-[color:var(--signal)]",
};

function ProgramPage() {
  const qc = useQueryClient();
  const listPrograms = useServerFn(listProgramsFn);
  const getProgram = useServerFn(getProgramFn);
  const generatePlan = useServerFn(generatePlanFn);
  const setStatus = useServerFn(setTaskStatusFn);
  const reassign = useServerFn(reassignTaskFn);

  const [selected, setSelected] = useState<string | null>(null);

  const programs = useQuery({ queryKey: ["secp", "programs"], queryFn: () => listPrograms() });
  const active = selected ?? programs.data?.[0]?.request_id ?? null;

  const plan = useQuery({
    queryKey: ["secp", "program", active],
    queryFn: () => getProgram({ data: { requestId: active as string } }),
    enabled: !!active,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["secp", "program", active] });
    qc.invalidateQueries({ queryKey: ["secp", "programs"] });
  };

  const gen = useMutation({
    mutationFn: () => generatePlan({ data: { requestId: active as string } }),
    onSuccess: invalidate,
  });
  const status = useMutation({
    mutationFn: (v: { taskId: string; status: TaskRow["status"] }) => setStatus({ data: v }),
    onSuccess: invalidate,
  });
  const assign = useMutation({
    mutationFn: (v: { taskId: string; specialistId: string }) => {
      const s = SPECIALISTS.find((x) => x.id === v.specialistId)!;
      return reassign({
        data: { taskId: v.taskId, specialistId: s.id, specialistRole: s.role, department: s.department },
      });
    },
    onSuccess: invalidate,
  });

  const workstreams = plan.data ?? [];
  const allTasks = useMemo(() => workstreams.flatMap((w) => w.tasks), [workstreams]);
  const doneCount = allTasks.filter((t) => t.status === "done").length;
  const effort = allTasks.reduce((a, t) => a + t.effort_hours, 0);
  const criticalPath = workstreams.reduce((a, w) => Math.max(a, w.duration_days), 0);
  const activeProgram = programs.data?.find((p) => p.request_id === active);

  return (
    <AppShell title="Program Management" crumb="L4 · Plan & orchestrate">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Directives tracked" value={String(programs.data?.length ?? 0)} />
          <StatChip label="Tasks in flight" value={String(allTasks.filter((t) => t.status === "in_progress").length)} tone="accent" />
          <StatChip label="Critical path" value={criticalPath ? `${criticalPath}d` : "—"} />
          <StatChip label="Effort committed" value={`${effort}h`} />
        </section>

        <section>
          <SectionHeading
            code="L4.0"
            title="Directive portfolio"
            action={<span className="font-mono text-[10px] text-muted-foreground">{doneCount}/{allTasks.length} tasks complete</span>}
          />
          <div className="flex flex-wrap gap-2">
            {(programs.data ?? []).map((p) => (
              <button
                key={p.request_id}
                onClick={() => setSelected(p.request_id)}
                className={
                  "px-3 py-2 text-[10px] font-mono uppercase tracking-widest border rounded-sm transition-colors text-left " +
                  (active === p.request_id
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40")
                }
              >
                {p.request_id} · {p.title.slice(0, 34)}
                <span className="ml-2 text-[9px] opacity-70">{p.workstreams} WS / {p.tasks} tasks</span>
              </button>
            ))}
            {!programs.isLoading && !(programs.data ?? []).length && (
              <p className="font-mono text-[11px] text-muted-foreground">
                No directives yet — submit one from the Requests console to plan it here.
              </p>
            )}
          </div>
        </section>

        {active && (
          <section>
            <SectionHeading
              code="L4.1"
              title={`${active} · Work breakdown`}
              action={
                <button
                  type="button"
                  onClick={() => gen.mutate()}
                  disabled={gen.isPending}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50"
                >
                  {gen.isPending ? "▪ Decomposing…" : workstreams.length ? "↻ Regenerate plan" : "▸ Generate plan"}
                </button>
              }
            />
            {gen.data && (
              <p className="font-mono text-[10px] text-muted-foreground mb-3">
                {gen.data.workstreams} workstreams · {gen.data.tasks} tasks · source: {gen.data.source}
              </p>
            )}
            {gen.isError && (
              <p className="font-mono text-[10px] text-[color:var(--danger)] mb-3">
                Plan synthesis failed — {(gen.error as Error).message}
              </p>
            )}

            <div className="flex flex-col gap-4">
              {workstreams.map((w) => {
                const wDone = w.tasks.filter((t) => t.status === "done").length;
                const progress = w.tasks.length ? wDone / w.tasks.length : 0;
                return (
                  <div key={w.id} className="bg-surface border border-border rounded-sm">
                    <div className="px-5 py-4 border-b border-border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] text-accent">{w.code} · {w.owner_role}</div>
                          <div className="text-sm font-bold mt-1">{w.title}</div>
                          <div className="text-[11px] text-muted-foreground mt-1">{w.objective}</div>
                        </div>
                        <div className="text-right shrink-0 font-mono text-[10px] text-muted-foreground">
                          <div>{w.duration_days}d</div>
                          <div className={RISK_TONE[w.risk] ?? "text-muted-foreground"}>RISK {w.risk.toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                          <span>PROGRESS</span>
                          <span>{Math.round(progress * 100)}%</span>
                        </div>
                        <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.max(progress * 100, 1)}%` }} />
                        </div>
                      </div>
                      {w.acceptance && (
                        <div className="text-[10px] text-muted-foreground mt-3">
                          <span className="font-mono text-accent">ACCEPTANCE · </span>{w.acceptance}
                        </div>
                      )}
                    </div>

                    {w.tasks.map((t) => (
                      <div key={t.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3 border-b border-border last:border-b-0">
                        <div className="col-span-4 min-w-0">
                          <div className="text-xs font-medium truncate">{t.title}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{t.detail}</div>
                        </div>
                        <div className="col-span-3">
                          <select
                            aria-label={`Assign specialist for ${t.title}`}
                            value={t.specialist_id}
                            onChange={(e) => assign.mutate({ taskId: t.id, specialistId: e.target.value })}
                            className="w-full bg-background border border-border rounded-sm px-2 py-1 font-mono text-[10px] text-foreground"
                          >
                            {SPECIALISTS.map((s) => (
                              <option key={s.id} value={s.id}>{s.id} · {s.role}</option>
                            ))}
                          </select>
                          <div className="text-[9px] font-mono text-muted-foreground mt-1">{t.department}</div>
                        </div>
                        <div className="col-span-1 font-mono text-[10px] text-muted-foreground">{t.effort_hours}h</div>
                        <div className="col-span-4 flex flex-wrap gap-1 justify-end">
                          {STATUS.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => status.mutate({ taskId: t.id, status: s.id })}
                              className={
                                "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border rounded-sm transition-colors " +
                                (t.status === s.id ? s.tone : "border-border text-muted-foreground hover:text-foreground")
                              }
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {!w.tasks.length && (
                      <div className="px-5 py-3 font-mono text-[10px] text-muted-foreground">No tasks in this workstream.</div>
                    )}
                  </div>
                );
              })}

              {!plan.isLoading && !workstreams.length && (
                <div className="bg-surface border border-border rounded-sm p-6 font-mono text-[11px] text-muted-foreground">
                  No work breakdown yet for {active}
                  {activeProgram ? ` · ${activeProgram.title}` : ""}. Generate a plan to decompose it into
                  workstreams and assign the specialist mesh.
                </div>
              )}
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="L4.2" title="Capacity by department" />
            <div className="flex flex-col gap-2">
              {Object.entries(
                allTasks.reduce<Record<string, number>>((acc, t) => {
                  acc[t.department] = (acc[t.department] ?? 0) + t.effort_hours;
                  return acc;
                }, {}),
              ).map(([dept, hours]) => (
                <div key={dept} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 font-mono text-[10px] text-muted-foreground">{dept}</span>
                  <div className="h-1 flex-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${Math.min(100, (hours / Math.max(effort, 1)) * 100)}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-foreground w-12 text-right">{hours}h</span>
                </div>
              ))}
              {!allTasks.length && <p className="text-[11px] text-muted-foreground">No committed effort yet.</p>}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="L4.3" title="Risk register" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              {workstreams.map((w) => (
                <li key={w.id} className="flex gap-2">
                  <span className={"font-mono " + (RISK_TONE[w.risk] ?? "")}>{w.risk.toUpperCase()}</span>
                  <span>{w.title} — {w.duration_days}d, {w.tasks.length} tasks, owner {w.owner_role}.</span>
                </li>
              ))}
              {!workstreams.length && <li>No workstreams planned yet.</li>}
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
