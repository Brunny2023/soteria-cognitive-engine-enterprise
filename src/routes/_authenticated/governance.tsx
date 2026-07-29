import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { AUDIT_LOG, REQUESTS } from "@/lib/secp-data";

export const Route = createFileRoute("/_authenticated/governance")({
  head: () => ({
    meta: [
      { title: "Validation & Governance — Soteria SECP" },
      { name: "description", content: "Multi-stage validation, auditable decision trails, and organizational policy compliance for every AI-generated deliverable." },
      { property: "og:title", content: "Validation & Governance — Soteria SECP" },
      { property: "og:description", content: "Every deliverable, validated across accuracy, compliance, brand, security, and reproducibility." },
    ],
  }),
  component: GovernancePage,
});

const CHECKS = [
  { code: "V01", name: "Accuracy", pass: 99.7 },
  { code: "V02", name: "Completeness", pass: 98.4 },
  { code: "V03", name: "Compliance", pass: 99.9 },
  { code: "V04", name: "Business logic", pass: 97.1 },
  { code: "V05", name: "Statistical correctness", pass: 99.2 },
  { code: "V06", name: "Technical correctness", pass: 98.8 },
  { code: "V07", name: "Policy compliance", pass: 100.0 },
  { code: "V08", name: "Brand consistency", pass: 99.5 },
  { code: "V09", name: "Security", pass: 99.9 },
  { code: "V10", name: "Explainability", pass: 97.6 },
  { code: "V11", name: "Reproducibility", pass: 99.4 },
  { code: "V12", name: "Performance", pass: 96.3 },
  { code: "V13", name: "Cost efficiency", pass: 94.1 },
];

function GovernancePage() {
  return (
    <AppShell title="Validation & Governance" crumb="L6 · Audit & compliance">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Checks / hour" value="1,842" tone="accent" />
          <StatChip label="Pass rate (24h)" value="99.7%" tone="signal" />
          <StatChip label="Escalations open" value="2" tone="warn" />
          <StatChip label="Audit entries" value={String(AUDIT_LOG.length + 214)} />
        </section>

        <section>
          <SectionHeading code="L6.1" title="Validation Battery" />
          <div className="grid grid-cols-3 gap-3">
            {CHECKS.map((c) => (
              <div key={c.code} className="bg-surface border border-border rounded-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-mono text-[10px] text-accent">{c.code}</div>
                    <div className="text-sm font-bold">{c.name}</div>
                  </div>
                  <span
                    className={
                      "font-mono text-xs " +
                      (c.pass >= 99 ? "text-[color:var(--signal)]" : c.pass >= 96 ? "text-accent" : "text-[color:var(--warn)]")
                    }
                  >
                    {c.pass.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                  <div
                    className={
                      "h-full " +
                      (c.pass >= 99 ? "bg-[color:var(--signal)]" : c.pass >= 96 ? "bg-accent" : "bg-[color:var(--warn)]")
                    }
                    style={{ width: `${c.pass}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading code="L6.2" title="Recent Decisions on Active Requests" />
          <div className="bg-surface border border-border rounded-sm">
            {REQUESTS.map((r) => (
              <div key={r.id} className="border-b border-border last:border-b-0 px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
                  <span className="text-xs font-bold">{r.title}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.validators.map((v) => (
                    <span
                      key={v.name}
                      className={
                        "text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border " +
                        (v.status === "passed"
                          ? "text-[color:var(--signal)] border-[color:var(--signal)]/30 bg-[color:var(--signal)]/5"
                          : v.status === "failed"
                            ? "text-[color:var(--danger)] border-[color:var(--danger)]/30 bg-[color:var(--danger)]/5"
                            : "text-muted-foreground border-border")
                      }
                    >
                      {v.name} · {v.status}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading code="L6.3" title="Audit Trail" />
          <div className="bg-surface border border-border rounded-sm p-5 font-mono text-[11px] text-muted-foreground leading-relaxed">
            {AUDIT_LOG.map((a, i) => (
              <div key={i} className="flex gap-4 border-b border-border last:border-b-0 py-2">
                <span className="text-accent shrink-0 w-20">{a.time}</span>
                <span className="text-muted-foreground shrink-0 w-32 uppercase">{a.layer}</span>
                <span className="shrink-0 w-40 text-foreground">{a.actor}</span>
                <span className="flex-1">{a.action}</span>
                {a.requestId && <span className="text-primary shrink-0">{a.requestId}</span>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}