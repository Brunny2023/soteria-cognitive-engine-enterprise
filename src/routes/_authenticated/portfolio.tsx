import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { portfolioFn } from "@/lib/portfolio.functions";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio Control — Soteria SECP" },
      {
        name: "description",
        content:
          "Cross-directive portfolio: critical path, department capacity, specialist contention, and delivery health across every active program.",
      },
      { property: "og:title", content: "Portfolio Control — Soteria SECP" },
      {
        property: "og:description",
        content: "One view across every directive, workstream, and specialist allocation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

const RISK_TONE: Record<string, string> = {
  high: "text-[color:var(--danger)]",
  medium: "text-[color:var(--warn)]",
  low: "text-[color:var(--signal)]",
};

function PortfolioPage() {
  const load = useServerFn(portfolioFn);
  const q = useQuery({ queryKey: ["secp", "portfolio"], queryFn: () => load() });
  const data = q.data;
  const maxHours = Math.max(1, ...(data?.capacity ?? []).map((c) => c.hours));

  return (
    <AppShell title="Portfolio Control" crumb="PF · Cross-directive delivery">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-6 gap-3">
          <StatChip label="Directives" value={String(data?.totals.directives ?? 0)} />
          <StatChip label="Tasks" value={String(data?.totals.tasks ?? 0)} />
          <StatChip label="Completed" value={String(data?.totals.done ?? 0)} tone="signal" />
          <StatChip label="Blocked" value={String(data?.totals.blocked ?? 0)} tone="warn" />
          <StatChip label="Effort" value={`${data?.totals.effort_hours ?? 0}h`} />
          <StatChip
            label="Deliverables"
            value={String(data?.totals.deliverables ?? 0)}
            tone="accent"
          />
        </section>

        <section>
          <SectionHeading code="PF.1" title="Program Health" />
          {q.isLoading ? (
            <div className="text-xs font-mono text-muted-foreground">Aggregating portfolio…</div>
          ) : (data?.programs ?? []).length === 0 ? (
            <div className="bg-surface border border-border rounded-sm p-6 text-sm text-muted-foreground">
              No directives yet. Submit a directive and generate its plan on the Program layer.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(data?.programs ?? []).map((p) => {
                const pct = p.tasks
                  ? Math.round((p.done / p.tasks) * 100)
                  : Math.round(p.progress * 100);
                return (
                  <div
                    key={p.request_id}
                    className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] text-accent">
                          {p.request_id} · {p.priority.toUpperCase()} · A{p.autonomy}
                        </div>
                        <div className="text-sm font-bold tracking-tight">{p.title}</div>
                      </div>
                      <Link
                        to="/requests/$id"
                        params={{ id: p.request_id }}
                        className="shrink-0 text-[10px] font-mono uppercase tracking-widest border border-border px-2 py-1 hover:border-foreground/40"
                      >
                        Open directive
                      </Link>
                    </div>
                    <div className="h-1 bg-secondary rounded-sm overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <span>{pct}% complete</span>
                      <span>{p.streams.length} workstreams</span>
                      <span>{p.tasks} tasks</span>
                      <span>{p.effort_hours}h effort</span>
                      <span>critical path {p.critical_path_days}d</span>
                      <span className="text-[color:var(--signal)]">
                        {p.deliverables} signed deliverables
                      </span>
                      {p.blocked ? (
                        <span className="text-[color:var(--danger)]">{p.blocked} blocked</span>
                      ) : null}
                    </div>
                    {p.streams.length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {p.streams.map((s) => (
                          <div
                            key={s.id}
                            className="border border-border rounded-sm p-2 flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {s.code}
                              </span>
                              <span
                                className={
                                  "font-mono text-[9px] uppercase " + (RISK_TONE[s.risk] ?? "")
                                }
                              >
                                {s.risk} risk
                              </span>
                            </div>
                            <div className="text-xs font-medium truncate">{s.title}</div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {s.done}/{s.tasks} done · {s.effort_hours}h · {s.duration_days}d ·{" "}
                              {s.departments.join(", ") || "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground">
                        No plan generated yet.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-6">
          <div>
            <SectionHeading code="PF.2" title="Department Capacity" />
            <div className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-3">
              {(data?.capacity ?? []).length === 0 ? (
                <div className="text-xs text-muted-foreground">No allocations.</div>
              ) : (
                (data?.capacity ?? []).map((c) => (
                  <div key={c.department} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <span>{c.department}</span>
                      <span>
                        {c.hours}h · {c.specialists} specialists
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${(c.hours / maxHours) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <SectionHeading code="PF.3" title="Specialist Contention" />
            <div className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-2">
              {(data?.contention ?? []).length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  No specialist is over-allocated across directives.
                </div>
              ) : (
                (data?.contention ?? []).map((c) => (
                  <div
                    key={c.specialist_id}
                    className="flex items-center justify-between border-b border-border last:border-b-0 pb-2 last:pb-0"
                  >
                    <div>
                      <div className="font-mono text-[10px] text-primary">{c.specialist_id}</div>
                      <div className="text-xs">{c.specialist_role}</div>
                    </div>
                    <div className="text-right text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <div>{c.directives.length} directives</div>
                      <div className={c.open_tasks > 2 ? "text-[color:var(--warn)]" : ""}>
                        {c.open_tasks} open tasks
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
