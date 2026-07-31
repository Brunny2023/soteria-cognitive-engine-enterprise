// Build + download an execution's full audit package: machine-readable JSON
// and a human-readable report, each with a SHA-256 signature sidecar.
import { downloadBlob, sha256Hex, timestampSlug } from "./export";
import type { ArtifactRow, AuditPackage } from "./artifacts.functions";
import { scopeForAgent } from "./secp-scopes";

type StepLike = {
  stage?: string;
  title?: string;
  agent?: string;
  layer?: string;
  status?: string;
  reasoning?: string;
  artifact?: string;
  toolCalls?: { name: string; ok: boolean; ms: number; attempts?: number; fallback?: boolean; sql?: string; scope?: string; input?: string; output?: string }[];
  validation?: { verdict: string; passed: number; checked: number; findings?: { rule: string; status: string; detail: string }[] };
};

function line(char = "─", n = 78) {
  return char.repeat(n);
}

export function renderAuditReport(pkg: AuditPackage): string {
  const req = pkg.request;
  const steps = (Array.isArray(req?.steps) ? (req?.steps as StepLike[]) : []) ?? [];
  const validators = (Array.isArray(req?.validators) ? (req?.validators as { name: string; status: string; detail: string }[]) : []) ?? [];
  const out: string[] = [];
  out.push("SOTERIA SECP — EXECUTION AUDIT PACKAGE");
  out.push(line("="));
  out.push(`Directive      : ${req?.id ?? "—"}`);
  out.push(`Title          : ${req?.title ?? "—"}`);
  out.push(`Origin         : ${req?.origin ?? "—"}   Priority: ${req?.priority ?? "—"}   Autonomy: L${req?.autonomy ?? "—"}`);
  out.push(`Progress       : ${Math.round((req?.progress ?? 0) * 100)}%`);
  out.push(`Generated (UTC): ${pkg.generated_at}`);
  out.push("");
  out.push("BRIEF");
  out.push(line());
  out.push(req?.brief ?? "—");
  out.push("");

  out.push(`REASONING STAGES (${steps.length})`);
  out.push(line("="));
  for (const s of steps) {
    const scope = scopeForAgent(s.agent ?? "");
    out.push(`[${String(s.stage ?? "").toUpperCase()}] ${s.title ?? ""}`);
    out.push(`  agent   : ${s.agent ?? "—"} (${scope.title})`);
    out.push(`  layer   : ${s.layer ?? "—"}   status: ${s.status ?? "—"}`);
    out.push(`  scope   : tables ${scope.tables.join(", ")} · cap ${scope.rowCap} · masked ${scope.masked.join(", ") || "none"}`);
    if (s.reasoning) out.push(`  reasoning: ${s.reasoning.replace(/\s+/g, " ").slice(0, 600)}`);
    if (s.artifact) out.push(`  artifact : ${s.artifact}`);
    if (s.toolCalls?.length) {
      out.push(`  tool calls (${s.toolCalls.length}):`);
      for (const t of s.toolCalls) {
        out.push(`    · ${t.name} — ${t.ok ? "OK" : "FAILED"} ${t.ms}ms attempts=${t.attempts ?? 1}${t.fallback ? " fallback=yes" : ""}`);
        if (t.sql) out.push(`      sql   : ${t.sql}`);
        if (t.scope) out.push(`      scope : ${t.scope}`);
      }
    }
    if (s.validation) {
      out.push(`  validator: ${s.validation.verdict} (${s.validation.passed}/${s.validation.checked})`);
      for (const f of s.validation.findings ?? []) {
        out.push(`      ${f.status === "pass" ? "PASS" : f.status === "fail" ? "FAIL" : "SKIP"} ${f.rule} — ${f.detail}`);
      }
    }
    out.push("");
  }

  out.push(`VALIDATOR BATTERY (${validators.length})`);
  out.push(line("="));
  for (const v of validators) out.push(`  [${v.status.toUpperCase()}] ${v.name} — ${v.detail}`);
  out.push("");

  out.push(`ARTIFACT LEDGER (${pkg.artifacts.length})`);
  out.push(line("="));
  for (const a of pkg.artifacts) {
    out.push(`${a.created_at}  ${a.stage.toUpperCase()}  ${a.kind}  ${a.name}`);
    out.push(`  agent    : ${a.agent}`);
    out.push(`  sha256   : ${a.checksum}`);
    out.push(`  inputs   : ${a.inputs.replace(/\s+/g, " ").slice(0, 400)}`);
    out.push(`  content  :`);
    for (const l of a.content.split("\n")) out.push(`    ${l}`);
    out.push("");
  }

  out.push(line("="));
  out.push("Verify: recompute SHA-256 of each artifact content and compare with the checksum above.");
  out.push("The accompanying .sha256 sidecars sign the exact bytes of this report and its JSON twin.");
  return out.join("\n");
}

export async function downloadAuditPackage(pkg: AuditPackage) {
  const stamp = timestampSlug();
  const base = `secp-audit-${(pkg.request?.id ?? "unknown").toLowerCase()}-${stamp}`;

  const artifactDigests = await Promise.all(
    pkg.artifacts.map(async (a: ArtifactRow) => ({
      id: a.id,
      name: a.name,
      stored_checksum: a.checksum,
      recomputed_checksum: await sha256Hex(a.content),
    })),
  );
  const jsonBody = {
    package: "soteria-secp-execution-audit",
    version: 1,
    generated_at: pkg.generated_at,
    request: pkg.request,
    artifacts: pkg.artifacts,
    integrity: {
      artifacts: artifactDigests,
      tampered: artifactDigests.filter((d) => d.stored_checksum !== d.recomputed_checksum).map((d) => d.id),
    },
  };
  const jsonStr = JSON.stringify(jsonBody, null, 2);
  const jsonHash = await sha256Hex(jsonStr);
  const jsonContent = JSON.stringify({ ...jsonBody, sha256: jsonHash }, null, 2);
  const jsonFileHash = await sha256Hex(jsonContent);

  const report = renderAuditReport(pkg);
  const reportContent = `${report}\n\n# sha256(report_body)=${await sha256Hex(report)}\n`;
  const reportFileHash = await sha256Hex(reportContent);

  downloadBlob(`${base}.json`, jsonContent, "application/json");
  downloadBlob(`${base}.txt`, reportContent, "text/plain");
  downloadBlob(
    `${base}.sha256`,
    [
      `${jsonFileHash}  ${base}.json`,
      `${reportFileHash}  ${base}.txt`,
      "# Soteria SECP audit package signature",
      "# algorithm=sha256",
      `# exported_at=${new Date().toISOString()}`,
      "",
    ].join("\n"),
    "text/plain",
  );

  return { json: jsonFileHash, report: reportFileHash, tampered: jsonBody.integrity.tampered.length };
}