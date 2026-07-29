import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { AUTONOMY_LABELS, EXECUTIVES } from "@/lib/secp-data";

export const Route = createFileRoute("/executives")({
  head: () => ({
    meta: [
      { title: "Executive Council — Soteria SECP" },
      { name: "description", content: "The AI executive council: eleven officer agents that interpret intent, deliberate, and set execution strategy for the organization." },
      { property: "og:title", content: "Executive Council — Soteria SECP" },
      { property: "og:description", content: "Eleven officer agents reasoning across strategy, risk, capital, and operations." },
    ],
  }),
  component: ExecutivesPage,
});

function ExecutivesPage() {
  const active = EXECUTIVES.filter((e) => e.status !== "hibernating").length;
  return (
    <AppShell title="Executive Council" crumb="L2 · Leadership reasoning">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Officers on council" value={String(EXECUTIVES.length)} />
          <StatChip label="Currently reasoning" value={String(active)} tone="signal" />
          <StatChip label="Deliberations open" value="3" tone="accent" />
          <StatChip label="Median cognitive load" value="49%" />
        </section>

        <section>
          <SectionHeading code="L2.1" title="Full Council" />
          <div className="grid grid-cols-3 gap-3">
            {EXECUTIVES.map((e) => (
              <div
                key={e.id}
                className={
                  "bg-surface border border-border rounded-sm p-5 flex flex-col gap-3 " +
                  (e.status === "hibernating" ? "opacity-60" : "")
                }
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[10px] text-muted-foreground">{e.id}</div>
                    <div className="text-sm font-bold tracking-tight">{e.codename}</div>
                    <div className="text-[10px] text-muted-foreground">{e.title}</div>
                  </div>
                  <span
                    className={
                      "font-mono text-[8px] tracking-widest px-1.5 py-0.5 " +
                      (e.status === "active"
                        ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                        : e.status === "deliberating"
                          ? "text-accent bg-accent/10"
                          : "text-muted-foreground bg-secondary")
                    }
                  >
                    {e.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                    <span>COG_LOAD</span>
                    <span>{Math.round(e.load * 100)}%</span>
                  </div>
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className={
                        "h-full " +
                        (e.status === "active" ? "bg-primary" : e.status === "deliberating" ? "bg-accent" : "bg-border")
                      }
                      style={{ width: `${Math.max(e.load * 100, 2)}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{e.focus}</p>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-border">
                  <span className="text-muted-foreground">Autonomy</span>
                  <span className="font-mono text-primary">L{e.autonomy} · {AUTONOMY_LABELS[e.autonomy]}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}