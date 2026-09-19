import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const migrationsDir = path.resolve("supabase/migrations");
const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
const enabled = new Set();
const policies = new Map();
const organizationTables = new Set();

for (const file of files) {
  const sql = await readFile(path.join(migrationsDir, file), "utf8");
  for (const match of sql.matchAll(
    /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([\w.]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi,
  )) {
    enabled.add(match[1].toLowerCase());
  }
  for (const match of sql.matchAll(
    /CREATE\s+POLICY\s+(?:"[^"]+"|[\w-]+)\s+ON\s+(?:public\.)?([\w.]+)/gi,
  )) {
    const table = match[1].toLowerCase();
    policies.set(table, (policies.get(table) ?? 0) + 1);
  }
  if (/organization_id/i.test(sql)) {
    for (const match of sql.matchAll(
      /(?:CREATE\s+TABLE[^;]*?\b|ALTER\s+TABLE\s+)(?:public\.)?([a-zA-Z_][\w]*)/gis,
    )) {
      organizationTables.add(match[1].toLowerCase());
    }
  }
}

const missing = [...enabled].filter((table) => !policies.has(table));
console.log(`RLS-enabled tables: ${enabled.size}`);
console.log(`Tables with declared policies: ${policies.size}`);
console.log(`Organization-aware migration tables: ${organizationTables.size}`);
for (const table of [...enabled].sort()) {
  console.log(`- ${table}: ${policies.get(table) ?? 0} policy declaration(s)`);
}
if (missing.length > 0) {
  console.error(`Missing CREATE POLICY declarations for: ${missing.join(", ")}`);
  process.exit(1);
}
if (enabled.size === 0) {
  console.error("No RLS-enabled tables were found; refusing a false-positive security check.");
  process.exit(1);
}
