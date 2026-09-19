import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { listRetentionAuditFn, type RetentionAuditRow } from "@/lib/retention-audit.functions";
import {
  computeManifest,
  diffManifests,
  type IntegrityManifest,
  type ManifestDiff,
} from "@/lib/audit-integrity";
import { downloadBlob, timestampSlug } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/audit-integrity")({
  head: () => ({
    meta: [
      { title: "Audit Integrity — Soteria SECP" },
      {
        name: "description",
        content: "Verify ledger consistency and hash chain of the retention audit log.",
      },
      { property: "og:title", content: "Audit Integrity — Soteria SECP" },
      {
        property: "og:description",
        content: "Recompute canonical row hashes and compare against a prior signed manifest.",
      },
    ],
  }),
  component: AuditIntegrityPage,
});

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function isoWeeksAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n * 7);
  return d.toISOString().slice(0, 10);
}

function AuditIntegrityPage() {
  const list = useServerFn(listRetentionAuditFn);
  const [from, setFrom] = useState(isoWeeksAgo(4));
  const [to, setTo] = useState(todayISO());
  const [rows, setRows] = useState<RetentionAuditRow[] | null>(null);
  const [manifest, setManifest] = useState<IntegrityManifest | null>(null);
  const [priorManifest, setPriorManifest] = useState<IntegrityManifest | null>(null);
  const [diff, setDiff] = useState<ManifestDiff | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inRange = useMemo(() => {
    if (!rows) return [];
    const fromT = new Date(`${from}T00:00:00Z`).getTime();
    const toT = new Date(`${to}T23:59:59Z`).getTime();
    return rows.filter((r) => {
      const t = new Date(r.ts).getTime();
      return t >= fromT && t <= toT;
    });
  }, [rows, from, to]);

  async function recompute() {
    setBusy(true);
    setError(null);
    setDiff(null);
    try {
      const data = await list();
      setRows(data);
      const fromT = new Date(`${from}T00:00:00Z`).getTime();
      const toT = new Date(`${to}T23:59:59Z`).getTime();
      const filtered = data.filter((r) => {
        const t = new Date(r.ts).getTime();
        return t >= fromT && t <= toT;
      });
      const m = await computeManifest(filtered, from, to);
      setManifest(m);
      if (priorManifest) setDiff(diffManifests(priorManifest, m));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recompute failed");
    } finally {
      setBusy(false);
    }
  }

  function exportManifest() {
    if (!manifest) return;
    const name = `audit-manifest-${from}_${to}-${timestampSlug()}.json`;
    downloadBlob(name, JSON.stringify(manifest, null, 2), "application/json");
  }

  async function onPriorUpload(f: File) {
    setError(null);
    try {
      const text = await f.text();
      const parsed = JSON.parse(text) as IntegrityManifest;
      if (!parsed || parsed.algorithm !== "sha256" || !Array.isArray(parsed.rows)) {
        throw new Error("File is not a valid audit manifest.");
      }
      setPriorManifest(parsed);
      if (manifest) setDiff(diffManifests(parsed, manifest));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load prior manifest.");
    }
  }

  return (
    <AppShell title="Audit Integrity" crumb="AI · Ledger consistency & hash chain">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Rows in range" value={rows ? String(inRange.length) : "—"} />
          <StatChip
            label="Chain hash"
            value={manifest ? manifest.chain_hash.slice(0, 10) + "…" : "—"}
            tone="accent"
          />
          <StatChip label="Matched" value={diff ? String(diff.matched) : "—"} tone="signal" />
          <StatChip
            label="Mismatched"
            value={diff ? String(diff.mismatched.length + diff.missing.length) : "—"}
            tone={diff && diff.mismatched.length + diff.missing.length > 0 ? "danger" : "signal"}
          />
        </section>

        <section className="bg-surface border border-border rounded-sm p-5 flex flex-col gap-3">
          <SectionHeading code="AI.1" title="Recompute row hashes for a time range" />
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                From (UTC)
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-background border border-border rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                To (UTC)
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-background border border-border rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={recompute}
              disabled={busy}
              className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-40"
            >
              {busy ? "▸ Recomputing…" : "▸ Recompute & sign"}
            </button>
            <button
              type="button"
              onClick={exportManifest}
              disabled={!manifest}
              className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              ⇩ Export manifest (JSON)
            </button>
            <label className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-border text-muted-foreground hover:text-foreground cursor-pointer">
              ⇪ Load prior manifest
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPriorUpload(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          {error && <div className="text-[11px] font-mono text-[color:var(--danger)]">{error}</div>}
          {manifest && (
            <div className="text-[11px] font-mono text-muted-foreground">
              Chain: <span className="text-foreground">{manifest.chain_hash}</span>
              <span className="mx-2 text-border">·</span>
              Rows hashed: <span className="text-foreground">{manifest.count}</span>
              <span className="mx-2 text-border">·</span>
              Signed at{" "}
              <span className="text-foreground">{manifest.generated_at.slice(0, 19)}Z</span>
            </div>
          )}
        </section>

        {diff && (
          <section>
            <SectionHeading code="AI.2" title="Comparison against prior manifest" />
            <div
              className={
                "bg-surface border rounded-sm p-4 " +
                (diff.chain_match && diff.mismatched.length === 0 && diff.missing.length === 0
                  ? "border-[color:var(--signal)]/40"
                  : "border-[color:var(--danger)]/40")
              }
            >
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span
                  className={
                    diff.chain_match ? "text-[color:var(--signal)]" : "text-[color:var(--danger)]"
                  }
                >
                  {diff.chain_match ? "✔ Chain hash matches" : "✘ Chain hash differs"}
                </span>
                <span className="text-border">·</span>
                <span>Matched {diff.matched}</span>
                <span className="text-border">·</span>
                <span
                  className={
                    diff.mismatched.length ? "text-[color:var(--danger)]" : "text-muted-foreground"
                  }
                >
                  Mismatched {diff.mismatched.length}
                </span>
                <span className="text-border">·</span>
                <span
                  className={
                    diff.missing.length ? "text-[color:var(--warn)]" : "text-muted-foreground"
                  }
                >
                  Missing {diff.missing.length}
                </span>
                <span className="text-border">·</span>
                <span className="text-muted-foreground">Added {diff.extra.length}</span>
              </div>
              {(diff.mismatched.length > 0 || diff.missing.length > 0) && (
                <div className="mt-4 text-[11px] font-mono">
                  {diff.mismatched.slice(0, 20).map((m) => (
                    <div key={m.id} className="border-t border-border py-2">
                      <div className="text-[color:var(--danger)]">HASH DIVERGENCE · {m.id}</div>
                      <div className="text-muted-foreground">
                        expected {m.expected.slice(0, 24)}…
                      </div>
                      <div className="text-muted-foreground">actual {m.actual.slice(0, 24)}…</div>
                    </div>
                  ))}
                  {diff.missing.slice(0, 20).map((id) => (
                    <div key={id} className="border-t border-border py-2 text-[color:var(--warn)]">
                      MISSING FROM CURRENT · {id}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section>
          <SectionHeading code="AI.3" title="Row hash inventory" />
          <div className="bg-surface border border-border rounded-sm">
            <div className="grid grid-cols-[180px_100px_1fr] gap-4 px-4 py-2 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Timestamp (UTC)</span>
              <span>Kind</span>
              <span>Row SHA-256</span>
            </div>
            {!manifest && (
              <div className="p-4 text-[11px] font-mono text-muted-foreground">
                Recompute to populate this table.
              </div>
            )}
            {manifest?.rows.slice(0, 200).map((r) => {
              const row = rows?.find((x) => x.id === r.id);
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[180px_100px_1fr] gap-4 px-4 py-2 border-b border-border last:border-b-0 font-mono text-[11px]"
                >
                  <span className="text-muted-foreground">{r.ts.slice(0, 19)}</span>
                  <span className="text-accent">{row?.kind ?? "—"}</span>
                  <span className="text-foreground truncate" title={r.hash}>
                    {r.hash}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] font-mono text-muted-foreground">
            Hashes are computed client-side over a canonical serialization of every audit row. Store
            the signed manifest offline; load it here later to detect any drift, deletion, or
            tampering.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
