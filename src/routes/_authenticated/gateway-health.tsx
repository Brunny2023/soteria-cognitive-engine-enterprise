import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { LAYER_MODEL_CATALOG, pingLayerFn, type LayerPingResult } from "@/lib/gateway.functions";
import { LAYERS, type LayerId } from "@/lib/secp-data";

export const Route = createFileRoute("/_authenticated/gateway-health")({
  head: () => ({
    meta: [
      { title: "AI Gateway Health — Soteria SECP" },
      {
        name: "description",
        content:
          "Live latency, error rate, and connectivity telemetry for every intelligence layer of the AI Gateway.",
      },
      { property: "og:title", content: "AI Gateway Health — Soteria SECP" },
      {
        property: "og:description",
        content: "Per-layer AI Gateway health with alerting for degradation.",
      },
    ],
  }),
  component: GatewayHealthPage,
});

type Sample = { ts: number; latency: number; ok: boolean; error: string | null };
type LayerHistory = Record<LayerId, Sample[]>;

const MAX_SAMPLES = 30;
const DEGRADED_LATENCY_MS = 3500;
const ERROR_ALERT_RATE = 0.25;

function emptyHistory(): LayerHistory {
  return LAYERS.reduce((acc, l) => {
    acc[l.id] = [];
    return acc;
  }, {} as LayerHistory);
}

function stats(samples: Sample[]) {
  if (samples.length === 0) return { p50: 0, p95: 0, errRate: 0, last: null as Sample | null };
  const lats = samples.map((s) => s.latency).sort((a, b) => a - b);
  const p = (q: number) => lats[Math.min(lats.length - 1, Math.floor(lats.length * q))];
  const errs = samples.filter((s) => !s.ok).length;
  return {
    p50: p(0.5),
    p95: p(0.95),
    errRate: errs / samples.length,
    last: samples[samples.length - 1],
  };
}

