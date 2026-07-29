import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { KNOWLEDGE_NODES } from "@/lib/secp-data";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Graph — Soteria SECP" },
      { name: "description", content: "The living enterprise knowledge graph — entities, relationships, and the reasoning substrate for every AI executive and specialist." },
      { property: "og:title", content: "Knowledge Graph — Soteria SECP" },
      { property: "og:description", content: "Entities and relationships that power organizational reasoning." },
    ],
  }),
  component: KnowledgePage,
});

const RELATIONS = [
  "reports_to", "owns", "depends_on", "approved_by", "created",
  "affects", "complies_with", "learned_from", "supports", "manages",
];

function KnowledgePage() {
  return (
    <AppShell title="Knowledge Graph" crumb="KG · 42,109 entities · 1.2M edges">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Entities" value="42,109" />
          <StatChip label="Relationships" value="1.2M" tone="accent" />
          <StatChip label="Relation types" value={String(RELATIONS.length)} />
          <StatChip label="Connectivity" value="0.94" tone="signal" />
        </section>

        <section className="grid grid-cols-12 gap-6">
          <div className="col-span-8 bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="KG.1" title="Graph Field" />
            <div className="relative aspect-[16/9] bg-background border border-border rounded-sm overflow-hidden">
              <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full">
                <defs>
                  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="oklch(0.72 0.16 230)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="oklch(0.72 0.16 230)" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {Array.from({ length: 60 }).map((_, i) => {
                  const a = (i * 137.5) % 360;
                  const b = ((i + 7) * 137.5) % 360;
                  const r1 = 60 + (i % 5) * 40;
                  const r2 = 60 + ((i + 3) % 5) * 40;
                  const x1 = 400 + Math.cos((a * Math.PI) / 180) * r1;
                  const y1 = 225 + Math.sin((a * Math.PI) / 180) * r1;
                  const x2 = 400 + Math.cos((b * Math.PI) / 180) * r2;
                  const y2 = 225 + Math.sin((b * Math.PI) / 180) * r2;
                  return (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(0.72 0.16 230)" strokeOpacity="0.15" strokeWidth="0.5" />
                  );
                })}
                {Array.from({ length: 80 }).map((_, i) => {
                  const a = (i * 137.5) % 360;
                  const r = 40 + (i % 6) * 35;
                  const x = 400 + Math.cos((a * Math.PI) / 180) * r;
                  const y = 225 + Math.sin((a * Math.PI) / 180) * r;
                  const size = 1 + (i % 4);
                  const isAccent = i % 9 === 0;
                  return (
                    <circle key={i} cx={x} cy={y} r={size}
                      fill={isAccent ? "oklch(0.85 0.16 195)" : "oklch(0.72 0.16 230)"}
                      opacity={0.4 + (i % 6) * 0.1} />
                  );
                })}
                <circle cx="400" cy="225" r="120" fill="url(#glow)" />
                <circle cx="400" cy="225" r="4" fill="oklch(0.85 0.16 195)" />
              </svg>
              <div className="absolute bottom-2 right-3 font-mono text-[9px] text-muted-foreground tracking-widest">
                GRAPH_VISUALIZER.SYS · rendered client-side
              </div>
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
            <div className="bg-surface border border-border rounded-sm p-5">
              <SectionHeading code="KG.2" title="Relation Types" />
              <div className="flex flex-wrap gap-1.5">
                {RELATIONS.map((r) => (
                  <span key={r} className="text-[10px] font-mono px-2 py-1 border border-border text-muted-foreground">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-sm p-5">
              <SectionHeading code="KG.3" title="Top Nodes" />
              <div className="flex flex-col gap-2">
                {KNOWLEDGE_NODES.map((n) => (
                  <div key={n.id} className="flex items-center justify-between text-[11px] border-b border-border pb-1.5 last:border-b-0">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{n.label}</div>
                      <div className="text-[9px] font-mono text-muted-foreground uppercase">{n.kind}</div>
                    </div>
                    <span className="font-mono text-accent shrink-0">{n.edges}▸</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}