import { access, readFile } from "node:fs/promises";
import process from "node:process";

const required = [
  "docs/security/threat-model.md",
  "docs/security/authorization-matrix.md",
  "docs/operations/runbook.md",
  "docs/legal/third-party-and-provenance.md",
  "infra/cloudflare/wrangler.toml.example",
  "infra/docker/compose.staging.yml",
  "evaluations/reference-workflow.json",
  ".github/workflows/enterprise-release.yml",
  ".github/CODEOWNERS",
  "CHANGELOG.md",
];
const missing = [];
for (const file of required) {
  try {
    await access(file);
    const content = await readFile(file, "utf8");
    if (!content.trim()) missing.push(`${file} (empty)`);
  } catch {
    missing.push(file);
  }
}
if (missing.length) {
  console.error(`Missing release evidence: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`Release evidence present: ${required.length} required artifacts`);
