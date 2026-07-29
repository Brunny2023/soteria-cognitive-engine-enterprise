import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, SectionHeading } from "@/components/AppShell";
import { AUTONOMY_LABELS, type Autonomy } from "@/lib/secp-data";
import { createRequest } from "@/lib/secp-store";

export const Route = createFileRoute("/requests/new")({
  head: () => ({
    meta: [
      { title: "New Directive — Soteria SECP" },
      { name: "description", content: "Submit a new directive into the Soteria organizational cognition pipeline: intent, autonomy, priority, and originating executive." },
      { property: "og:title", content: "New Directive — Soteria SECP" },
      { property: "og:description", content: "Compose a directive and dispatch it through the six-layer cognition stack." },
    ],
  }),
  component: NewRequest,
});

const ORIGINS = [
  "CEO directive",
  "COO directive",
  "CFO directive",
  "CTO directive",
  "CIO directive",
  "CDO directive",
  "CLO directive",
  "CRO directive",
  "CHRO directive",
  "CMO directive",
  "CSO directive",
  "Governance escalation",
  "Operator input",
];

function NewRequest() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [origin, setOrigin] = useState<string>(ORIGINS[0]);
  const [autonomy, setAutonomy] = useState<Autonomy>(3);
  const [priority, setPriority] = useState<"P0" | "P1" | "P2">("P1");

  const canSubmit = title.trim().length >= 4 && brief.trim().length >= 20;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const rec = createRequest({ title: title.trim(), brief: brief.trim(), origin, autonomy, priority });
    navigate({ to: "/requests/$id", params: { id: rec.id } });
  }

  return (
    <AppShell title="New Directive" crumb="RQ · Compose intent">
      <div className="p-6 flex flex-col gap-8 animate-entry max-w-4xl">
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <Link to="/requests" className="text-muted-foreground hover:text-foreground">
            ← REQUEST_QUEUE
          </Link>
          <span className="text-border">/</span>
          <span className="text-accent">NEW</span>
        </div>

        <section>
          <SectionHeading code="INTENT" title="Directive composition" />
          <form onSubmit={submit} className="bg-surface border border-border rounded-sm p-6 flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. EMEA pricing model refresh"
                className="bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary"
                required
                minLength={4}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Brief · what should the organization do?
              </span>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe the objective, constraints, success criteria, and any policy envelope the cognition stack should honor."
                rows={6}
                className="bg-background border border-border rounded-sm px-3 py-2 text-sm leading-relaxed focus:outline-none focus:border-primary"
                required
                minLength={20}
              />
              <span className="text-[10px] font-mono text-muted-foreground">
                {brief.trim().length} chars · minimum 20
              </span>
            </label>

            <div className="grid grid-cols-3 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Origin</span>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  {ORIGINS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Priority</span>
                <div className="flex gap-2">
                  {(["P0", "P1", "P2"] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={
                        "flex-1 font-mono text-xs py-2 border rounded-sm transition-colors " +
                        (priority === p
                          ? p === "P0"
                            ? "border-[color:var(--danger)] text-[color:var(--danger)] bg-[color:var(--danger)]/10"
                            : p === "P1"
                              ? "border-[color:var(--warn)] text-[color:var(--warn)] bg-[color:var(--warn)]/10"
                              : "border-primary text-primary bg-primary/10"
                          : "border-border text-muted-foreground hover:text-foreground")
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Autonomy</span>
                <select
                  value={autonomy}
                  onChange={(e) => setAutonomy(Number(e.target.value) as Autonomy)}
                  className="bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  {([1, 2, 3, 4] as Autonomy[]).map((a) => (
                    <option key={a} value={a}>
                      L{a} · {AUTONOMY_LABELS[a]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-5">
              <p className="text-[11px] text-muted-foreground max-w-xl leading-relaxed">
                On dispatch, the directive enters the pipeline at <span className="text-accent font-mono">L1 · ORGANIZATIONAL</span> and is routed through executive deliberation, consultant strategy, program planning, workforce execution, and governance validation.
              </p>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ▸ Dispatch directive
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}