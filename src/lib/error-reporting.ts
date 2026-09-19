type ErrorContext = Record<string, unknown>;

export function reportRuntimeError(error: unknown, context: ErrorContext = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  const payload = {
    event: "runtime_error",
    message,
    stack: error instanceof Error ? error.stack : undefined,
    route: typeof window === "undefined" ? undefined : window.location.pathname,
    context,
    timestamp: new Date().toISOString(),
  };
  if (typeof window !== "undefined") console.error(payload);
  else console.error(JSON.stringify(payload));
}
