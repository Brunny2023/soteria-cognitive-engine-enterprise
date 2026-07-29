// Client-side export helpers for evidence and audit exports.

function toCsvValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("; ") : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns?: (keyof T)[]): string {
  if (rows.length === 0) return "";
  const cols = (columns ?? (Object.keys(rows[0]) as (keyof T)[]));
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

export function exportDataset<T extends Record<string, unknown>>(
  baseName: string,
  rows: T[],
  format: "csv" | "json",
  columns?: (keyof T)[],
) {
  const stamp = timestampSlug();
  if (format === "csv") {
    downloadBlob(`${baseName}-${stamp}.csv`, toCsv(rows, columns), "text/csv");
  } else {
    const payload = {
      exported_at: new Date().toISOString(),
      dataset: baseName,
      count: rows.length,
      rows,
    };
    downloadBlob(`${baseName}-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json");
  }
}