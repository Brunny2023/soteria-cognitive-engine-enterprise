import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import {
  AUTONOMY_LABELS,
  LAYERS,
  type Autonomy,
  type RequestRecord,
} from "@/lib/secp-data";
import { useRequest } from "@/lib/secp-store";

export const Route = createFileRoute("/requests/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Soteria SECP` },
      { name: "description", content: `Reasoning trace and validation battery for directive ${params.id}.` },
      { property: "og:title", content: `${params.id} — Soteria SECP` },
      { property: "og:description", content: `Reasoning trace and validation battery for directive ${params.id}.` },
    ],
  }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const request = useRequest(id);
  if (!request) {
    return (
      <AppShell title="Request not found" crumb={`${id} · missing`}>
        <div className="p-6 animate-entry">
          <div className="bg-surface border border-border rounded-sm p-6 max-w-lg">
            <div className="font-mono text-[10px] text-[color:var(--warn)] mb-2">404 · NO_RECORD</div>
            <p className="text-sm text-muted-foreground">
              No directive matches <span className="font-mono text-foreground">{id}</span>.
            </p>
            <Link
              to="/requests"
              className="inline-block mt-4 font-mono text-[11px] text-accent hover:text-foreground"
            >
              ← RETURN_TO_QUEUE
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }
  const inspector = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border">
        <div className="font-mono text-[10px] text-accent">{request.id} · INSPECTOR</div>
        <div className="text-sm font-bold mt-1">Validation Battery</div>
      </div>
      <div className="p-5 flex flex-col gap-3 overflow-y-auto">
        {request.validators.map((v: RequestRecord["validators"][number]) => (
          <div key={v.name} className="border border-border p-3 rounded-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{v.name}</span>
              <span
                className={
                  "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 " +
                  (v.status === "passed"
                    ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                    : v.status === "failed"
                      ? "text-[color:var(--danger)] bg-[color:var(--danger)]/10"
                      : "text-muted-foreground bg-secondary")
                }
              >
                {v.status}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{v.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AppShell title={request.title} crumb={`${request.id} · ${request.origin}`} inspector={inspector}>
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <Link to="/requests" className="text-muted-foreground hover:text-foreground">
            ← REQUEST_QUEUE
          </Link>
          <span className="text-border">/</span>
          <span className="text-accent">{request.id}</span>
        </div>

        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Priority" value={request.priority} tone={request.priority === "P0" ? "danger" : "warn"} />
          <StatChip label="Autonomy" value={`L${request.autonomy}`} tone="accent" />
          <StatChip label="Progress" value={`${Math.round(request.progress * 100)}%`} tone="signal" />
          <StatChip label="Last update" value={request.updated} />
        </section>

        <section className="bg-surface border border-border rounded-sm p-5">
          <SectionHeading code="BRIEF" title="Directive summary" />
          <p className="text-sm text-foreground leading-relaxed">{request.brief}</p>
          <div className="mt-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            Autonomy · {AUTONOMY_LABELS[request.autonomy as Autonomy]}
          </div>
        </section>

        <section>
          <SectionHeading code="TRACE" title="Reasoning timeline" />
          <div className="relative pl-6 border-l border-border">
            {request.steps.map((s: RequestRecord["steps"][number], i: number) => {
              const layer = LAYERS.find((l) => l.id === s.layer);
              return (
                <div key={i} className="relative pb-6 last:pb-0">
                  <span
                    className={
                      "absolute -left-[29px] top-1 size-3 rounded-full border-2 " +
                      (s.status === "complete"
                        ? "bg-[color:var(--signal)] border-[color:var(--signal)]"
                        : s.status === "active"
                          ? "bg-primary border-primary animate-pulse"
                          : "bg-background border-border")
                    }
                  />
                  <div className="bg-surface border border-border rounded-sm p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[10px] text-accent">{layer?.code}</span>
                      <span className="text-xs font-bold uppercase tracking-widest">{s.stage}</span>
                      <span
                        className={
                          "ml-auto font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 " +
                          (s.status === "complete"
                            ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                            : s.status === "active"
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground bg-secondary")
                        }
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold">{s.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-1">AGENT · {s.agent}</div>
                    <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">{s.reasoning}</p>
                    {s.artifact && (
                      <div className="mt-3 inline-flex items-center gap-2 border border-border px-2 py-1 text-[10px] font-mono text-accent">
                        ▤ {s.artifact}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}