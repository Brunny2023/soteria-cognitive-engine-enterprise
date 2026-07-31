import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import {
  AUTONOMY_LABELS,
  LAYERS,
  type Autonomy,
  type RequestRecord,
} from "@/lib/secp-data";
import { APPROVAL_STAGES, useAdvanceRequest, useApprovalLedger, useAutoRunRequest, useRequest } from "@/lib/secp-store";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState } from "react";
import { REQUESTS } from "@/lib/secp-data";
import { downloadComplianceReport } from "@/lib/compliance-report";
import { LAYER_MODEL_CATALOG } from "@/lib/gateway.functions";
import { ScopePreview } from "@/components/ScopePreview";
import { scopeForAgent, WAREHOUSE } from "@/lib/secp-scopes";

export const Route = createFileRoute("/_authenticated/requests/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Soteria SECP` },
      { name: "description", content: `Reasoning trace and validation battery for directive ${params.id}.` },
      { property: "og:title", content: `${params.id} — Soteria SECP` },
      { property: "og:description", content: `Reasoning trace and validation battery for directive ${params.id}.` },
    ],
  }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const request = useRequest(id);
  const { advance, isPending } = useAdvanceRequest();
  const auto = useAutoRunRequest();
  const { user } = useAuth();
  const requester = user?.email ?? "operator";
  const approvals = useApprovalLedger(id);
  const [approver, setApprover] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [query, setQuery] = useState("");
  const [layerFilter, setLayerFilter] = useState<"all" | RequestRecord["steps"][number]["layer"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "complete" | "active" | "pending">("all");
  const [kindFilter, setKindFilter] = useState<"all" | "decisions" | "validators" | "outputs">("all");
  const [error, setError] = useState<string | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportHash, setReportHash] = useState<string | null>(null);
  const [explainOpen, setExplainOpen] = useState<string | null>(null);
  const isSeed = REQUESTS.some((r) => r.id.toLowerCase() === id.toLowerCase());
  const nextPending = request?.steps.find((s) => s.status === "pending" || s.status === "active");
  const filteredSteps = useMemo(() => {
    if (!request) return [];
    return request.steps.filter((s) => {
      if (layerFilter !== "all" && s.layer !== layerFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (kindFilter === "decisions" && !APPROVAL_STAGES.includes(s.stage)) return false;
      if (kindFilter === "outputs" && !s.artifact) return false;
      if (kindFilter === "validators") return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !s.stage.includes(q) &&
          !s.title.toLowerCase().includes(q) &&
          !s.agent.toLowerCase().includes(q) &&
          !s.reasoning.toLowerCase().includes(q) &&
          !(s.artifact ?? "").toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [request, query, layerFilter, statusFilter, kindFilter]);
  const filteredValidators = useMemo(() => {
    if (!request) return [];
    if (kindFilter === "decisions" || kindFilter === "outputs") return [];
    const q = query.trim().toLowerCase();
    return request.validators.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter && !(statusFilter === "complete" && v.status === "passed")) return false;
      if (!q) return true;
      return v.name.toLowerCase().includes(q) || v.detail.toLowerCase().includes(q);
    });
  }, [request, query, statusFilter, kindFilter]);
  if (!request) {
    return (
      <AppShell title="Request not found" crumb={`${id} · missing`}>
        <div className="p-6 animate-entry">
          <div className="bg-surface border border-border rounded-sm p-6 max-w-lg">
            <div className="font-mono text-[10px] text-[color:var(--warn)] mb-2">404 · NO_RECORD</div>
            <p className="text-sm text-muted-foreground">
              No directive matches <span className="font-mono text-foreground">{id}</span>.
            </p>
            <Link
              to="/requests"
              className="inline-block mt-4 font-mono text-[11px] text-accent hover:text-foreground"
            >
              ← RETURN_TO_QUEUE
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }
  const inspector = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border">
        <div className="font-mono text-[10px] text-accent">{request.id} · INSPECTOR</div>
        <div className="text-sm font-bold mt-1">Validation Battery</div>
      </div>
      {!isSeed && nextPending && (
        <div className="px-5 py-4 border-b border-border flex flex-col gap-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cognition dispatch</div>
          <button
            type="button"
            disabled={isPending || auto.running}
            onClick={async () => {
              setError(null);
              if (APPROVAL_STAGES.includes(nextPending.stage)) {
                // Route through the approval gate.
                await auto.start(request.id, { requester, approvedStages: new Set() });
                return;
              }
              try { await advance(request.id); }
              catch (e) { setError(e instanceof Error ? e.message : "Advance failed"); }
            }}
            className="text-[10px] font-mono uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm disabled:opacity-40"
          >
            {isPending
              ? "▸ Reasoning…"
              : APPROVAL_STAGES.includes(nextPending.stage)
                ? `▸ Request approval · ${nextPending.stage.toUpperCase()}`
                : `▸ Advance · ${nextPending.stage.toUpperCase()}`}
          </button>
          <button
            type="button"
            disabled={isPending || auto.running}
            onClick={() => auto.start(request.id, { requester })}
            className="text-[10px] font-mono uppercase tracking-widest px-3 py-2 border border-accent/40 text-accent bg-accent/10 hover:bg-accent/20 rounded-sm disabled:opacity-40"
          >
            {auto.running ? "▸▸ Live cognition running…" : "▸▸ Auto-run every stage"}
          </button>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Auto-run pauses at every <span className="text-primary">decision gate</span> (executive · validate · deliver)
            and requires a co-approver before it will execute or validate outcomes.
          </p>
          {(error || auto.error) && (
            <div className="text-[10px] font-mono text-[color:var(--danger)]">{error ?? auto.error}</div>
          )}
        </div>
      )}
      {request && (
        <div className="px-5 py-4 border-b border-border flex flex-col gap-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Compliance report</div>
          <button
            type="button"
            disabled={reportBusy}
            onClick={async () => {
              setReportBusy(true);
              try {
                const res = await downloadComplianceReport({ request, approvals, operator: requester });
                setReportHash(res.sha256);
              } finally { setReportBusy(false); }
            }}
            className="text-[10px] font-mono uppercase tracking-widest px-3 py-2 border border-accent/40 text-accent bg-accent/10 hover:bg-accent/20 rounded-sm disabled:opacity-40"
          >
            {reportBusy ? "▤ Signing…" : "▤ Download signed PDF + JSON"}
          </button>
          {reportHash && (
            <div className="text-[10px] font-mono text-muted-foreground break-all">
              SHA-256 · <span className="text-foreground">{reportHash}</span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Bundles stage outputs, validator results, and the co-approval ledger. The <span className="text-accent">.sha256</span> sidecar lets reviewers confirm the PDF/JSON were not altered after export.
          </p>
        </div>
      )}
      {request && (
        <div className="px-5 py-4 border-b border-border flex flex-col gap-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Data-scope preview</div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Exactly what each assigned executive may query when this directive executes — tables, readable columns,
            row caps and masked fields. Statements are <span className="text-accent">SELECT-only</span> and every value is bound as a parameter.
          </p>
          <ScopePreview agents={request.steps.map((s) => s.agent)} />
        </div>
      )}
      <div className="p-5 flex flex-col gap-3 overflow-y-auto">
        {request.validators.map((v: RequestRecord["validators"][number]) => (
          <div key={v.name} className="border border-border p-3 rounded-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{v.name}</span>
              <span
                className={
                  "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 " +
                  (v.status === "passed"
                    ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                    : v.status === "failed"
                      ? "text-[color:var(--danger)] bg-[color:var(--danger)]/10"
                      : "text-muted-foreground bg-secondary")
                }
              >
                {v.status}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{v.detail}</p>
          </div>
        ))}
        {approvals.length > 0 && (
          <div className="mt-2 border-t border-border pt-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Approval ledger</div>
            {approvals.map((a) => (
              <div key={a.ts} className="border border-border p-2 rounded-sm mb-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-accent uppercase">{a.stage}</span>
                  <span className="text-muted-foreground">{a.ts.slice(11, 19)} UTC</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  <span className="text-foreground">{a.approver}</span> approved for <span className="text-foreground">{a.requester}</span>
                </div>
                {a.note && <div className="text-[10px] text-muted-foreground mt-1">"{a.note}"</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppShell title={request.title} crumb={`${request.id} · ${request.origin}`} inspector={inspector}>
      <div className="p-6 flex flex-col gap-8 animate-entry">
        {auto.awaitingApproval && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={auto.cancelApproval}>
            <div className="w-full max-w-lg bg-surface border border-border rounded-sm p-6" onClick={(e) => e.stopPropagation()}>
              <div className="font-mono text-[10px] text-[color:var(--warn)] uppercase tracking-widest">APPROVAL GATE · {auto.awaitingApproval.stage}</div>
              <div className="text-base font-bold mt-1 mb-2">Co-approver required</div>
              <p className="text-[11px] text-muted-foreground mb-4">
                Auto-run has paused before dispatching the <span className="font-mono text-accent">{auto.awaitingApproval.stage.toUpperCase()}</span> stage.
                A second operator must sign off before cognition proceeds. Requester: <span className="text-foreground">{requester}</span>.
              </p>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Co-approver name & title</label>
              <input value={approver} onChange={(e) => setApprover(e.target.value)} placeholder="e.g. J. Okafor — CISO"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary mb-3" />
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Approval note (audit trail)</label>
              <textarea value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} placeholder="Basis for approval, conditions, expiry…"
                rows={3} className="w-full bg-background border border-border rounded-sm px-3 py-2 text-[12px] font-mono focus:outline-none focus:border-primary mb-3" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={auto.cancelApproval}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-border text-muted-foreground hover:text-foreground">Reject</button>
                <button type="button" disabled={approver.trim().length < 2}
                  onClick={async () => { await auto.approveAndContinue(approver.trim(), approvalNote.trim(), requester); setApprover(""); setApprovalNote(""); }}
                  className={"font-mono text-[10px] uppercase tracking-widest px-3 py-2 border " +
                    (approver.trim().length < 2 ? "border-border text-muted-foreground cursor-not-allowed"
                      : "border-primary/60 text-primary hover:bg-primary/10")}>
                  Approve & continue
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <Link to="/requests" className="text-muted-foreground hover:text-foreground">
            ← REQUEST_QUEUE
          </Link>
          <span className="text-border">/</span>
          <span className="text-accent">{request.id}</span>
        </div>

        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Priority" value={request.priority} tone={request.priority === "P0" ? "danger" : "warn"} />
          <StatChip label="Autonomy" value={`L${request.autonomy}`} tone="accent" />
          <StatChip label="Progress" value={`${Math.round(request.progress * 100)}%`} tone="signal" />
          <StatChip label="Last update" value={request.updated} />
        </section>

        <section className="bg-surface border border-border rounded-sm p-5">
          <SectionHeading code="BRIEF" title="Directive summary" />
          <p className="text-sm text-foreground leading-relaxed">{request.brief}</p>
          <div className="mt-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            Autonomy · {AUTONOMY_LABELS[request.autonomy as Autonomy]}
          </div>
        </section>

        <section>
          <SectionHeading code="TRACE" title="Reasoning timeline · decisions · validators · outputs" />
          <div className="bg-surface border border-border rounded-sm p-3 mb-4 flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reasoning, agents, artifacts…"
              className="flex-1 min-w-[220px] bg-background border border-border rounded-sm px-3 py-2 text-[12px] font-mono focus:outline-none focus:border-primary"
            />
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mr-1">Layer</span>
              {(["all", ...LAYERS.map((l) => l.id)] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLayerFilter(l as typeof layerFilter)}
                  className={"font-mono text-[9px] uppercase tracking-widest px-2 py-1 border " +
                    (layerFilter === l ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground")}>
                  {l === "all" ? "all" : LAYERS.find((x) => x.id === l)?.code}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mr-1">Status</span>
              {(["all", "complete", "active", "pending"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatusFilter(s)}
                  className={"font-mono text-[9px] uppercase tracking-widest px-2 py-1 border " +
                    (statusFilter === s ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground")}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mr-1">Kind</span>
              {(["all", "decisions", "validators", "outputs"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setKindFilter(k)}
                  className={"font-mono text-[9px] uppercase tracking-widest px-2 py-1 border " +
                    (kindFilter === k ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground")}>
                  {k}
                </button>
              ))}
            </div>
            <div className="font-mono text-[9px] text-muted-foreground w-full mt-1">
              {filteredSteps.length}/{request.steps.length} steps · {filteredValidators.length}/{request.validators.length} validators
            </div>
          </div>
          <div className="relative pl-6 border-l border-border">
            {filteredSteps.length === 0 && kindFilter !== "validators" && (
              <div className="text-[11px] font-mono text-muted-foreground py-4">No steps match the current filters.</div>
            )}
            {filteredSteps.map((s: RequestRecord["steps"][number], i: number) => {
              const layer = LAYERS.find((l) => l.id === s.layer);
              const isDecision = APPROVAL_STAGES.includes(s.stage);
              return (
                <div key={i} className="relative pb-6 last:pb-0">
                  <span
                    className={
                      "absolute -left-[29px] top-1 size-3 rounded-full border-2 " +
                      (s.status === "complete"
                        ? "bg-[color:var(--signal)] border-[color:var(--signal)]"
                        : s.status === "active"
                          ? "bg-primary border-primary animate-pulse"
                          : "bg-background border-border")
                    }
                  />
                  <div className="bg-surface border border-border rounded-sm p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[10px] text-accent">{layer?.code}</span>
                      <span className="text-xs font-bold uppercase tracking-widest">{s.stage}</span>
                      {isDecision && (
                        <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-[color:var(--warn)]/40 text-[color:var(--warn)] bg-[color:var(--warn)]/10">
                          decision gate
                        </span>
                      )}
                      <span
                        className={
                          "ml-auto font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 " +
                          (s.status === "complete"
                            ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                            : s.status === "active"
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground bg-secondary")
                        }
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold">{s.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-1">AGENT · {s.agent}</div>
                    <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">{s.reasoning}</p>
                    {s.artifact && (
                      <div className="mt-3 inline-flex items-center gap-2 border border-border px-2 py-1 text-[10px] font-mono text-accent">
                        ▤ {s.artifact}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(kindFilter === "all" || kindFilter === "validators") && filteredValidators.length > 0 && (
              <div className="mt-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 pl-1">Validators</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredValidators.map((v) => (
                    <div key={v.name} className="bg-surface border border-border p-3 rounded-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{v.name}</span>
                        <span className={"font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 " +
                          (v.status === "passed" ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                            : v.status === "failed" ? "text-[color:var(--danger)] bg-[color:var(--danger)]/10"
                            : "text-muted-foreground bg-secondary")}>{v.status}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-2">{v.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <SectionHeading code="EXPLAIN" title="Explainability · inputs · tool calls · evidence" />
          <div className="bg-surface border border-border rounded-sm">
            {request.steps.filter((s) => s.status !== "pending").map((s) => {
              const layer = LAYERS.find((l) => l.id === s.layer);
              const model = LAYER_MODEL_CATALOG[s.layer];
              const isOpen = explainOpen === s.stage;
              const upstream = request.steps
                .slice(0, request.steps.indexOf(s))
                .filter((x) => x.status === "complete" && (x.artifact || x.reasoning));
              const contextInputs = upstream.slice(-3).map((x) => `${x.stage}:${x.artifact ?? x.title}`);
              const isDecision = APPROVAL_STAGES.includes(s.stage);
              const evidence = isDecision
                ? request.validators.filter((v) => v.status !== "pending")
                : request.validators.filter((v) => v.status === "passed").slice(0, 2);
              return (
                <div key={s.stage} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setExplainOpen(isOpen ? null : s.stage)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary"
                  >
                    <span className="font-mono text-[10px] text-accent w-10">{layer?.code}</span>
                    <span className="text-xs font-bold uppercase tracking-widest w-24">{s.stage}</span>
                    <span className="text-[12px] truncate flex-1">{s.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{isOpen ? "▾" : "▸"} EXPLAIN</span>
                  </button>
                  {isOpen && (
                    <div className="grid grid-cols-3 gap-4 px-4 pb-4">
                      <div className="border border-border rounded-sm p-3">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-2">Inputs consumed</div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                          Directive · <span className="text-foreground">{request.id}</span><br />
                          Autonomy ceiling · <span className="text-foreground">L{request.autonomy}</span><br />
                          Priority · <span className="text-foreground">{request.priority}</span>
                        </div>
                        {contextInputs.length > 0 && (
                          <div className="mt-2">
                            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Upstream context</div>
                            {contextInputs.map((c) => (
                              <div key={c} className="font-mono text-[10px] text-foreground truncate" title={c}>· {c}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="border border-border rounded-sm p-3">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-2">Tool calls</div>
                        <div className="text-[11px]">
                          <div className="text-muted-foreground">Agent · <span className="text-foreground">{s.agent}</span></div>
                          <div className="text-muted-foreground">Model · <span className="text-foreground font-mono text-[10px]">{model}</span></div>
                          <div className="text-muted-foreground">Layer · <span className="text-foreground">{layer?.name}</span></div>
                          {s.toolCalls && s.toolCalls.length > 0 ? (
                            <div className="mt-2 border-t border-border pt-2 flex flex-col gap-2">
                              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                                Executed tools · {s.toolCalls.length}
                              </div>
                              {s.toolCalls.map((t, i) => (
                                <div key={`${t.name}-${i}`} className="border border-border rounded-sm p-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-[10px] text-accent">⌁ {t.name}</span>
                                    <span className={"font-mono text-[9px] " + (t.ok ? "text-[color:var(--signal)]" : "text-destructive")}>
                                      {t.ok ? "OK" : "ERR"} · {t.ms}ms
                                    </span>
                                  </div>
                                  <div className="font-mono text-[9px] text-muted-foreground mt-1 break-all line-clamp-2">in {t.input}</div>
                                  <div className="font-mono text-[9px] text-foreground/80 mt-1 break-all line-clamp-3">out {t.output}</div>
                                  {(t.sql || t.scope || t.fallback || (t.attempts ?? 1) > 1) && (
                                    <div className="mt-1 space-y-0.5">
                                      {t.sql && <div className="font-mono text-[9px] text-accent break-all">sql {t.sql}</div>}
                                      {t.scope && <div className="font-mono text-[9px] text-muted-foreground break-all">scope {t.scope}</div>}
                                      {((t.attempts ?? 1) > 1 || t.fallback) && (
                                        <div className="font-mono text-[9px] text-[color:var(--warn)]">
                                          attempts {t.attempts ?? 1}{t.fallback ? " · safe fallback served" : ""}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 border-t border-border pt-2 font-mono text-[9px] text-muted-foreground">
                              No tool invocations recorded for this stage.
                            </div>
                          )}
                          {s.artifact && (
                            <div className="mt-2 border-t border-border pt-2">
                              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Output artifact</div>
                              <div className="font-mono text-[10px] text-accent">▤ {s.artifact}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="border border-border rounded-sm p-3">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-2">Validator evidence</div>
                        {s.validation && (
                          <div className="mb-3 border border-border rounded-sm p-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Deterministic KG validator</span>
                              <span
                                className={
                                  "font-mono text-[9px] uppercase " +
                                  (s.validation.verdict === "validated"
                                    ? "text-[color:var(--signal)]"
                                    : s.validation.verdict === "rejected"
                                      ? "text-destructive"
                                      : "text-[color:var(--warn)]")
                                }
                              >
                                {s.validation.verdict} · {s.validation.passed}/{s.validation.checked}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-col gap-1">
                              {s.validation.findings.map((f) => (
                                <div key={f.rule} className="font-mono text-[9px] flex gap-2">
                                  <span
                                    className={
                                      f.status === "pass"
                                        ? "text-[color:var(--signal)]"
                                        : f.status === "fail"
                                          ? "text-destructive"
                                          : "text-muted-foreground"
                                    }
                                  >
                                    {f.status === "pass" ? "✓" : f.status === "fail" ? "✕" : "–"}
                                  </span>
                                  <span className="text-foreground/80">{f.rule}</span>
                                  <span className="text-muted-foreground truncate" title={f.detail}>{f.detail}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {evidence.length === 0 && (
                          <div className="text-[11px] text-muted-foreground">No validator has weighed in yet.</div>
                        )}
                        {evidence.map((v) => (
                          <div key={v.name} className="mb-2 last:mb-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold">{v.name}</span>
                              <span className={"font-mono text-[9px] uppercase tracking-widest px-1.5 " +
                                (v.status === "passed" ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                                  : v.status === "failed" ? "text-[color:var(--danger)] bg-[color:var(--danger)]/10"
                                  : "text-muted-foreground bg-secondary")}>{v.status}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{v.detail}</div>
                          </div>
                        ))}
                      </div>
                      <div className="col-span-3 border border-border rounded-sm p-3">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-2">Reasoning trace</div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{s.reasoning}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] font-mono text-muted-foreground">
            Expand any completed stage to see the exact inputs, model + agent tool call, and validator evidence that informed the decision or output.
          </p>
        </section>
      </div>
    </AppShell>
  );
}