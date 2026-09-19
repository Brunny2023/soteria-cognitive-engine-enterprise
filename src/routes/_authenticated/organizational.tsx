import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { KPIS, KNOWLEDGE_NODES } from "@/lib/secp-data";

export const Route = createFileRoute("/_authenticated/organizational")({
  head: () => ({
    meta: [
      { title: "Organizational Intelligence — Soteria SECP" },
      {
        name: "description",
        content:
          "The organization's cognitive foundation: mission, values, structure, policies, decisions, and institutional knowledge.",
      },
      { property: "og:title", content: "Organizational Intelligence — Soteria SECP" },
      {
        property: "og:description",
        content: "The persistent knowledge source powering every AI executive and specialist.",
      },
    ],
  }),
  component: OrganizationalPage,
});

const FACETS = [
  {
    code: "MISSION",
    label: "Mission",
    body: "Give every organization a digital executive team and workforce that operate on its own knowledge, culture, and standards.",
  },
  {
    code: "VISION",
    label: "Vision",
    body: "Establish the cognitive operating system for modern enterprises.",
  },
  {
    code: "VALUES",
    label: "Values",
    body: "Rigor · Explainability · Alignment · Accountability · Continuous learning.",
  },
  {
    code: "STRUCTURE",
    label: "Structure",
    body: "11 executive functions · 7 departments · 42 specialist roles · 6 governance gates.",
  },
];

const INGESTED = [
  { kind: "Policies", count: 214, delta: "+6" },
  { kind: "SOPs", count: 88, delta: "+2" },
  { kind: "Regulations", count: 47, delta: "0" },
  { kind: "Historical projects", count: 1_142, delta: "+31" },
  { kind: "Decisions", count: 3_408, delta: "+112" },
  { kind: "Brand assets", count: 176, delta: "+0" },
  { kind: "KPIs", count: 84, delta: "+3" },
  { kind: "Domain glossary", count: 2_640, delta: "+58" },
];

export default function OrganizationalPage() {
  return (
    <AppShell title="Organizational Layer" crumb="L1 · Cognitive foundation">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Indexed entities" value={KPIS.entitiesIndexed.toLocaleString()} />
          <StatChip label="Graph connectivity" value={KPIS.connectivity.toFixed(2)} tone="accent" />
          <StatChip label="Ingestion pipelines" value="24" />
          <StatChip label="Freshness (median)" value="4m" tone="signal" />
        </section>

        <section>
          <SectionHeading code="L1.1" title="Organizational Identity" />
          <div className="grid grid-cols-4 gap-3">
            {FACETS.map((f) => (
              <div key={f.code} className="bg-surface border border-border p-4 rounded-sm">
                <div className="font-mono text-[10px] text-accent mb-1">{f.code}</div>
                <div className="text-sm font-bold mb-2">{f.label}</div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading code="L1.2" title="Ingested Knowledge" />
          <div className="bg-surface border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2 text-[10px] font-mono uppercase text-muted-foreground">
                    Corpus
                  </th>
                  <th className="text-right px-4 py-2 text-[10px] font-mono uppercase text-muted-foreground">
                    Count
                  </th>
                  <th className="text-right px-4 py-2 text-[10px] font-mono uppercase text-muted-foreground">
                    Δ 24h
                  </th>
                  <th className="text-right px-4 py-2 text-[10px] font-mono uppercase text-muted-foreground">
                    Coverage
                  </th>
                </tr>
              </thead>
              <tbody>
                {INGESTED.map((row, i) => (
                  <tr key={row.kind} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">{row.kind}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-[color:var(--signal)]">
                      {row.delta}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-block w-32 h-1 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${60 + i * 4}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionHeading code="L1.3" title="Anchored Knowledge Nodes" />
          <div className="grid grid-cols-3 gap-3">
            {KNOWLEDGE_NODES.map((n) => (
              <div
                key={n.id}
                className="bg-surface border border-border rounded-sm p-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="font-mono text-[9px] text-muted-foreground uppercase">
                    {n.kind}
                  </div>
                  <div className="text-xs font-medium truncate">{n.label}</div>
                </div>
                <div className="font-mono text-[10px] text-accent shrink-0">{n.edges}▸</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
