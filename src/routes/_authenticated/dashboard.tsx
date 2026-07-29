import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import {
  AUDIT_LOG,
  AUTONOMY_LABELS,
  EXECUTIVES,
  KPIS,
  LAYERS,
  REQUESTS,
  SPECIALISTS,
} from "@/lib/secp-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Mission Control — Soteria SECP" },
      { name: "description", content: "Live cognition pipeline, executive roster, and organizational KPIs across the Soteria Enterprise Cognition Platform." },
      { property: "og:title", content: "Mission Control — Soteria SECP" },
      { property: "og:description", content: "Live cognition pipeline across six intelligence layers." },
    ],
  }),
  component: MissionControl,
});

function MissionControl() {
  const activeReq = REQUESTS.find((r) => r.progress < 1) ?? REQUESTS[0];
  const activeSpecialists = SPECIALISTS.filter((s) => s.status === "active");

  return (
    <AppShell
      title="Mission Control"
      crumb={`ACTIVE_REQUEST: ${activeReq.id}`}
      inspector={<Inspector />}
    >
      <div className="p-6 grid grid-cols-12 gap-6 animate-entry">
        {/* KPI ribbon */}
        <section className="col-span-12 grid grid-cols-6 gap-3">
          <StatChip label="Cognitive Load" value={`${Math.round(KPIS.cognitiveLoad * 100)}%`} tone="accent" />
          <StatChip label="Active Specialists" value={KPIS.activeSpecialists.toLocaleString()} />
          <StatChip label="Open Requests" value={String(KPIS.openRequests)} tone="warn" />
          <StatChip label="Entities Indexed" value={KPIS.entitiesIndexed.toLocaleString()} />
          <StatChip label="Graph Connectivity" value={KPIS.connectivity.toFixed(2)} tone="accent" />
          <StatChip label="Validation Pass" value={`${(KPIS.validationPassRate * 100).toFixed(1)}%`} tone="signal" />
        </section>

        {/* Layers strip */}
        <section className="col-span-12">
          <SectionHeading code="M0.1" title="Cognition Layers" />
          <div className="grid grid-cols-6 gap-3">
            {LAYERS.map((l) => (
              <Link
                key={l.id}
                to={l.route}
                className="group border border-border bg-surface rounded-sm p-4 flex flex-col gap-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-accent">{l.code}</span>
                  <span className="size-1.5 rounded-full bg-[color:var(--signal)]" />
                </div>
                <div className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{l.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{l.role}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Executive roster */}
        <section className="col-span-12">
          <SectionHeading
            code="L2.0"
            title="Executive Intelligence Layer"
            action={<Link to="/executives" className="text-[10px] text-primary hover:underline font-mono">VIEW FULL COUNCIL →</Link>}
          />
          <div className="grid grid-cols-4 gap-3">
            {EXECUTIVES.slice(0, 8).map((e) => (
              <div
                key={e.id}
                className={
                  "bg-surface border border-border p-4 rounded-sm relative overflow-hidden " +
                  (e.status === "hibernating" ? "opacity-60" : "")
                }
              >
                <div className="absolute top-2 right-3 font-mono text-[8px] tracking-widest">
                  {e.status === "active" && <span className="text-[color:var(--signal)]">ACTIVE</span>}
                  {e.status === "deliberating" && <span className="text-accent">DELIBERATING</span>}
                  {e.status === "hibernating" && <span className="text-muted-foreground">HIBERNATING</span>}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mb-1">{e.id}</p>
                <h3 className="text-sm font-bold mb-1 tracking-tight">{e.codename}</h3>
                <p className="text-[10px] text-muted-foreground mb-3">{e.title}</p>
                <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                  <div
                    className={
                      "h-full rounded-full " +
                      (e.status === "active"
                        ? "bg-primary"
                        : e.status === "deliberating"
                          ? "bg-accent"
                          : "bg-border")
                    }
                    style={{ width: `${Math.max(e.load * 100, 2)}%` }}
                  />
                </div>
                <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">{e.focus}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cognition pipeline + right column */}
        <section className="col-span-8">
          <SectionHeading
            code="M0.2"
            title="Active Cognition Pipeline"
            action={<Link to="/requests" className="text-[10px] text-primary hover:underline font-mono">ALL REQUESTS →</Link>}
          />
          <div className="bg-surface border border-border rounded-sm">
            {REQUESTS.map((r) => (
              <Link
                key={r.id}
                to="/requests/$id"
                params={{ id: r.id }}
                className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors group"
              >
                <div
                  className={
                    "size-8 shrink-0 rounded-full border-2 flex items-center justify-center " +
                    (r.progress === 1
                      ? "border-[color:var(--signal)] bg-[color:var(--signal)]/10"
                      : r.progress > 0.5
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background")
                  }
                >
                  <span
                    className={
                      "size-1.5 rounded-full " +
                      (r.progress < 1 ? "bg-primary animate-pulse" : "bg-[color:var(--signal)]")
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
                    <span className="text-xs font-bold group-hover:text-primary transition-colors">{r.title}</span>
                    <span
                      className={
                        "px-1.5 py-0.5 text-[8px] font-mono uppercase " +
                        (r.priority === "P0"
                          ? "bg-[color:var(--danger)]/10 text-[color:var(--danger)]"
                          : r.priority === "P1"
                            ? "bg-[color:var(--warn)]/10 text-[color:var(--warn)]"
                            : "bg-secondary text-muted-foreground")
                      }
                    >
                      {r.priority}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {r.origin} · Autonomy L{r.autonomy} · {AUTONOMY_LABELS[r.autonomy]}
                  </p>
                </div>
                <div className="w-40 shrink-0">
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                    <span>PROGRESS</span>
                    <span>{Math.round(r.progress * 100)}%</span>
                  </div>
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className={"h-full " + (r.progress === 1 ? "bg-[color:var(--signal)]" : "bg-primary")}
                      style={{ width: `${r.progress * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground w-16 text-right">{r.updated}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="col-span-4 flex flex-col gap-4">
          <SectionHeading code="L6.0" title="Recent Audit Trail" action={<Link to="/governance" className="text-[10px] text-primary hover:underline font-mono">FULL LOG →</Link>} />
          <div className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-3">
            {AUDIT_LOG.slice(0, 6).map((a, i) => (
              <div key={i} className="border-l border-border pl-3 py-1">
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
                  <span className="text-accent">{a.time}</span>
                  <span className="uppercase">{a.layer}</span>
                  {a.requestId && <span className="text-primary">{a.requestId}</span>}
                </div>
                <div className="text-[11px] text-foreground mt-0.5 leading-snug">
                  <span className="text-muted-foreground">{a.actor}</span> · {a.action}
                </div>
              </div>
            ))}
          </div>
          <SectionHeading code="L5.0" title="Live Workforce" action={<Link to="/workforce" className="text-[10px] text-primary hover:underline font-mono">OPEN CATALOG →</Link>} />
          <div className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-2">
            {activeSpecialists.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="size-1.5 rounded-full bg-[color:var(--signal)] animate-pulse" />
                <div className="flex-1 min-w-0 flex items-center justify-between text-[11px]">
                  <span className="font-medium truncate">{s.role}</span>
                  <span className="font-mono text-[9px] text-muted-foreground shrink-0 ml-2">
                    L{s.level} · A{s.autonomy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Inspector() {
  const r = REQUESTS[0];
  return (
    <>
      <div className="p-5 border-b border-border">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Inspector · {r.id}
        </h2>
        <div className="flex gap-2 mb-3">
          <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-sm font-mono">IN_PROGRESS</span>
          <span className="text-[9px] bg-secondary text-muted-foreground border border-border px-2 py-0.5 rounded-sm font-mono">A{r.autonomy}</span>
          <span className="text-[9px] bg-secondary text-muted-foreground border border-border px-2 py-0.5 rounded-sm font-mono">{r.priority}</span>
        </div>
        <h3 className="text-base font-bold tracking-tight mb-2">{r.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{r.brief}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        <div>
          <h4 className="text-[9px] font-bold uppercase text-muted-foreground mb-2 tracking-widest">Reasoning Log</h4>
          <div className="bg-background font-mono text-[10px] p-3 border border-border text-muted-foreground leading-relaxed">
            {r.steps
              .filter((s) => s.status !== "pending")
              .map((s, i) => (
                <div key={i} className="mb-1.5">
                  <span className="text-accent">[{String(14 + i).padStart(2, "0")}:0{i}]</span>{" "}
                  <span className={s.status === "active" ? "text-foreground" : ""}>
                    {s.title} · {s.agent}
                  </span>
                </div>
              ))}
          </div>
        </div>
        <div>
          <h4 className="text-[9px] font-bold uppercase text-muted-foreground mb-2 tracking-widest">Validators</h4>
          <div className="flex flex-col gap-2">
            {r.validators.map((v) => (
              <div key={v.name} className="flex items-center justify-between text-[11px] border-b border-border pb-1.5">
                <span>{v.name}</span>
                <span
                  className={
                    "font-mono text-[9px] uppercase " +
                    (v.status === "passed"
                      ? "text-[color:var(--signal)]"
                      : v.status === "failed"
                        ? "text-[color:var(--danger)]"
                        : "text-muted-foreground")
                  }
                >
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[9px] font-bold uppercase text-muted-foreground mb-2 tracking-widest">Autonomy</h4>
          <div className="flex justify-between items-center text-[10px] mb-2">
            <span>Approval threshold</span>
            <span className="font-mono text-primary">L{r.autonomy}</span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(r.autonomy / 4) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[8px] text-muted-foreground font-mono mt-1">
            <span>RECOMMEND</span>
            <span>SUPERVISED</span>
            <span>AUTONOMOUS</span>
          </div>
        </div>
      </div>
      <div className="p-5 border-t border-border">
        <Link
          to="/requests/$id"
          params={{ id: r.id }}
          className="block w-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest text-center py-3 rounded-sm hover:bg-accent transition-colors"
        >
          Open Request Timeline
        </Link>
      </div>
    </>
  );
}
