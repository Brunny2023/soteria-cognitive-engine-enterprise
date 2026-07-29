import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/program")({
  head: () => ({
    meta: [
      { title: "Program Management — Soteria SECP" },
      { name: "description", content: "Convert consultant recommendations into executable work: WBS, milestones, dependencies, budgets, and acceptance criteria." },
      { property: "og:title", content: "Program Management — Soteria SECP" },
      { property: "og:description", content: "The orchestration layer between strategy and specialist workforce execution." },
    ],
  }),
  component: ProgramPage,
});

const WORKSTREAMS = [
  { code: "WS-01", title: "Legal entity formation", tasks: 8, owner: "Legal Consultant", progress: 0.4, days: 22 },
  { code: "WS-02", title: "Supply node bring-up (SG)", tasks: 12, owner: "Supply Chain Planner", progress: 0.15, days: 41 },
  { code: "WS-03", title: "Supply node bring-up (TH)", tasks: 11, owner: "Supply Chain Planner", progress: 0.05, days: 46 },
  { code: "WS-04", title: "Demand generation pilot", tasks: 9, owner: "Campaign Manager", progress: 0.0, days: 28 },
  { code: "WS-05", title: "Compliance & regulatory", tasks: 5, owner: "Compliance Analyst", progress: 0.3, days: 34 },
  { code: "WS-06", title: "Financial modeling & controls", tasks: 6, owner: "Financial Analyst", progress: 0.5, days: 18 },
];

function ProgramPage() {
  return (
    <AppShell title="Program Management" crumb="L4 · Plan & orchestrate">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Active programs" value="7" />
          <StatChip label="Tasks in flight" value="184" tone="accent" />
          <StatChip label="Critical path (median)" value="11w" />
          <StatChip label="Budget envelope" value="$18.6M" />
        </section>

        <section>
          <SectionHeading code="L4.1" title="RE-892 · SEA Expansion — Work Breakdown" />
          <div className="bg-surface border border-border rounded-sm">
            {WORKSTREAMS.map((w) => (
              <div key={w.code} className="grid grid-cols-12 gap-4 items-center px-5 py-4 border-b border-border last:border-b-0">
                <div className="col-span-1 font-mono text-[10px] text-accent">{w.code}</div>
                <div className="col-span-4">
                  <div className="text-xs font-bold">{w.title}</div>
                  <div className="text-[10px] text-muted-foreground">Owner · {w.owner}</div>
                </div>
                <div className="col-span-1 text-[10px] font-mono text-muted-foreground">{w.tasks} tasks</div>
                <div className="col-span-1 text-[10px] font-mono text-muted-foreground">{w.days}d</div>
                <div className="col-span-4">
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                    <span>PROGRESS</span>
                    <span>{Math.round(w.progress * 100)}%</span>
                  </div>
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(w.progress * 100, 1)}%` }} />
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <span className="font-mono text-[9px] text-muted-foreground">▸</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="L4.2" title="Acceptance Criteria" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li className="flex gap-2"><span className="text-accent font-mono">01</span> Legal entity operational in SG and TH with local counsel of record.</li>
              <li className="flex gap-2"><span className="text-accent font-mono">02</span> Hub warehouse throughput ≥ 8k units/wk at target OTIF ≥ 96%.</li>
              <li className="flex gap-2"><span className="text-accent font-mono">03</span> Pilot CAC/LTV within CFO envelope; contribution margin ≥ 22%.</li>
              <li className="flex gap-2"><span className="text-accent font-mono">04</span> All deliverables signed by Governance layer with reproducibility trace.</li>
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="L4.3" title="Risk Register" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li className="flex gap-2"><span className="text-[color:var(--danger)] font-mono">HIGH</span> Customs regime volatility in TH — mitigation: dual-broker posture.</li>
              <li className="flex gap-2"><span className="text-[color:var(--warn)] font-mono">MED</span> Supplier concentration &gt; 40% for hub SKUs.</li>
              <li className="flex gap-2"><span className="text-[color:var(--warn)] font-mono">MED</span> Brand localization drift risk in pilot creative.</li>
              <li className="flex gap-2"><span className="text-[color:var(--signal)] font-mono">LOW</span> Legal timing risk absorbed by 2-week buffer.</li>
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}