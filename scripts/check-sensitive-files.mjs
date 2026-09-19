import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const trackedEnvironmentFile = /(^|\/)(\.env|.*\.env|\.dev\.vars)$/i;
const highConfidenceSecret =
  /(?:sb_(?:publishable|secret)_[A-Za-z0-9_=-]{12,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----)/;
const privateKeyOrCredentialAssignment =
  /(?:AWS_SECRET_ACCESS_KEY|SUPABASE_SERVICE_ROLE_KEY|AI_GATEWAY_API_KEY|DATABASE_URL|PRIVATE_KEY)\s*=\s*(?!process\.env|import\.meta\.env|\$\{)[^\s#]+/;
const findings = [];

for (const file of files) {
  if (trackedEnvironmentFile.test(file)) {
    findings.push(`${file}: tracked environment file`);
    continue;
  }
  if (file.startsWith("reports/") || file.endsWith(".lock")) continue;
  const content = await readFile(file, "utf8").catch(() => "");
  if (highConfidenceSecret.test(content)) findings.push(`${file}: high-confidence secret pattern`);
  if (privateKeyOrCredentialAssignment.test(content) && !file.endsWith(".env.example")) {
    findings.push(`${file}: credential assignment with a non-empty value`);
  }
}

if (findings.length) {
  console.error(`Sensitive-file audit failed:\n${findings.join("\n")}`);
  process.exit(1);
}

console.log(`Sensitive-file audit passed: ${files.length} tracked files inspected`);
console.log(
  "Historical secret exposure still requires a separate rotation review; this check covers the current revision.",
);
