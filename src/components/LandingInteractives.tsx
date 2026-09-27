import { useState } from "react";

const DIRECTIVES = [
  [
    "Strategy",
    "Run a premortem on our Q4 expansion into EMEA based on our regional regulatory filings.",
  ],
  [
    "Operations",
    "Review the latest supply chain logs. Where is our current bottleneck according to our Theory of Constraints doctrine?",
  ],
  [
    "Finance",
    "Analyze this draft M&A proposal against our free-cash-flow targets and flag asymmetric downsides.",
  ],
];

export function SampleDirectives() {
  const [tab, setTab] = useState(0);
  return (
    <div className="border border-border bg-background/95 backdrop-blur rounded-sm shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-accent">
          Sample directives · Day 1
        </span>
        <span className="font-mono text-[9px] text-muted-foreground">MISSION CONTROL</span>
      </div>
      <div
        role="tablist"
        aria-label="Sample directives"
        className="grid grid-cols-3 border-b border-border"
      >
        {DIRECTIVES.map(([label], i) => (
          <button
            key={label}
            role="tab"
            type="button"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={
              "px-2 py-2 font-mono text-[10px] uppercase tracking-wider border-r border-border last:border-r-0 " +
              (tab === i
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="p-4">
        <p className="font-mono text-[9px] uppercase text-muted-foreground mb-2">&gt; directive</p>
        <p className="font-mono text-sm leading-relaxed text-foreground min-h-[5.5rem]">
          “{DIRECTIVES[tab][1]}”
          <span className="ml-1 inline-block h-4 w-1.5 translate-y-0.5 bg-primary animate-pulse" />
        </p>
      </div>
    </div>
  );
}

const STACK = [
  [
    "L6",
    "Governance & Learning",
    "Validated, audited, self-improving",
    "Every action is validated, audited, and fed back into the platform.",
  ],
  [
    "L5",
    "Specialist Workforce",
    "Scoped execution",
    "Specialist agents execute scoped tasks under your autonomy policy.",
  ],
  [
    "L4",
    "Program Orchestration",
    "Automated Tasks",
    "Workstreams and tasks are planned, assigned, and monitored with checkpoints.",
  ],
  [
    "L3",
    "AI Consultants",
    "Evidence-backed analysis",
    "Domain specialists deliver market analysis, diligence, and operating reviews.",
  ],
  [
    "L2",
    "Synthetic Executives",
    "Framework-led decisions",
    "Chief-level officers apply synthesized executive doctrine and explain every decision.",
  ],
  [
    "L1",
    "Organizational Knowledge",
    "Your Data",
    "Entities, policies, decisions, and assets indexed into one governed knowledge graph.",
  ],
];

export function LayerStack() {
  const [open, setOpen] = useState(5);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-mono text-[9px] uppercase text-muted-foreground text-center">
        ▲ Autonomous, governed execution
      </p>
      {STACK.map(([code, name, outcome, desc], i) => {
        const isOpen = open === i;
        return (
          <button
            key={code}
            type="button"
            aria-expanded={isOpen}
            onClick={() => setOpen(i)}
            style={{ marginInline: `${(5 - i) * 0}%`, width: `${70 + i * 6}%` }}
            className={
              "mx-auto block text-left border rounded-sm px-4 py-3 transition-colors " +
              (isOpen
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:border-primary/50")
            }
          >
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-mono text-[11px] text-accent">{code}</span>
              <span className="font-bold">
                {name} <span className="text-primary">({outcome})</span>
              </span>
            </div>
            {isOpen && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>}
          </button>
        );
      })}
      <p className="font-mono text-[9px] uppercase text-muted-foreground text-center">
        ▼ Foundation: your company data
      </p>
    </div>
  );
}

const AUTONOMY = [
  [
    "L1",
    "Recommendation Only",
    "AI drafts the strategic brief. Human reviews and executes manually.",
  ],
  [
    "L2",
    "Drafting & Staging",
    "AI drafts the workstream and stages tasks in your project manager. Human clicks 'Approve' to launch.",
  ],
  [
    "L3",
    "Conditional Autonomy",
    "AI executes scoped tasks autonomously within predefined SQL allowlists. Human is alerted only on anomalies.",
  ],
  [
    "L4",
    "Full Operational Command",
    "AI orchestrates end-to-end multi-agent workflows under continuous background validation.",
  ],
];

export function AutonomySlider() {
  const [lvl, setLvl] = useState(0);
  const [code, name, text] = AUTONOMY[lvl];
  return (
    <div className="mt-12 border border-border bg-background p-6 rounded-sm">
      <p className="font-mono text-[10px] tracking-widest text-accent mb-4">
        TRY IT · AUTONOMY LEVEL
      </p>
      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={lvl}
        onChange={(e) => setLvl(Number(e.target.value))}
        aria-label="Autonomy level"
        aria-valuetext={`${code} ${name}`}
        className="w-full accent-[color:var(--primary)]"
      />
      <div className="mt-2 grid grid-cols-4">
        {AUTONOMY.map(([c, n], i) => (
          <button
            key={c}
            type="button"
            onClick={() => setLvl(i)}
            className={
              "font-mono text-[10px] uppercase text-left " +
              (i === lvl ? "text-primary" : "text-muted-foreground hover:text-foreground")
            }
          >
            {c}
            <span className="hidden sm:inline"> · {n}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 border-l-2 border-primary pl-4" aria-live="polite">
        <p className="font-bold text-lg">
          {code} — {name}
        </p>
        <p className="mt-1 text-muted-foreground">{text}</p>
        <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(lvl + 1) * 25}%` }}
          />
        </div>
        <p className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">
          Human oversight:{" "}
          {["Every action", "Launch approval", "Anomalies only", "Continuous validation"][lvl]}
        </p>
      </div>
    </div>
  );
}
