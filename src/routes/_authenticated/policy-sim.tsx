import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { LAYERS, REQUESTS } from "@/lib/secp-data";

export const Route = createFileRoute("/_authenticated/policy-sim")({
  head: () => ({
    meta: [
      { title: "Policy Simulator — Soteria SECP" },
      { name: "description", content: "Simulate per-layer access rules against a sample knowledge source and directive to visualize the blast radius before shipping policy." },
      { property: "og:title", content: "Policy Simulator — Soteria SECP" },
      { property: "og:description", content: "See exactly how a policy change would gate reasoning across L1–L6." },
    ],
  }),
  component: PolicySimPage,
});

type Role = "admin" | "operator" | "viewer";

type Sensitivity = "public" | "internal" | "confidential" | "restricted";

type Source = {
  id: string;
  name: string;
  kind: string;
  sensitivity: Sensitivity;
  region: "US" | "EU" | "APAC";
  containsPii: boolean;
  tags: string[];
};

const SOURCES: Source[] = [
  { id: "KS-001", name: "Global brand system v14.pdf", kind: "policy", sensitivity: "internal", region: "US", containsPii: false, tags: ["brand", "marketing"] },
  { id: "KS-047", name: "SEA supplier concentration ledger.csv", kind: "dataset", sensitivity: "confidential", region: "APAC", containsPii: false, tags: ["risk", "sea-expansion"] },
  { id: "KS-118", name: "EU workforce compensation snapshot Q3.xlsx", kind: "dataset", sensitivity: "restricted", region: "EU", containsPii: true, tags: ["hr", "gdpr", "comp"] },
  { id: "KS-204", name: "Product roadmap 2026-2027.md", kind: "document", sensitivity: "restricted", region: "US", containsPii: false, tags: ["strategy", "board"] },
  { id: "KS-311", name: "Public sustainability report.pdf", kind: "document", sensitivity: "public", region: "US", containsPii: false, tags: ["disclosure"] },
];

type LayerRule = {
  code: string;
  name: string;
  read: Role[];
  write: Role[];
  maxSensitivity: Sensitivity;
  allowedRegions: ("US" | "EU" | "APAC")[];
  piiAllowed: boolean;
};

const DEFAULT_RULES: LayerRule[] = [
  { code: "L1", name: "Organizational", read: ["admin", "operator", "viewer"], write: ["admin", "operator"], maxSensitivity: "restricted", allowedRegions: ["US", "EU", "APAC"], piiAllowed: true },
  { code: "L2", name: "Executive", read: ["admin", "operator"], write: ["admin"], maxSensitivity: "restricted", allowedRegions: ["US", "EU", "APAC"], piiAllowed: false },
  { code: "L3", name: "Consultant", read: ["admin", "operator"], write: ["admin", "operator"], maxSensitivity: "confidential", allowedRegions: ["US", "EU", "APAC"], piiAllowed: false },
  { code: "L4", name: "Program", read: ["admin", "operator", "viewer"], write: ["admin", "operator"], maxSensitivity: "confidential", allowedRegions: ["US", "EU", "APAC"], piiAllowed: false },
  { code: "L5", name: "Workforce", read: ["admin", "operator"], write: ["admin", "operator"], maxSensitivity: "internal", allowedRegions: ["US", "EU"], piiAllowed: false },
  { code: "L6", name: "Governance", read: ["admin", "operator", "viewer"], write: ["admin"], maxSensitivity: "restricted", allowedRegions: ["US", "EU", "APAC"], piiAllowed: true },
];

const SENSITIVITY_ORDER: Sensitivity[] = ["public", "internal", "confidential", "restricted"];
const ROLES: Role[] = ["admin", "operator", "viewer"];
const REGIONS: ("US" | "EU" | "APAC")[] = ["US", "EU", "APAC"];

function rankSensitivity(s: Sensitivity) {
  return SENSITIVITY_ORDER.indexOf(s);
}

type Verdict = { code: string; layer: string; verdict: "allow" | "redact" | "block"; reasons: string[] };

