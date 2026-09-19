import { describe, expect, it } from "vitest";
import { redactForTelemetry } from "../observability.server";

describe("observability redaction", () => {
  it("redacts secret-like keys recursively", () => {
    expect(
      redactForTelemetry({
        apiKey: "secret",
        nested: { authorization: "Bearer secret", count: 2 },
        safe: "visible",
      }),
    ).toEqual({
      apiKey: "[REDACTED]",
      nested: { authorization: "[REDACTED]", count: 2 },
      safe: "visible",
    });
  });

  it("redacts arrays without changing operational metrics", () => {
    expect(redactForTelemetry([{ token: "secret", latencyMs: 15 }])).toEqual([
      { token: "[REDACTED]", latencyMs: 15 },
    ]);
  });
});
