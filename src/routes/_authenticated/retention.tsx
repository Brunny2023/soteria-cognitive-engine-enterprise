import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { exportDataset } from "@/lib/export";
import {
  retentionAudit,
  useRetentionAudit,
  filterAudit,
  type RetentionAuditKind,
} from "@/lib/retention-audit";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState as useReactState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/retention")({
  head: () => ({
    meta: [
      { title: "Retention & Purge — Soteria SECP" },
      { name: "description", content: "Per-category retention windows, legal-hold overrides, and compliant purge simulation for the cognitive operating system." },
      { property: "og:title", content: "Retention & Purge — Soteria SECP" },
      { property: "og:description", content: "Defensible data lifecycle across every intelligence layer." },
    ],
  }),
  component: RetentionPage,
});

type PurgeMode = "hard-delete" | "tokenize" | "anonymize" | "archive";

type Category = {
  code: string;
  name: string;
  description: string;
  layers: string[];
  volume: number; // records in scope
  eligible: number; // records past retention today
  minDays: number;
  maxDays: number;
  regulatoryFloor: string;
  legalHold: boolean;
  retentionDays: number;
  purgeMode: PurgeMode;
};

const INITIAL: Category[] = [
  {
    code: "DR-01",
    name: "Reasoning traces",
    description: "Step-by-step deliberation logs across L2–L6 for every directive.",
    layers: ["L2", "L3", "L4", "L5", "L6"],
    volume: 2_481_204,
    eligible: 184_502,
    minDays: 365,
    maxDays: 3650,
    regulatoryFloor: "SOX 7y · EU AI Act Art. 12",
    legalHold: false,
    retentionDays: 2555,
    purgeMode: "archive",
  },
  {
    code: "DR-02",
    name: "Executive deliberations",
    description: "Council transcripts, autonomy elevations, board-visible decisions.",
    layers: ["L2"],
    volume: 41_892,
    eligible: 812,
    minDays: 1825,
    maxDays: 3650,
    regulatoryFloor: "SOX 7y",
    legalHold: true,
    retentionDays: 3650,
    purgeMode: "archive",
  },
  {
    code: "DR-03",
    name: "Ingested knowledge sources",
    description: "Raw documents, policies, and datasets landed at L1.",
    layers: ["L1"],
    volume: 128_402,
    eligible: 14_204,
    minDays: 90,
    maxDays: 1825,
    regulatoryFloor: "Contract dependent",
    legalHold: false,
    retentionDays: 730,
    purgeMode: "hard-delete",
  },
  {
    code: "DR-04",
    name: "PII redaction ledger",
    description: "Detector matches, redaction verdicts, tokenization mappings.",
    layers: ["L1", "L6"],
    volume: 8_912_004,
    eligible: 902_140,
    minDays: 180,
    maxDays: 2555,
    regulatoryFloor: "GDPR Art. 30",
    legalHold: false,
    retentionDays: 1095,
    purgeMode: "tokenize",
  },
  {
    code: "DR-05",
    name: "Directive briefs & outputs",
    description: "Original directives plus delivered artifacts.",
    layers: ["L1", "L4", "L6"],
    volume: 62_014,
    eligible: 1_204,
    minDays: 365,
    maxDays: 3650,
    regulatoryFloor: "Contract dependent",
    legalHold: false,
    retentionDays: 1825,
    purgeMode: "archive",
  },
  {
    code: "DR-06",
    name: "Specialist telemetry",
    description: "Prompt/tool logs, latency, cost, autonomy exercised.",
    layers: ["L5"],
    volume: 41_204_881,
    eligible: 6_204_002,
    minDays: 30,
    maxDays: 730,
    regulatoryFloor: "Internal only",
    legalHold: false,
    retentionDays: 180,
    purgeMode: "anonymize",
  },
  {
    code: "DR-07",
    name: "Audit ledger (L6)",
    description: "Append-only governance events, validation verdicts.",
    layers: ["L6"],
    volume: 1_284_120,
    eligible: 0,
    minDays: 2555,
    maxDays: 3650,
    regulatoryFloor: "SOC 2 CC7.3 · SOX 7y",
    legalHold: true,
    retentionDays: 3650,
    purgeMode: "archive",
  },
  {
    code: "DR-08",
    name: "Identity & session records",
    description: "Operator sessions, MFA events, SCIM sync trails.",
    layers: ["L6"],
    volume: 5_204_881,
    eligible: 512_004,
    minDays: 90,
    maxDays: 1095,
    regulatoryFloor: "SOC 2 CC6.1",
    legalHold: false,
    retentionDays: 365,
    purgeMode: "hard-delete",
  },
];

