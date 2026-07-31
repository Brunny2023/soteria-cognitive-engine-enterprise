import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { auditPackageFn, listArtifactsFn, toolHealthFn, type ArtifactRow, type AuditPackage, type ToolHealthRow } from "@/lib/artifacts.functions";
import { EXECUTIVE_SCOPES } from "@/lib/secp-scopes";
import { dispatchToolHealthAlertFn, type AlertDispatchResult } from "@/lib/alerts.functions";
import {
  DEFAULT_CHANNELS,
  DEFAULT_THRESHOLDS,
  evaluateBreaches,
  loadAlertConfig,
  renderAlertText,
  saveAlertConfig,
  type AlertChannels,
  type AlertThresholds,
} from "@/lib/tool-health-alerts";
import { downloadAuditPackage } from "@/lib/audit-package";

export const Route = createFileRoute("/_authenticated/artifacts")({
  head: () => ({
    meta: [
      { title: "Artifact Ledger — Soteria SECP" },
      { name: "description", content: "Inspect execution inputs, outputs, checksums, timestamps and provenance for every executed decision." },
      { property: "og:title", content: "Artifact Ledger — Soteria SECP" },
      { property: "og:description", content: "Checksummed provenance for every artifact produced by the SECP cognition pipeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArtifactLedgerPage,
});

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function ArtifactLedgerPage() {
  const listArtifacts = useServerFn(listArtifactsFn);
  const health = useServerFn(toolHealthFn);
  const fetchAuditPackage = useServerFn(auditPackageFn);
  const dispatchAlert = useServerFn(dispatchToolHealthAlertFn);
  const [selected, setSelected] = useState<ArtifactRow | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string>("all");
  const [verify, setVerify] = useState<Record<string, "ok" | "tampered" | "checking">>({});
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [channels, setChannels] = useState<AlertChannels>(DEFAULT_CHANNELS);
  const [alertResult, setAlertResult] = useState<AlertDispatchResult | null>(null);
  const [alertBusy, setAlertBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);

  useEffect(() => {
    const cfg = loadAlertConfig();
    setThresholds(cfg.thresholds);
    setChannels(cfg.channels);
  }, []);

  useEffect(() => {
    saveAlertConfig({ thresholds, channels });
  }, [thresholds, channels]);

  const artifacts = useQuery<ArtifactRow[]>({ queryKey: ["artifacts"], queryFn: () => listArtifacts() as Promise<ArtifactRow[]> });
  const toolHealth = useQuery<ToolHealthRow[]>({ queryKey: ["tool-health"], queryFn: () => health() as Promise<ToolHealthRow[]>, refetchInterval: 30000 });

  const rows = useMemo(() => {
    const all = artifacts.data ?? [];
    const q = query.trim().toLowerCase();
    return all.filter(
      (a) =>
        (kind === "all" || a.kind === kind) &&
        (!q || [a.name, a.request_id, a.agent, a.stage, a.checksum].some((f) => String(f).toLowerCase().includes(q))),
    );
  }, [artifacts.data, query, kind]);

  const kinds = useMemo<string[]>(() => ["all", ...new Set((artifacts.data ?? []).map((a) => a.kind))], [artifacts.data]);
  const degraded = (toolHealth.data ?? []).reduce((n, t) => n + t.fallbacks, 0);
  const failures = (toolHealth.data ?? []).reduce((n, t) => n + t.failed, 0);
  const breaches = useMemo(() => evaluateBreaches(toolHealth.data ?? [], thresholds), [toolHealth.data, thresholds]);

  async function sendAlert() {
    setAlertBusy(true);
    setAlertResult(null);
    try {
      const res = (await dispatchAlert({
        data: {
          breaches,
          text: renderAlertText(breaches),
          slackWebhookUrl: channels.slackWebhookUrl,
          emailTo: channels.emailTo,
          emailFrom: channels.emailFrom,
        },
      })) as AlertDispatchResult;
      setAlertResult(res);
    } finally {
      setAlertBusy(false);
    }
  }

  // Auto-dispatch once per breach signature while alerting is enabled.
  const signature = breaches.map((b) => `${b.tool}:${b.metric}:${b.observed}`).join("|");
  useEffect(() => {
    if (!channels.enabled || !signature) return;
    void sendAlert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, channels.enabled]);

  async function exportAuditPackage(requestId: string) {
    setExportBusy(requestId);
    setExportNote(null);
    try {
      const pkg = (await fetchAuditPackage({ data: { requestId } })) as AuditPackage;
      const res = await downloadAuditPackage(pkg);
      setExportNote(
        `${requestId} · JSON ${res.json.slice(0, 16)}… · report ${res.report.slice(0, 16)}…${res.tampered ? ` · ${res.tampered} checksum mismatch(es)` : " · all checksums match"}`,
      );
    } catch (e) {
      setExportNote(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExportBusy(null);
    }
  }

  async function verifyChecksum(a: ArtifactRow) {
    setVerify((v) => ({ ...v, [a.id]: "checking" }));
    const recomputed = await sha256Hex(a.content);
    setVerify((v) => ({ ...v, [a.id]: recomputed === a.checksum ? "ok" : "tampered" }));
  }

  return (
    <AppShell
      title="Artifact Ledger"
      crumb="PROVENANCE · CHECKSUMS · TOOL HEALTH"
      status={failures > 0 ? "TOOL_HEALTH: DEGRADED" : "TOOL_HEALTH: NOMINAL"}
      inspector={
        <div className="p-4 overflow-y-auto">
          <SectionHeading code="SCOPE" title="Per-executive data scoping" />
          <div className="space-y-2">
            {EXECUTIVE_SCOPES.map((s) => (
              <div key={s.agent} className="border border-border rounded-sm p-2 bg-surface-2">
                <div className="font-mono text-[10px] text-accent">{s.agent}</div>
                <div className="text-[10px] text-muted-foreground">{s.title} · cap {s.rowCap}</div>
                <div className="mt-1 font-mono text-[9px] text-muted-foreground leading-relaxed break-words">
                  {s.tables.join(" · ")}
                </div>
                {s.masked.length > 0 && (
                  <div className="mt-1 font-mono text-[9px] text-[color:var(--warn)]">masked: {s.masked.join(", ")}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-8">
        <section>
          <SectionHeading code="AL" title="Ledger summary" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatChip label="Artifacts" value={String((artifacts.data ?? []).length)} tone="accent" />
            <StatChip label="Tool calls" value={String((toolHealth.data ?? []).reduce((n, t) => n + t.calls, 0))} />
            <StatChip label="Fallbacks served" value={String(degraded)} tone={degraded ? "warn" : "default"} />
            <StatChip label="Unrecovered failures" value={String(failures)} tone={failures ? "danger" : "signal"} />
          </div>
        </section>

        <section>
          <SectionHeading code="TH" title="Tool health · retries · safe fallbacks" />
          <div className="border border-border rounded-sm overflow-hidden">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-surface text-muted-foreground">
                <tr>
                  {["TOOL", "CALLS", "OK", "FAILED", "RETRIED", "FALLBACK", "P50", "P95", "LAST ERROR"].map((h) => (
                    <th key={h} className="px-3 py-2 font-normal tracking-widest text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(toolHealth.data ?? []).map((t) => (
                  <tr key={t.name} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{t.name}</td>
                    <td className="px-3 py-2">{t.calls}</td>
                    <td className="px-3 py-2 text-[color:var(--signal)]">{t.ok}</td>
                    <td className={"px-3 py-2 " + (t.failed ? "text-[color:var(--danger)]" : "")}>{t.failed}</td>
                    <td className="px-3 py-2">{t.retried}</td>
                    <td className={"px-3 py-2 " + (t.fallbacks ? "text-[color:var(--warn)]" : "")}>{t.fallbacks}</td>
                    <td className="px-3 py-2">{t.p50}ms</td>
                    <td className="px-3 py-2">{t.p95}ms</td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[220px]">{t.lastError ?? "—"}</td>
                  </tr>
                ))}
                {(toolHealth.data ?? []).length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-4 text-muted-foreground">No tool executions recorded yet. Advance a request to populate health telemetry.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionHeading
            code="PR"
            title="Provenance ledger"
            action={
              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="search name · request · agent · checksum"
                  className="bg-surface border border-border rounded-sm px-2 py-1 font-mono text-[10px] w-64"
                />
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="bg-surface border border-border rounded-sm px-2 py-1 font-mono text-[10px]"
                >
                  {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            }
          />
          {artifacts.isLoading && <div className="text-[11px] text-muted-foreground">Loading ledger…</div>}
          {artifacts.error && <div className="text-[11px] text-[color:var(--danger)]">{(artifacts.error as Error).message}</div>}
          <div className="space-y-2">
            {rows.map((a) => {
              const open = selected?.id === a.id;
              const v = verify[a.id];
              return (
                <div key={a.id} className="border border-border rounded-sm bg-surface">
                  <button
                    type="button"
                    onClick={() => setSelected(open ? null : a)}
                    className="w-full text-left px-3 py-2 flex flex-wrap items-center gap-3"
                  >
                    <span className="font-mono text-[10px] text-accent">{a.request_id}</span>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">{a.stage}</span>
                    <span className="text-[12px] text-foreground flex-1 min-w-[160px] truncate">{a.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{a.kind}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{new Date(a.created_at).toISOString().replace("T", " ").slice(0, 19)}Z</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{open ? "▾" : "▸"}</span>
                  </button>
                  {open && (
                    <div className="border-t border-border px-3 py-3 space-y-3">
                      <div className="grid md:grid-cols-2 gap-3 font-mono text-[10px]">
                        <div className="space-y-1">
                          <div className="text-muted-foreground tracking-widest">AGENT</div>
                          <div className="text-foreground">{a.agent}</div>
                          <div className="text-muted-foreground tracking-widest mt-2">EXECUTION INPUTS</div>
                          <pre className="whitespace-pre-wrap break-words text-foreground bg-surface-2 border border-border rounded-sm p-2">
                            {a.inputs}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground tracking-widest">SHA-256 CHECKSUM</div>
                          <div className="break-all text-accent">{a.checksum}</div>
                          <button
                            type="button"
                            onClick={() => verifyChecksum(a)}
                            className="mt-2 border border-border rounded-sm px-2 py-1 uppercase tracking-widest hover:bg-secondary"
                          >
                            Verify integrity
                          </button>
                          {v === "checking" && <div className="text-muted-foreground">recomputing…</div>}
                          {v === "ok" && <div className="text-[color:var(--signal)]">MATCH · content is unaltered</div>}
                          {v === "tampered" && <div className="text-[color:var(--danger)]">MISMATCH · content differs from stored checksum</div>}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-muted-foreground tracking-widest mb-1">OUTPUT</div>
                        <pre className="whitespace-pre-wrap break-words text-[11px] text-foreground bg-surface-2 border border-border rounded-sm p-3 max-h-80 overflow-y-auto">
                          {a.content}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!artifacts.isLoading && rows.length === 0 && (
              <div className="text-[11px] text-muted-foreground">No artifacts match. Executives write here whenever they execute, validate or deliver.</div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
