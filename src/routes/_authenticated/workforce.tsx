import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { AUTONOMY_LABELS, DEPARTMENTS, SPECIALISTS, type Department } from "@/lib/secp-data";

export const Route = createFileRoute("/_authenticated/workforce")({
  head: () => ({
    meta: [
      { title: "Specialist Workforce — Soteria SECP" },
      { name: "description", content: "Expandable catalog of AI specialists across data, engineering, finance, marketing, HR, legal, and operations." },
      { property: "og:title", content: "Specialist Workforce — Soteria SECP" },
      { property: "og:description", content: "Modular AI workforce with configurable autonomy levels." },
    ],
  }),
  component: WorkforcePage,
});

function WorkforcePage() {
  const [dept, setDept] = useState<Department | "ALL">("ALL");
  const filtered = dept === "ALL" ? SPECIALISTS : SPECIALISTS.filter((s) => s.department === dept);
  const activeCount = SPECIALISTS.filter((s) => s.status === "active").length;

  return (
    <AppShell title="Specialist Workforce" crumb="L5 · Execution mesh">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Roles catalogued" value={String(SPECIALISTS.length)} />
          <StatChip label="Active now" value={String(activeCount)} tone="signal" />
          <StatChip label="Departments" value={String(DEPARTMENTS.length)} tone="accent" />
          <StatChip label="Autonomy L3+ share" value={`${Math.round((SPECIALISTS.filter(s => s.autonomy >= 3).length / SPECIALISTS.length) * 100)}%`} />
        </section>

        <section>
          <SectionHeading code="L5.1" title="Filter Workforce" />
          <div className="flex flex-wrap gap-2">
            {(["ALL", ...DEPARTMENTS] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDept(d as Department | "ALL")}
                className={
                  "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border rounded-sm transition-colors " +
                  (dept === d
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40")
                }
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading code="L5.2" title={dept === "ALL" ? "All Specialists" : dept} action={<span className="font-mono text-[10px] text-muted-foreground">{filtered.length} matches</span>} />
          <div className="bg-surface border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 border-b border-border">
                <tr className="text-[10px] font-mono uppercase text-muted-foreground">
                  <th className="text-left px-4 py-2">ID</th>
                  <th className="text-left px-4 py-2">Role</th>
                  <th className="text-left px-4 py-2">Department</th>
                  <th className="text-left px-4 py-2">Level</th>
                  <th className="text-left px-4 py-2">Autonomy</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{s.id}</td>
                    <td className="px-4 py-3 font-medium">{s.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.department}</td>
                    <td className="px-4 py-3 font-mono">L{s.level}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-primary">A{s.autonomy}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{AUTONOMY_LABELS[s.autonomy]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 " +
                          (s.status === "active"
                            ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                            : s.status === "reserved"
                              ? "text-accent bg-accent/10"
                              : "text-muted-foreground bg-secondary")
                        }
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}