function Sparkline({ samples }: { samples: Sample[] }) {
  if (samples.length < 2) {
    return <div className="text-[9px] font-mono text-muted-foreground">— insufficient samples</div>;
  }
  const max = Math.max(...samples.map((s) => s.latency), 1000);
  const w = 160,
    h = 32;
  const pts = samples
    .map((s, i) => {
      const x = (i / (samples.length - 1)) * w;
      const y = h - (s.latency / max) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className="text-primary"
      />
      {samples.map((s, i) => {
        if (s.ok) return null;
        const x = (i / (samples.length - 1)) * w;
        return <circle key={i} cx={x} cy={h - 2} r={2.5} className="fill-[color:var(--danger)]" />;
      })}
    </svg>
  );
}

function GatewayHealthPage() {
  const ping = useServerFn(pingLayerFn);
  const [history, setHistory] = useState<LayerHistory>(emptyHistory);
  const [running, setRunning] = useState(false);
  const [autoPoll, setAutoPoll] = useState(false);
  const [alerts, setAlerts] = useState<
    { ts: string; layer: LayerId; kind: "latency" | "error"; detail: string }[]
  >([]);
  const alertedRef = useRef<Record<string, number>>({});

  async function sweep() {
    setRunning(true);
    const next: Partial<Record<LayerId, Sample>> = {};
    for (const l of LAYERS) {
      const r: LayerPingResult = await ping({ data: { layer: l.id } });
      next[l.id] = { ts: Date.now(), latency: r.latency_ms, ok: r.ok, error: r.error };
    }
    setHistory((h) => {
      const merged = { ...h };
      for (const l of LAYERS) {
        const s = next[l.id];
        if (!s) continue;
        merged[l.id] = [...(merged[l.id] ?? []), s].slice(-MAX_SAMPLES);
      }
      // Alerting
      const newAlerts: typeof alerts = [];
      const now = Date.now();
      for (const l of LAYERS) {
        const st = stats(merged[l.id]);
        const throttleKey = `${l.id}`;
        if (
          (st.errRate >= ERROR_ALERT_RATE ||
            (st.p95 > DEGRADED_LATENCY_MS && st.last?.ok === false) ||
            st.p95 > DEGRADED_LATENCY_MS) &&
          (!alertedRef.current[throttleKey] || now - alertedRef.current[throttleKey] > 60_000)
        ) {
          alertedRef.current[throttleKey] = now;
          newAlerts.push({
            ts: new Date().toISOString(),
            layer: l.id,
            kind: st.errRate >= ERROR_ALERT_RATE ? "error" : "latency",
            detail:
              st.errRate >= ERROR_ALERT_RATE
                ? `Error rate ${(st.errRate * 100).toFixed(0)}% over last ${merged[l.id].length} samples`
                : `p95 latency ${st.p95} ms exceeds ${DEGRADED_LATENCY_MS} ms threshold`,
          });
        }
      }
      if (newAlerts.length) setAlerts((a) => [...newAlerts, ...a].slice(0, 50));
      return merged;
    });
    setRunning(false);
  }

  useEffect(() => {
    if (!autoPoll) return;
    const id = setInterval(() => {
      if (!running) sweep();
    }, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPoll]);

  const overallErrRate = (() => {
    const all = LAYERS.flatMap((l) => history[l.id]);
    if (all.length === 0) return 0;
    return all.filter((s) => !s.ok).length / all.length;
  })();

  const degradedLayers = LAYERS.filter((l) => {
    const st = stats(history[l.id]);
    return st.errRate >= ERROR_ALERT_RATE || st.p95 > DEGRADED_LATENCY_MS;
  });

  return (
    <AppShell title="AI Gateway Health" crumb="GH · Per-layer telemetry & alerts">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Layers monitored" value={String(LAYERS.length)} />
          <StatChip
            label="Samples collected"
            value={String(LAYERS.reduce((n, l) => n + history[l.id].length, 0))}
            tone="accent"
          />
          <StatChip
            label="Overall error rate"
            value={`${(overallErrRate * 100).toFixed(1)}%`}
            tone={
              overallErrRate >= ERROR_ALERT_RATE ? "danger" : overallErrRate > 0 ? "warn" : "signal"
            }
          />
          <StatChip
            label="Degraded layers"
            value={String(degradedLayers.length)}
            tone={degradedLayers.length ? "danger" : "signal"}
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionHeading
              code="GH.1"
              title="Per-layer connectivity, latency, and error telemetry"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={sweep}
                disabled={running}
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-40"
              >
                {running ? "▸ Sampling…" : "▸ Sample now"}
              </button>
              <button
                type="button"
                onClick={() => setAutoPoll((v) => !v)}
                className={
                  "font-mono text-[10px] uppercase tracking-widest px-3 py-2 border " +
                  (autoPoll
                    ? "border-accent/60 text-accent bg-accent/10"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {autoPoll ? "◉ Auto-poll · 30s" : "○ Auto-poll off"}
              </button>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-sm">
            <div className="grid grid-cols-[80px_1.4fr_180px_100px_100px_100px_100px] gap-3 px-5 py-3 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Layer</span>
              <span>Model</span>
              <span>Latency trend</span>
              <span>p50 ms</span>
              <span>p95 ms</span>
              <span>Errors</span>
              <span>Status</span>
            </div>
            {LAYERS.map((l) => {
              const st = stats(history[l.id]);
              const degraded = st.errRate >= ERROR_ALERT_RATE || st.p95 > DEGRADED_LATENCY_MS;
              const untouched = history[l.id].length === 0;
              return (
                <div
                  key={l.id}
                  className="grid grid-cols-[80px_1.4fr_180px_100px_100px_100px_100px] gap-3 px-5 py-3 border-b border-border last:border-b-0 items-center"
                >
                  <span className="font-mono text-[10px] text-accent">{l.code}</span>
                  <div>
                    <div className="text-sm font-bold">{l.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {LAYER_MODEL_CATALOG[l.id]}
                    </div>
                  </div>
                  <Sparkline samples={history[l.id]} />
                  <span className="font-mono text-[11px]">{untouched ? "—" : `${st.p50}`}</span>
                  <span
                    className={
                      "font-mono text-[11px] " +
                      (st.p95 > DEGRADED_LATENCY_MS ? "text-[color:var(--danger)]" : "")
                    }
                  >
                    {untouched ? "—" : `${st.p95}`}
                  </span>
                  <span
                    className={
                      "font-mono text-[11px] " + (st.errRate > 0 ? "text-[color:var(--warn)]" : "")
                    }
                  >
                    {untouched ? "—" : `${(st.errRate * 100).toFixed(0)}%`}
                  </span>
                  <span
                    className={
                      "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 w-fit " +
                      (untouched
                        ? "text-muted-foreground bg-secondary"
                        : degraded
                          ? "text-[color:var(--danger)] bg-[color:var(--danger)]/10"
                          : "text-[color:var(--signal)] bg-[color:var(--signal)]/10")
                    }
                  >
                    {untouched ? "no data" : degraded ? "degraded" : "healthy"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] font-mono text-muted-foreground">
            Alerts fire when the p95 exceeds {DEGRADED_LATENCY_MS} ms or the error rate exceeds{" "}
            {(ERROR_ALERT_RATE * 100).toFixed(0)}% over the sample window (max {MAX_SAMPLES}).
          </p>
        </section>

        <section>
          <SectionHeading code="GH.2" title="Admin alerts · connectivity degradation" />
          <div className="bg-surface border border-border rounded-sm">
            {alerts.length === 0 ? (
              <div className="px-5 py-6 text-center font-mono text-[11px] text-muted-foreground">
                No alerts. All layers within latency and error budgets.
              </div>
            ) : (
              alerts.map((a, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[180px_100px_120px_1fr] gap-3 px-5 py-3 border-b border-border last:border-b-0 items-center"
                >
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {a.ts.replace("T", " ").slice(0, 19)}
                  </span>
                  <span
                    className={
                      "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 w-fit " +
                      (a.kind === "error"
                        ? "text-[color:var(--danger)] bg-[color:var(--danger)]/10"
                        : "text-[color:var(--warn)] bg-[color:var(--warn)]/10")
                    }
                  >
                    {a.kind}
                  </span>
                  <span className="font-mono text-[11px] text-accent">
                    {LAYERS.find((l) => l.id === a.layer)?.code}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{a.detail}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
