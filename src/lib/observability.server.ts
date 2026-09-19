const secretKey = /(key|token|secret|password|authorization|cookie|prompt|content)/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      secretKey.test(key) ? "[REDACTED]" : redact(child),
    ]),
  );
}

export type SecurityEvent = {
  event: string;
  requestId?: string;
  userId?: string;
  organizationId?: string;
  outcome: "allowed" | "denied" | "error" | "degraded";
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

export function emitSecurityEvent(event: SecurityEvent): void {
  const payload = {
    ...event,
    metadata: redact(event.metadata ?? {}),
    ts: new Date().toISOString(),
  };
  console.info(JSON.stringify(payload));
}

export function redactForTelemetry(value: unknown): unknown {
  return redact(value);
}
