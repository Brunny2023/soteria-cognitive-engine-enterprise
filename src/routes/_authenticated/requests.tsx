import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { AUTONOMY_LABELS } from "@/lib/secp-data";
import { useRequests } from "@/lib/secp-store";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "Requests — Soteria SECP" },
      { name: "description", content: "The active queue of organizational cognition requests moving through intent, deliberation, planning, execution, and validation." },
      { property: "og:title", content: "Requests — Soteria SECP" },
      { property: "og:description", content: "Every directive, from executive intent to auditable delivery." },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const requests = useRequests();
  const open = requests.filter((r) => r.progress < 1).length;
  return (
    <AppShell title="Request Queue" crumb="RQ · Cognition pipeline">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Requests total" value={String(requests.length + 47)} />
          <StatChip label="Open" value={String(open + 12)} tone="accent" />
          <StatChip label="Closed today" value="14" tone="signal" />
          <StatChip label="Median cycle" value="6h 24m" />
        </section>

        <section>
          <SectionHeading
            code="RQ.1"
            title="Active Requests"
            action={
              <Link
                to="/requests/new"
                className="px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-mono uppercase tracking-widest rounded-sm hover:bg-primary/90 transition-colors"
              >
                + New directive
              </Link>
            }
          />
          <div className="bg-surface border border-border rounded-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-mono uppercase text-muted-foreground border-b border-border bg-secondary/40">
              <div className="col-span-1">ID</div>
              <div className="col-span-4">Directive</div>
              <div className="col-span-2">Origin</div>
              <div className="col-span-1">Prio</div>
              <div className="col-span-2">Autonomy</div>
              <div className="col-span-2">Progress</div>
            </div>
            {requests.map((r) => (
              <Link
                key={r.id}
                to="/requests/$id"
                params={{ id: r.id }}
                className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-secondary/30 transition-colors"
              >
                <div className="col-span-1 font-mono text-[11px] text-accent">{r.id}</div>
                <div className="col-span-4">
                  <div className="text-sm font-bold">{r.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{r.brief}</div>
                </div>
                <div className="col-span-2 text-[11px] text-muted-foreground">{r.origin}</div>
                <div className="col-span-1">
                  <span
                    className={
                      "font-mono text-[10px] px-1.5 py-0.5 " +
                      (r.priority === "P0"
                        ? "text-[color:var(--danger)] bg-[color:var(--danger)]/10"
                        : r.priority === "P1"
                          ? "text-[color:var(--warn)] bg-[color:var(--warn)]/10"
                          : "text-muted-foreground bg-secondary")
                    }
                  >
                    {r.priority}
                  </span>
                </div>
                <div className="col-span-2">
                  <div className="font-mono text-[10px] text-primary">L{r.autonomy}</div>
                  <div className="text-[9px] text-muted-foreground">{AUTONOMY_LABELS[r.autonomy]}</div>
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                    <span>{Math.round(r.progress * 100)}%</span>
                    <span>{r.updated}</span>
                  </div>
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className={"h-full " + (r.progress === 1 ? "bg-[color:var(--signal)]" : "bg-primary")}
                      style={{ width: `${Math.max(r.progress * 100, 2)}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}