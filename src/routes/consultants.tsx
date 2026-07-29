import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { CONSULTANTS } from "@/lib/secp-data";

export const Route = createFileRoute("/consultants")({
  head: () => ({
    meta: [
      { title: "Consultant Tier — Soteria SECP" },
      { name: "description", content: "Domain-specialist consultant agents translating organizational intent into solution architectures across fifteen industry and functional domains." },
      { property: "og:title", content: "Consultant Tier — Soteria SECP" },
      { property: "og:description", content: "Fifteen domain consultants combining organizational knowledge with deep expertise." },
    ],
  }),
  component: ConsultantsPage,
});

function ConsultantsPage() {
  const total = CONSULTANTS.reduce((s, c) => s + c.engagements, 0);
  return (
    <AppShell title="Consultant Tier" crumb="L3 · Domain expertise">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Domain consultants" value={String(CONSULTANTS.length)} />
          <StatChip label="Active engagements" value={String(total)} tone="accent" />
          <StatChip label="Deliverables in review" value="9" tone="warn" />
          <StatChip label="Avg specialist selection" value="4.2" />
        </section>

        <section>
          <SectionHeading code="L3.1" title="Consultant Catalog" />
          <div className="grid grid-cols-3 gap-3">
            {CONSULTANTS.map((c) => (
              <div key={c.id} className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[10px] text-accent">{c.id}</div>
                    <div className="text-sm font-bold tracking-tight">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{c.domain}</div>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">×{c.engagements}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.expertise.map((x) => (
                    <span key={x} className="text-[9px] font-mono uppercase tracking-widest border border-border px-1.5 py-0.5 text-muted-foreground">
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}