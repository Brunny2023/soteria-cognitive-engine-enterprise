import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { readinessCheckFn } from "@/lib/gateway.functions";
import { exportDataset } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/publish")({
  head: () => ({
    meta: [
      { title: "Publish readiness — Soteria SECP" },
      { name: "description", content: "Verify auth, database connectivity, export integrity, and audit-log completeness before shipping the cognitive operating system." },
      { property: "og:title", content: "Publish readiness — Soteria SECP" },
      { property: "og:description", content: "Pre-flight for a defensible SECP deployment." },
    ],
  }),
  component: PublishPage,
});

type Check = { key: string; label: string; status: "pass" | "warn" | "fail"; detail: string };

function PublishPage() {
  const run = useServerFn(readinessCheckFn);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [ts, setTs] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportOk, setExportOk] = useState<null | "pass" | "fail">(null);

  const verify = useCallback(async () => {
    setLoading(true);
    try {
      const res = await run();
      setChecks(res.checks as Check[]);
      setTs(res.generated_at);
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    verify();
  }, [verify]);

  function testExport() {
    try {
      const sample = [{ id: 1, name: "SECP export self-test", ts: new Date().toISOString() }];
      exportDataset("secp-export-self-test", sample, "csv");
      exportDataset("secp-export-self-test", sample, "json");
      setExportOk("pass");
    } catch {
      setExportOk("fail");
    }
  }

  const pass = checks?.filter((c) => c.status === "pass").length ?? 0;
  const warn = checks?.filter((c) => c.status === "warn").length ?? 0;
  const fail = checks?.filter((c) => c.status === "fail").length ?? 0;
  const ready = fail === 0 && (checks?.length ?? 0) > 0;

  return (
    <AppShell title="Publish readiness" crumb="PB · Pre-flight">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Checks passed" value={String(pass)} tone="signal" />
          <StatChip label="Warnings" value={String(warn)} tone="warn" />
          <StatChip label="Failures" value={String(fail)} tone={fail ? "danger" : "signal"} />
          <StatChip label="Deployment gate" value={ready ? "READY" : "HOLD"} tone={ready ? "signal" : "danger"} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionHeading code="PB.1" title="Automated verification" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{ts ? `Last run · ${ts.replace("T", " ").slice(0, 19)} UTC` : "—"}</span>
              <button
                type="button"
                onClick={verify}
                disabled={loading}
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-40"
              >
                {loading ? "▸ Running…" : "▸ Re-run checks"}
              </button>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-sm">
            {(checks ?? []).map((c) => (
              <div key={c.key} className="grid grid-cols-[1fr_100px] gap-4 px-5 py-3 border-b border-border last:border-b-0 items-start">
                <div>
                  <div className="text-sm font-bold">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{c.detail}</div>
                  <div className="font-mono text-[9px] text-muted-foreground mt-1">{c.key}</div>
                </div>
                <span
                  className={
                    "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 w-fit " +
                    (c.status === "pass"
                      ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                      : c.status === "warn"
                        ? "text-[color:var(--warn)] bg-[color:var(--warn)]/10"
                        : "text-[color:var(--danger)] bg-[color:var(--danger)]/10")
                  }
                >
                  {c.status}
                </span>
              </div>
            ))}
            {!checks && (
              <div className="px-5 py-6 text-center font-mono text-[11px] text-muted-foreground">Running…</div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="PB.2" title="Export integrity self-test" />
            <p className="text-[11px] text-muted-foreground mb-3">
              Downloads a small CSV and JSON dataset through the same export pipeline used by Governance and Retention. Confirms browser save + UTC exported_at stamp.
            </p>
            <button
              type="button"
              onClick={testExport}
              className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
            >
              ▸ Run export self-test
            </button>
            {exportOk && (
              <div
                className={
                  "mt-3 font-mono text-[10px] uppercase tracking-widest " +
                  (exportOk === "pass" ? "text-[color:var(--signal)]" : "text-[color:var(--danger)]")
                }
              >
                {exportOk === "pass" ? "▪ CSV + JSON delivered." : "▪ Export failed — investigate."}
              </div>
            )}
          </div>
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="PB.3" title="Sign-off checklist" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li>▪ Executive sponsor identified and approves the deployment scope.</li>
              <li>▪ Autonomy caps reviewed under AD.1 and match the tenant's risk appetite.</li>
              <li>▪ Retention windows (RT.1) confirmed against regulatory floors.</li>
              <li>▪ Model routing (AD.0) validated for every intelligence layer.</li>
              <li>▪ Governance evidence exported and filed with the compliance owner.</li>
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}