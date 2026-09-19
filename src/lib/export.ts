// Client-side export helpers for evidence and audit exports.
// Every export is content-addressed with a SHA-256 hash. The hash is written
// into the payload itself and shipped alongside as a `.sha256` sidecar so
// compliance reviewers can verify a file was not altered after export.

function toCsvValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("; ") : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns?: (keyof T)[]): string {
  if (rows.length === 0) return "";
  const cols = columns ?? (Object.keys(rows[0]) as (keyof T)[]);
  const header = cols.map((c) => toCsvValue(String(c))).join(",");
  const body = rows.map((r) => cols.map((c) => toCsvValue(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function timestampSlug(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyExport(content: string, expectedHex: string): Promise<boolean> {
  const actual = await sha256Hex(content);
  return actual.toLowerCase() === expectedHex.toLowerCase();
}

export async function exportDataset<T extends Record<string, unknown>>(
  baseName: string,
  rows: T[],
  format: "csv" | "json",
  columns?: (keyof T)[],
) {
  const stamp = timestampSlug();
  const filename = `${baseName}-${stamp}.${format}`;
  let content: string;
  let mime: string;
  if (format === "csv") {
    const body = toCsv(rows, columns);
    const bodyHash = await sha256Hex(body);
    // CSV footer carries the hash as a comment-style trailer.
    content = `${body}\n# sha256=${bodyHash}\n# exported_at=${new Date().toISOString()}\n`;
    mime = "text/csv";
  } else {
    const payload = {
      exported_at: new Date().toISOString(),
      dataset: baseName,
      count: rows.length,
      rows,
    };
    const bodyStr = JSON.stringify(payload);
    const bodyHash = await sha256Hex(bodyStr);
    content = JSON.stringify({ ...payload, sha256: bodyHash }, null, 2);
    mime = "application/json";
  }
  const fileHash = await sha256Hex(content);
  downloadBlob(filename, content, mime);
  // Sidecar signature: SHA-256 of the exact bytes shipped in the primary file.
  const sidecar = `${fileHash}  ${filename}\n# Soteria SECP export signature\n# algorithm=sha256\n# exported_at=${new Date().toISOString()}\n`;
  downloadBlob(`${filename}.sha256`, sidecar, "text/plain");
  return { filename, sha256: fileHash };
}