function evaluate(source: Source, actor: Role, rules: LayerRule[]): Verdict[] {
  return rules.map((rule) => {
    const reasons: string[] = [];
    let verdict: Verdict["verdict"] = "allow";

    if (!rule.read.includes(actor)) {
      reasons.push(`Actor role "${actor}" not in read set (${rule.read.join(", ")}).`);
      verdict = "block";
    }
    if (rankSensitivity(source.sensitivity) > rankSensitivity(rule.maxSensitivity)) {
      reasons.push(`Source sensitivity ${source.sensitivity} exceeds layer cap ${rule.maxSensitivity}.`);
      verdict = "block";
    }
    if (!rule.allowedRegions.includes(source.region)) {
      reasons.push(`Source region ${source.region} not permitted at layer.`);
      verdict = "block";
    }
    if (source.containsPii && !rule.piiAllowed && verdict !== "block") {
      reasons.push("Source carries PII; layer requires redaction on ingest.");
      verdict = "redact";
    }
    if (reasons.length === 0) reasons.push("All gates satisfied.");
    return { code: rule.code, layer: rule.name, verdict, reasons };
  });
}

function PolicySimPage() {
  const [sourceId, setSourceId] = useState(SOURCES[2].id);
  const [requestId, setRequestId] = useState(REQUESTS[0].id);
  const [actor, setActor] = useState<Role>("operator");
  const [rules, setRules] = useState<LayerRule[]>(DEFAULT_RULES);

  const source = SOURCES.find((s) => s.id === sourceId)!;
  const request = REQUESTS.find((r) => r.id === requestId)!;
  const verdicts = useMemo(() => evaluate(source, actor, rules), [source, actor, rules]);

  const layersTouched = useMemo(() => {
    const meta = LAYERS.reduce<Record<string, string>>((m, l) => ((m[l.id] = l.code), m), {});
    return Array.from(new Set(request.steps.map((s) => meta[s.layer]))).filter(Boolean);
  }, [request]);

  const impacted = useMemo(
    () => verdicts.filter((v) => layersTouched.includes(v.code)),
    [verdicts, layersTouched],
  );

  const blocks = impacted.filter((v) => v.verdict === "block").length;
  const redactions = impacted.filter((v) => v.verdict === "redact").length;
  const canDeliver = blocks === 0;

  function toggleRole(code: string, role: Role) {
    setRules((prev) =>
      prev.map((r) =>
        r.code === code
          ? { ...r, read: r.read.includes(role) ? r.read.filter((x) => x !== role) : [...r.read, role] }
          : r,
      ),
    );
  }
  function setMaxSens(code: string, s: Sensitivity) {
    setRules((prev) => prev.map((r) => (r.code === code ? { ...r, maxSensitivity: s } : r)));
  }
  function toggleRegion(code: string, region: "US" | "EU" | "APAC") {
    setRules((prev) =>
      prev.map((r) =>
        r.code === code
          ? {
              ...r,
              allowedRegions: r.allowedRegions.includes(region)
                ? r.allowedRegions.filter((x) => x !== region)
                : [...r.allowedRegions, region],
            }
          : r,
      ),
    );
  }
  function togglePii(code: string) {
    setRules((prev) => prev.map((r) => (r.code === code ? { ...r, piiAllowed: !r.piiAllowed } : r)));
  }

  return (
    <AppShell title="Policy Simulator" crumb="PS · Access blast-radius">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Layers evaluated" value={String(rules.length)} />
          <StatChip label="Layers touched by request" value={String(layersTouched.length)} tone="accent" />
          <StatChip label="Blocks on path" value={String(blocks)} tone={blocks ? "danger" : "signal"} />
          <StatChip label="Redactions on path" value={String(redactions)} tone={redactions ? "warn" : "signal"} />
        </section>

        <section className="grid grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-sm p-5">
            <div className="font-mono text-[10px] text-accent mb-2">PS.1 · SAMPLE KNOWLEDGE SOURCE</div>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm mb-3"
            >
              {SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div>Kind · <span className="text-foreground">{source.kind}</span></div>
              <div>Region · <span className="text-foreground">{source.region}</span></div>
              <div>Sensitivity · <span className="text-foreground">{source.sensitivity}</span></div>
              <div>PII · <span className={source.containsPii ? "text-[color:var(--warn)]" : "text-foreground"}>{source.containsPii ? "present" : "none"}</span></div>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {source.tags.map((t) => (
                <span key={t} className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-border text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-sm p-5">
            <div className="font-mono text-[10px] text-accent mb-2">PS.2 · SAMPLE DIRECTIVE</div>
            <select
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm mb-3"
            >
              {REQUESTS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} · {r.title}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground line-clamp-3">{request.brief}</p>
            <div className="flex flex-wrap gap-1 mt-3">
              {layersTouched.map((code) => (
                <span key={code} className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-primary/40 text-primary bg-primary/10">
                  {code}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-sm p-5">
            <div className="font-mono text-[10px] text-accent mb-2">PS.3 · ACTOR ROLE</div>
            <div className="flex gap-1 mb-3">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActor(r)}
                  className={
                    "flex-1 font-mono text-[10px] uppercase tracking-widest px-2 py-2 border transition-colors " +
                    (actor === r
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:text-foreground")
                  }
                >
                  {r}
                </button>
              ))}
            </div>
            <div
              className={
                "border rounded-sm p-3 text-[11px] font-mono " +
                (canDeliver
                  ? "border-[color:var(--signal)]/40 bg-[color:var(--signal)]/5 text-[color:var(--signal)]"
                  : "border-[color:var(--danger)]/40 bg-[color:var(--danger)]/5 text-[color:var(--danger)]")
              }
            >
              {canDeliver
                ? "PATH CLEAR · Directive can reach delivery with current policy."
                : `HALTED · ${blocks} layer${blocks === 1 ? "" : "s"} on the reasoning path would block this source.`}
              {redactions > 0 && canDeliver && ` ${redactions} layer(s) would apply redaction on ingest.`}
            </div>
          </div>
        </section>

        <section>
          <SectionHeading code="PS.4" title="Per-layer verdict against reasoning path" />
          <div className="bg-surface border border-border rounded-sm">
            {verdicts.map((v) => {
              const onPath = layersTouched.includes(v.code);
              return (
                <div
                  key={v.code}
                  className={
                    "grid grid-cols-[80px_1fr_120px_2fr] gap-4 px-5 py-4 border-b border-border last:border-b-0 items-start " +
                    (onPath ? "" : "opacity-50")
                  }
                >
                  <div>
                    <span className="font-mono text-[10px] text-primary">{v.code}</span>
                    <div className="text-sm font-bold mt-0.5">{v.layer}</div>
                    {!onPath && (
                      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Off path</div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span
                      className={
                        "font-mono text-[10px] uppercase tracking-widest px-2 py-1 border " +
                        (v.verdict === "allow"
                          ? "text-[color:var(--signal)] border-[color:var(--signal)]/40 bg-[color:var(--signal)]/10"
                          : v.verdict === "redact"
                            ? "text-[color:var(--warn)] border-[color:var(--warn)]/40 bg-[color:var(--warn)]/10"
                            : "text-[color:var(--danger)] border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10")
                      }
                    >
                      {v.verdict}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    On path · <span className="text-foreground">{onPath ? "yes" : "no"}</span>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1">
                    {v.reasons.map((r) => (
                      <li key={r}>· {r}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            code="PS.5"
            title="Editable per-layer access rules"
            action={
              <button
                type="button"
                onClick={() => setRules(DEFAULT_RULES)}
                className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 border border-border text-muted-foreground hover:text-primary hover:border-primary/60"
              >
                Reset to baseline
              </button>
            }
          />
          <div className="grid grid-cols-2 gap-3">
            {rules.map((r) => (
              <div key={r.code} className="bg-surface border border-border rounded-sm p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="font-mono text-[10px] text-primary">{r.code}</span>
                    <span className="ml-2 text-sm font-bold">{r.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePii(r.code)}
                    className={
                      "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border " +
                      (r.piiAllowed
                        ? "text-[color:var(--warn)] border-[color:var(--warn)]/40 bg-[color:var(--warn)]/10"
                        : "text-muted-foreground border-border hover:text-foreground")
                    }
                  >
                    PII {r.piiAllowed ? "allowed" : "blocked"}
                  </button>
                </div>
                <div className="space-y-3 text-[11px]">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Read roles</div>
                    <div className="flex gap-1">
                      {ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(r.code, role)}
                          className={
                            "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors " +
                            (r.read.includes(role)
                              ? "border-primary text-primary bg-primary/10"
                              : "border-border text-muted-foreground hover:text-foreground")
                          }
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Max sensitivity</div>
                    <div className="flex gap-1">
                      {SENSITIVITY_ORDER.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setMaxSens(r.code, s)}
                          className={
                            "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors " +
                            (r.maxSensitivity === s
                              ? "border-primary text-primary bg-primary/10"
                              : "border-border text-muted-foreground hover:text-foreground")
                          }
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Allowed regions</div>
                    <div className="flex gap-1">
                      {REGIONS.map((region) => (
                        <button
                          key={region}
                          type="button"
                          onClick={() => toggleRegion(r.code, region)}
                          className={
                            "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors " +
                            (r.allowedRegions.includes(region)
                              ? "border-primary text-primary bg-primary/10"
                              : "border-border text-muted-foreground hover:text-foreground")
                          }
                        >
                          {region}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-3">
            Simulation only · nothing here mutates live enforcement. Ship changes through governance review.
          </p>
        </section>
      </div>
    </AppShell>
  );
}