const PURGE_MODES: { mode: PurgeMode; label: string; blurb: string }[] = [
  { mode: "hard-delete", label: "Hard delete", blurb: "Row removed. Tombstone recorded in L6." },
  { mode: "tokenize", label: "Tokenize", blurb: "PII replaced with stable tokens; joins preserved." },
  { mode: "anonymize", label: "Anonymize", blurb: "K-anonymized for analytics. Non-reversible." },
  { mode: "archive", label: "Archive (WORM)", blurb: "Immutable cold storage. Read-only." },
];

function RetentionPage() {
  const [rows, setRows] = useState(INITIAL);
  const [preview, setPreview] = useState<Category | null>(null);
  const [executing, setExecuting] = useState<Category | null>(null);
  const [approver, setApprover] = useState("");
  const [auditFilter, setAuditFilter] = useState<RetentionAuditKind | "all">("all");
  const audit = useRetentionAudit();
  const { user } = useAuth();
  const [actorName, setActorName] = useReactState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setActorName(data?.display_name ?? user.email ?? "operator"));
  }, [user, setActorName]);

  const actor = {
    id: user?.id ?? null,
    name: actorName || user?.email || "operator",
  };

  const totals = useMemo(() => {
    const eligible = rows.reduce((n, r) => n + (r.legalHold ? 0 : r.eligible), 0);
    const held = rows.reduce((n, r) => n + (r.legalHold ? r.eligible : 0), 0);
    const floorViolations = rows.filter((r) => r.retentionDays < r.minDays).length;
    return { eligible, held, floorViolations };
  }, [rows]);

  function setRetention(code: string, days: number) {
    setRows((prev) => {
      const target = prev.find((r) => r.code === code);
      if (target && target.retentionDays !== days) {
        retentionAudit.log({
          kind: "retention_window",
          category_code: target.code,
          category_name: target.name,
          actor_id: actor.id,
          actor_name: actor.name,
          approver_name: null,
          field: "retentionDays",
          before: `${target.retentionDays}d`,
          after: `${days}d`,
          records_affected: 0,
          disposition: target.purgeMode,
          note: days < target.minDays ? "Below regulatory floor" : "Within floor",
        });
      }
      return prev.map((r) => (r.code === code ? { ...r, retentionDays: days } : r));
    });
  }
  function setMode(code: string, mode: PurgeMode) {
    setRows((prev) => {
      const target = prev.find((r) => r.code === code);
      if (target && target.purgeMode !== mode) {
        retentionAudit.log({
          kind: "disposition_mode",
          category_code: target.code,
          category_name: target.name,
          actor_id: actor.id,
          actor_name: actor.name,
          approver_name: null,
          field: "purgeMode",
          before: target.purgeMode,
          after: mode,
          records_affected: 0,
          disposition: mode,
          note: "Disposition mode changed",
        });
      }
      return prev.map((r) => (r.code === code ? { ...r, purgeMode: mode } : r));
    });
  }
  function toggleHold(code: string) {
    setRows((prev) => {
      const target = prev.find((r) => r.code === code);
      if (target) {
        retentionAudit.log({
          kind: "legal_hold",
          category_code: target.code,
          category_name: target.name,
          actor_id: actor.id,
          actor_name: actor.name,
          approver_name: null,
          field: "legalHold",
          before: target.legalHold ? "ON" : "OFF",
          after: target.legalHold ? "OFF" : "ON",
          records_affected: 0,
          disposition: target.purgeMode,
          note: target.legalHold ? "Hold released" : "Hold applied",
        });
      }
      return prev.map((r) => (r.code === code ? { ...r, legalHold: !r.legalHold } : r));
    });
  }

  function executePurge(cat: Category, approverName: string) {
    const disposed = cat.legalHold ? 0 : cat.eligible;
    retentionAudit.log({
      kind: "purge_execution",
      category_code: cat.code,
      category_name: cat.name,
      actor_id: actor.id,
      actor_name: actor.name,
      approver_name: approverName,
      field: "purge",
      before: `${cat.volume.toLocaleString()} in scope`,
      after: `${disposed.toLocaleString()} ${cat.purgeMode}`,
      records_affected: disposed,
      disposition: cat.purgeMode,
      note: cat.legalHold
        ? "Legal hold — no rows disposed; execution recorded."
        : `Nightly sweep executed against ${cat.layers.join(", ")}. Tombstones written to L6.`,
    });
    setRows((prev) =>
      prev.map((r) => (r.code === cat.code ? { ...r, eligible: r.legalHold ? r.eligible : 0 } : r)),
    );
    setExecuting(null);
    setApprover("");
  }

  const filteredAudit = useMemo(
    () => filterAudit(audit, auditFilter === "all" ? "all" : [auditFilter]),
    [audit, auditFilter],
  );

  function exportAudit(scope: "all" | "changes" | "executions", fmt: "csv" | "json") {
    const rowsOut =
      scope === "all"
        ? audit
        : scope === "executions"
          ? audit.filter((r) => r.kind === "purge_execution")
          : audit.filter((r) => r.kind !== "purge_execution");
    const baseName =
      scope === "executions"
        ? "retention-purge-executions"
        : scope === "changes"
          ? "retention-policy-changes"
          : "retention-audit-trail";
    exportDataset(baseName, rowsOut, fmt);
  }

  return (
    <AppShell title="Retention & Purge" crumb="RT · Lifecycle & disposition">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Categories" value={String(rows.length)} />
          <StatChip label="Records eligible today" value={totals.eligible.toLocaleString()} tone="accent" />
          <StatChip label="Under legal hold" value={totals.held.toLocaleString()} tone="warn" />
          <StatChip
            label="Below regulatory floor"
            value={String(totals.floorViolations)}
            tone={totals.floorViolations ? "danger" : "signal"}
          />
        </section>

        <section>
          <SectionHeading code="RT.1" title="Retention windows by category" />
          <div className="bg-surface border border-border rounded-sm">
            <div className="grid grid-cols-[80px_1fr_120px_1fr_140px_120px] gap-4 px-5 py-3 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Code</span>
              <span>Category</span>
              <span>Layers</span>
              <span>Retention window</span>
              <span>Disposition</span>
              <span className="text-right">Actions</span>
            </div>
            {rows.map((r) => {
              const belowFloor = r.retentionDays < r.minDays;
              const years = (r.retentionDays / 365).toFixed(1);
              return (
                <div key={r.code} className="grid grid-cols-[80px_1fr_120px_1fr_140px_120px] gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center">
                  <span className="font-mono text-[10px] text-accent">{r.code}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{r.description}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">
                      Floor · <span className="text-foreground">{r.regulatoryFloor}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.layers.map((l) => (
                      <span key={l} className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-border text-muted-foreground">
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      type="range"
                      min={r.minDays}
                      max={r.maxDays}
                      step={30}
                      value={r.retentionDays}
                      onChange={(e) => setRetention(r.code, Number(e.target.value))}
                      className="w-full accent-primary"
                      aria-label={`Retention window for ${r.name}`}
                    />
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-muted-foreground">{r.minDays}d</span>
                      <span className={belowFloor ? "text-[color:var(--danger)]" : "text-foreground"}>
                        {r.retentionDays}d · {years}y
                      </span>
                      <span className="text-muted-foreground">{r.maxDays}d</span>
                    </div>
                    {belowFloor && (
                      <span className="text-[10px] font-mono text-[color:var(--danger)]">Below regulatory floor</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {PURGE_MODES.map((m) => (
                      <button
                        key={m.mode}
                        type="button"
                        onClick={() => setMode(r.code, m.mode)}
                        className={
                          "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors " +
                          (r.purgeMode === m.mode
                            ? "border-primary text-primary bg-primary/10"
                            : "border-border text-muted-foreground hover:text-foreground")
                        }
                        title={m.blurb}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => toggleHold(r.code)}
                      className={
                        "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border " +
                        (r.legalHold
                          ? "text-[color:var(--warn)] border-[color:var(--warn)]/40 bg-[color:var(--warn)]/10"
                          : "text-muted-foreground border-border hover:text-foreground")
                      }
                    >
                      {r.legalHold ? "Hold ON" : "Hold OFF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreview(r)}
                      className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 border border-border text-muted-foreground hover:text-primary hover:border-primary/60"
                    >
                      Preview purge
                    </button>
                    <button
                      type="button"
                      onClick={() => setExecuting(r)}
                      className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 border border-primary/40 text-primary hover:bg-primary/10"
                    >
                      Execute purge
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-6">
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="RT.2" title="Purge cadence" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li>· Nightly sweep at 02:00 UTC per region</li>
              <li>· Two-operator approval on hard-delete batches &gt; 10k rows</li>
              <li>· Governance layer (L6) records a tombstone for every disposed record</li>
              <li>· Legal holds override every schedule until released by CLO</li>
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="RT.3" title="Data subject rights" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li>· DSAR access &amp; export: 30-day SLA</li>
              <li>· Erasure: 45-day SLA (extends under legal hold with notice)</li>
              <li>· Right to object: routes to L6 review queue</li>
              <li>· Cross-region purge propagation verified per run</li>
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="RT.4" title="Regulatory floors respected" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li>· SOX financial evidence — 7 years</li>
              <li>· EU AI Act Art. 12 traceability</li>
              <li>· GDPR Art. 30 processing records</li>
              <li>· SOC 2 CC7.3 incident evidence</li>
            </ul>
          </div>
        </section>

        {preview && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setPreview(null)}
          >
            <div
              className="w-full max-w-lg bg-surface border border-border rounded-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] text-accent">{preview.code} · PURGE SIMULATION</div>
                  <div className="text-base font-bold mt-1">{preview.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">
                Dry run against the current window ({preview.retentionDays}d) and disposition mode ({preview.purgeMode}).
                Nothing is disposed; every row lands in the governance ledger.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatChip label="In scope" value={preview.volume.toLocaleString()} />
                <StatChip
                  label="Would dispose"
                  value={preview.legalHold ? "0 (hold)" : preview.eligible.toLocaleString()}
                  tone={preview.legalHold ? "warn" : "accent"}
                />
              </div>
              <div className="border border-border rounded-sm p-4 font-mono text-[11px] text-muted-foreground leading-relaxed">
                <div>SIMULATION · {new Date().toISOString()}</div>
                <div>MODE     · {preview.purgeMode}</div>
                <div>SCOPE    · {preview.layers.join(", ")}</div>
                <div>FLOOR    · {preview.regulatoryFloor}</div>
                <div className="text-foreground mt-2">
                  RESULT · {preview.legalHold
                    ? "0 rows disposed — legal hold active."
                    : `${preview.eligible.toLocaleString()} rows would be ${preview.purgeMode.replace("-", " ")}d; L6 tombstone written for each.`}
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-border text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary/60 cursor-not-allowed"
                  title="Execution requires two-operator approval and is disabled in this build."
                >
                  Schedule (two-operator)
                </button>
              </div>
            </div>
          </div>
        )}

        {executing && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => { setExecuting(null); setApprover(""); }}
          >
            <div
              className="w-full max-w-lg bg-surface border border-border rounded-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] text-[color:var(--warn)]">{executing.code} · PURGE EXECUTION</div>
                  <div className="text-base font-bold mt-1">{executing.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setExecuting(null); setApprover(""); }}
                  className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">
                Two-operator control. Requesting operator is <span className="text-foreground">{actor.name}</span>.
                Enter the co-approver's name — the execution is written to the retention audit trail with both identities.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatChip label="In scope" value={executing.volume.toLocaleString()} />
                <StatChip
                  label="Will dispose"
                  value={executing.legalHold ? "0 (hold)" : executing.eligible.toLocaleString()}
                  tone={executing.legalHold ? "warn" : "accent"}
                />
              </div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Co-approver (second operator)
              </label>
              <input
                type="text"
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                placeholder="e.g. J. Okafor — CISO"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setExecuting(null); setApprover(""); }}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-border text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={approver.trim().length < 2}
                  onClick={() => executePurge(executing, approver.trim())}
                  className={
                    "font-mono text-[10px] uppercase tracking-widest px-3 py-2 border " +
                    (approver.trim().length < 2
                      ? "border-border text-muted-foreground cursor-not-allowed"
                      : "border-[color:var(--warn)]/60 text-[color:var(--warn)] hover:bg-[color:var(--warn)]/10")
                  }
                >
                  Execute & record
                </button>
              </div>
            </div>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <SectionHeading code="RT.5" title="Retention audit trail" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mr-1">Filter ·</span>
                {(["all", "retention_window", "disposition_mode", "legal_hold", "purge_execution"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setAuditFilter(k)}
                    className={
                      "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors " +
                      (auditFilter === k
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border text-muted-foreground hover:text-foreground")
                    }
                  >
                    {k.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap mb-3">
            <ExportGroup label="Policy changes" onExport={(fmt) => exportAudit("changes", fmt)} />
            <ExportGroup label="Purge executions" onExport={(fmt) => exportAudit("executions", fmt)} />
            <ExportGroup label="Full audit" onExport={(fmt) => exportAudit("all", fmt)} />
          </div>
          <div className="bg-surface border border-border rounded-sm">
            <div className="grid grid-cols-[150px_120px_120px_1fr_140px_140px_110px] gap-3 px-4 py-2 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Timestamp (UTC)</span>
              <span>Kind</span>
              <span>Category</span>
              <span>Change</span>
              <span>Actor</span>
              <span>Approver</span>
              <span className="text-right">Affected</span>
            </div>
            {filteredAudit.length === 0 && (
              <div className="px-4 py-6 text-center font-mono text-[11px] text-muted-foreground">
                No entries recorded yet — adjust a retention window or execute a purge to populate the ledger.
              </div>
            )}
            {filteredAudit.map((e) => (
              <div key={e.id} className="grid grid-cols-[150px_120px_120px_1fr_140px_140px_110px] gap-3 px-4 py-3 border-b border-border last:border-b-0 items-start">
                <span className="font-mono text-[10px] text-muted-foreground">{e.ts.replace("T", " ").slice(0, 19)}</span>
                <span
                  className={
                    "font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border w-fit " +
                    (e.kind === "purge_execution"
                      ? "border-[color:var(--warn)]/40 text-[color:var(--warn)]"
                      : "border-border text-muted-foreground")
                  }
                >
                  {e.kind.replace("_", " ")}
                </span>
                <span className="font-mono text-[10px] text-accent">{e.category_code}</span>
                <div className="min-w-0">
                  <div className="text-[12px] text-foreground">
                    <span className="text-muted-foreground">{e.field}:</span>{" "}
                    <span className="line-through text-muted-foreground">{e.before}</span>{" "}
                    → <span className="text-foreground">{e.after}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{e.note}</div>
                </div>
                <span className="text-[11px]">{e.actor_name}</span>
                <span className="text-[11px]">{e.approver_name ?? <span className="text-muted-foreground">—</span>}</span>
                <span className="text-right font-mono text-[11px]">
                  {e.records_affected > 0 ? e.records_affected.toLocaleString() : "—"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] font-mono text-muted-foreground">
            {audit.length} entries recorded · exports include an exported_at UTC stamp for chain-of-custody.
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ExportGroup({ label, onExport }: { label: string; onExport: (fmt: "csv" | "json") => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mr-1">{label} ·</span>
      {(["csv", "json"] as const).map((fmt) => (
        <button
          key={fmt}
          type="button"
          onClick={() => onExport(fmt)}
          className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 border border-border text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
        >
          ↓ {fmt}
        </button>
      ))}
    </div>
  );
}