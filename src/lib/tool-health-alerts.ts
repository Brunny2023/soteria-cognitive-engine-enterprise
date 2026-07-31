// Tool-health alerting: configurable thresholds + deterministic breach evaluation.
// Pure and client-safe; dispatch happens in alerts.functions.ts on the server.

export interface AlertThresholds {
  /** Percentage (0-100) of failed calls over total calls that triggers an alert. */
  failureRatePct: number;
  /** Absolute count of retried calls that triggers an alert. */
  retryCount: number;
  /** Absolute count of safe-fallback (degraded) results that triggers an alert. */
  fallbackCount: number;
  /** p95 latency ceiling in milliseconds. */
  p95Ms: number;
  /** Minimum calls before a tool is eligible for rate-based alerting. */
  minSample: number;
}

export interface AlertChannels {
  slackWebhookUrl: string;
  emailTo: string;
  emailFrom: string;
  enabled: boolean;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  failureRatePct: 10,
  retryCount: 3,
  fallbackCount: 2,
  p95Ms: 4000,
  minSample: 3,
};

export const DEFAULT_CHANNELS: AlertChannels = {
  slackWebhookUrl: "",
  emailTo: "",
  emailFrom: "",
  enabled: false,
};

export interface HealthRowLike {
  name: string;
  calls: number;
  ok: number;
  failed: number;
  retried: number;
  fallbacks: number;
  p50: number;
  p95: number;
  lastError: string | null;
}

export interface Breach {
  tool: string;
  metric: "failure-rate" | "retries" | "fallbacks" | "latency";
  observed: string;
  threshold: string;
  severity: "critical" | "warning";
}

export function evaluateBreaches(rows: HealthRowLike[], t: AlertThresholds): Breach[] {
  const breaches: Breach[] = [];
  for (const r of rows) {
    const rate = r.calls > 0 ? (r.failed / r.calls) * 100 : 0;
    if (r.calls >= t.minSample && rate > t.failureRatePct) {
      breaches.push({ tool: r.name, metric: "failure-rate", observed: `${rate.toFixed(1)}%`, threshold: `${t.failureRatePct}%`, severity: "critical" });
    }
    if (r.retried > t.retryCount) {
      breaches.push({ tool: r.name, metric: "retries", observed: String(r.retried), threshold: String(t.retryCount), severity: "warning" });
    }
    if (r.fallbacks > t.fallbackCount) {
      breaches.push({ tool: r.name, metric: "fallbacks", observed: String(r.fallbacks), threshold: String(t.fallbackCount), severity: "critical" });
    }
    if (r.p95 > t.p95Ms) {
      breaches.push({ tool: r.name, metric: "latency", observed: `${r.p95}ms p95`, threshold: `${t.p95Ms}ms`, severity: "warning" });
    }
  }
  return breaches;
}

export function renderAlertText(breaches: Breach[]): string {
  if (breaches.length === 0) return "SECP tool health nominal — no thresholds breached.";
  const lines = breaches.map(
    (b) => `• [${b.severity.toUpperCase()}] ${b.tool} · ${b.metric}: ${b.observed} exceeds ${b.threshold}`,
  );
  return [`SECP tool-health alert — ${breaches.length} threshold breach(es)`, ...lines].join("\n");
}

const STORAGE_KEY = "secp.tool-health-alerts.v1";

export interface AlertConfig {
  thresholds: AlertThresholds;
  channels: AlertChannels;
}

export function loadAlertConfig(): AlertConfig {
  if (typeof window === "undefined") return { thresholds: DEFAULT_THRESHOLDS, channels: DEFAULT_CHANNELS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { thresholds: DEFAULT_THRESHOLDS, channels: DEFAULT_CHANNELS };
    const parsed = JSON.parse(raw) as Partial<AlertConfig>;
    return {
      thresholds: { ...DEFAULT_THRESHOLDS, ...(parsed.thresholds ?? {}) },
      channels: { ...DEFAULT_CHANNELS, ...(parsed.channels ?? {}) },
    };
  } catch {
    return { thresholds: DEFAULT_THRESHOLDS, channels: DEFAULT_CHANNELS };
  }
}

export function saveAlertConfig(config: AlertConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}