import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { LAYERS } from "@/lib/secp-data";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({
    meta: [
      { title: "Security & Compliance — Soteria SECP" },
      { name: "description", content: "Data residency, PII redaction, per-layer access policies, and SOC 2-style evidence for the cognitive operating system." },
      { property: "og:title", content: "Security & Compliance — Soteria SECP" },
      { property: "og:description", content: "Defensible posture across every intelligence layer." },
    ],
  }),
  component: SecurityPage,
});

type Residency = {
  code: string;
  region: string;
  jurisdiction: string;
  bytes: string;
  status: "primary" | "replica" | "restricted";
  workloads: string[];
};

const RESIDENCY: Residency[] = [
  { code: "R-US-EAST", region: "us-east-1", jurisdiction: "United States · FedRAMP Moderate", bytes: "142.8 TB", status: "primary", workloads: ["Reasoning trace", "Executive council", "Knowledge graph"] },
  { code: "R-EU-CENT", region: "eu-central-1", jurisdiction: "Germany · GDPR + Schrems II", bytes: "88.4 TB", status: "primary", workloads: ["EU tenant knowledge", "Consultant memories", "Payroll specialists"] },
  { code: "R-EU-WEST", region: "eu-west-2", jurisdiction: "United Kingdom · UK GDPR", bytes: "12.1 TB", status: "replica", workloads: ["Disaster recovery", "Audit archive"] },
  { code: "R-AP-SE", region: "ap-southeast-1", jurisdiction: "Singapore · MTCS L3", bytes: "6.7 TB", status: "restricted", workloads: ["APAC tenant staging (opt-in)"] },
];

type PiiCategory = {
  code: string;
  name: string;
  detector: string;
  mode: "redact" | "tokenize" | "block";
  hits24h: number;
};

const PII_INITIAL: PiiCategory[] = [
  { code: "PII-01", name: "Government identifiers", detector: "SSN, NI, Aadhaar, passport", mode: "redact", hits24h: 214 },
  { code: "PII-02", name: "Payment credentials", detector: "PAN, IBAN, SWIFT", mode: "tokenize", hits24h: 87 },
  { code: "PII-03", name: "Health information", detector: "ICD-10, HL7 segments", mode: "block", hits24h: 12 },
  { code: "PII-04", name: "Contact records", detector: "Email, phone, postal", mode: "redact", hits24h: 1804 },
  { code: "PII-05", name: "Credentials & secrets", detector: "API keys, JWT, private keys", mode: "block", hits24h: 3 },
  { code: "PII-06", name: "Employment records", detector: "Compensation, performance, tenure", mode: "tokenize", hits24h: 46 },
];

type LayerAccess = {
  code: string;
  name: string;
  read: string[];
  write: string[];
  autonomyCap: "A1" | "A2" | "A3" | "A4";
  encryption: string;
};

const LAYER_ACCESS: LayerAccess[] = [
  { code: "L1", name: "Organizational", read: ["admin", "operator", "viewer"], write: ["admin", "operator"], autonomyCap: "A3", encryption: "AES-256 · per-tenant KMS" },
  { code: "L2", name: "Executive", read: ["admin", "operator"], write: ["admin"], autonomyCap: "A2", encryption: "AES-256 · HSM-wrapped" },
  { code: "L3", name: "Consultant", read: ["admin", "operator"], write: ["admin", "operator"], autonomyCap: "A3", encryption: "AES-256 · per-tenant KMS" },
  { code: "L4", name: "Program", read: ["admin", "operator", "viewer"], write: ["admin", "operator"], autonomyCap: "A3", encryption: "AES-256 · per-tenant KMS" },
  { code: "L5", name: "Workforce", read: ["admin", "operator"], write: ["admin", "operator"], autonomyCap: "A4", encryption: "AES-256 · per-tenant KMS" },
  { code: "L6", name: "Governance", read: ["admin", "operator", "viewer"], write: ["admin"], autonomyCap: "A1", encryption: "AES-256 · HSM + WORM archive" },
];

type Control = {
  code: string;
  domain: "Security" | "Availability" | "Confidentiality" | "Processing Integrity" | "Privacy";
  name: string;
  owner: string;
  status: "operating" | "monitoring" | "remediation";
  lastEvidence: string;
  evidence: string;
};

const CONTROLS: Control[] = [
  { code: "CC1.2", domain: "Security", name: "Board oversight of cognition risk", owner: "Governance council", status: "operating", lastEvidence: "2026-07-18", evidence: "Quarterly minutes, autonomy policy diff" },
  { code: "CC6.1", domain: "Security", name: "Logical access to reasoning traces", owner: "Platform SRE", status: "operating", lastEvidence: "2026-07-27", evidence: "Okta SCIM sync, JIT session log" },
  { code: "CC6.6", domain: "Security", name: "External network boundary", owner: "Platform SRE", status: "operating", lastEvidence: "2026-07-26", evidence: "VPC flow logs, WAF rulepack v42" },
  { code: "CC7.2", domain: "Security", name: "Anomaly detection on specialist behavior", owner: "Detection eng", status: "monitoring", lastEvidence: "2026-07-28", evidence: "Behavioral baseline, 3 tuned alerts" },
  { code: "A1.2", domain: "Availability", name: "Multi-region failover for reasoning tier", owner: "Platform SRE", status: "operating", lastEvidence: "2026-07-14", evidence: "GameDay report GD-26-07" },
  { code: "C1.1", domain: "Confidentiality", name: "PII redaction on ingest", owner: "Data platform", status: "operating", lastEvidence: "2026-07-28", evidence: "L1 ingestion detector metrics" },
  { code: "PI1.4", domain: "Processing Integrity", name: "Reasoning reproducibility harness", owner: "Model platform", status: "operating", lastEvidence: "2026-07-25", evidence: "12-stage replay attestations" },
  { code: "P4.2", domain: "Privacy", name: "Subject access & erasure", owner: "Privacy office", status: "remediation", lastEvidence: "2026-07-11", evidence: "DSR queue: 2 open beyond SLA" },
];

function SecurityPage() {
  const [pii, setPii] = useState(PII_INITIAL);
  const [scope, setScope] = useState<"all" | Control["domain"]>("all");

  const filtered = useMemo(
    () => (scope === "all" ? CONTROLS : CONTROLS.filter((c) => c.domain === scope)),
    [scope],
  );
  const operating = CONTROLS.filter((c) => c.status === "operating").length;
  const remediation = CONTROLS.filter((c) => c.status === "remediation").length;
  const hitsTotal = pii.reduce((n, p) => n + p.hits24h, 0);

  return (
    <AppShell title="Security & Compliance" crumb="SC · Posture & evidence">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="SOC 2 controls operating" value={`${operating} / ${CONTROLS.length}`} tone="signal" />
          <StatChip label="Remediation open" value={String(remediation)} tone={remediation ? "warn" : "signal"} />
          <StatChip label="PII events (24h)" value={hitsTotal.toLocaleString()} tone="accent" />
          <StatChip label="Residency regions" value={String(RESIDENCY.length)} />
        </section>

        <section>
          <SectionHeading code="SC.1" title="Data residency & sovereignty" />
          <div className="grid grid-cols-2 gap-3">
            {RESIDENCY.map((r) => (
              <div key={r.code} className="bg-surface border border-border rounded-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] text-accent">{r.code}</span>
                      <span className="text-sm font-bold">{r.region}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{r.jurisdiction}</div>
                  </div>
                  <span
                    className={
                      "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 " +
                      (r.status === "primary"
                        ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                        : r.status === "replica"
                          ? "text-accent bg-accent/10"
                          : "text-[color:var(--warn)] bg-[color:var(--warn)]/10")
                    }
                  >
                    {r.status}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] text-muted-foreground mb-2">
                  <span>Encrypted at rest</span>
                  <span className="font-mono text-foreground">{r.bytes}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.workloads.map((w) => (
                    <span key={w} className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border border-border text-muted-foreground">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading code="SC.2" title="PII redaction policy" />
          <div className="bg-surface border border-border rounded-sm">
            <div className="grid grid-cols-[80px_1fr_1fr_180px_120px] gap-4 px-5 py-3 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Code</span>
              <span>Category</span>
              <span>Detector</span>
              <span>Handling mode</span>
              <span className="text-right">Hits · 24h</span>
            </div>
            {pii.map((p) => (
              <div key={p.code} className="grid grid-cols-[80px_1fr_1fr_180px_120px] gap-4 px-5 py-3 border-b border-border last:border-b-0 items-center">
                <span className="font-mono text-[10px] text-accent">{p.code}</span>
                <span className="text-sm font-bold">{p.name}</span>
                <span className="text-[11px] text-muted-foreground">{p.detector}</span>
                <div className="flex gap-1">
                  {(["redact", "tokenize", "block"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPii((prev) => prev.map((row) => (row.code === p.code ? { ...row, mode } : row)))}
                      className={
                        "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors " +
                        (p.mode === mode
                          ? "border-primary text-primary bg-primary/10"
                          : "border-border text-muted-foreground hover:text-foreground")
                      }
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-xs text-right text-foreground">{p.hits24h.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-2">
            Handling mode applies at L1 ingest and re-evaluates on every specialist context assembly. Blocked matches halt the pipeline and open a governance event.
          </p>
        </section>

        <section>
          <SectionHeading code="SC.3" title="Per-layer access policy" />
          <div className="bg-surface border border-border rounded-sm overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_1.4fr_1.4fr_100px_1.4fr] gap-4 px-5 py-3 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Layer</span>
              <span>Name</span>
              <span>Read roles</span>
              <span>Write roles</span>
              <span>Autonomy cap</span>
              <span>Encryption</span>
            </div>
            {LAYER_ACCESS.map((l) => {
              const meta = LAYERS.find((m) => m.code === l.code);
              return (
                <div key={l.code} className="grid grid-cols-[80px_1fr_1.4fr_1.4fr_100px_1.4fr] gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center">
                  <span className="font-mono text-[10px] text-primary">{l.code}</span>
                  <div>
                    <div className="text-sm font-bold">{l.name}</div>
                    <div className="text-[10px] text-muted-foreground">{meta?.role}</div>
                  </div>
                  <RoleTags roles={l.read} />
                  <RoleTags roles={l.write} />
                  <span className="font-mono text-[10px] text-accent">{l.autonomyCap}</span>
                  <span className="text-[11px] text-muted-foreground">{l.encryption}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[10px] text-accent">SC.4</span>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">SOC 2 evidence register</h2>
            </div>
            <div className="flex gap-1">
              {(["all", "Security", "Availability", "Confidentiality", "Processing Integrity", "Privacy"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={
                    "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors " +
                    (scope === s
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:text-foreground")
                  }
                >
                  {s === "all" ? "All TSC" : s}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-sm">
            {filtered.map((c) => (
              <div key={c.code} className="grid grid-cols-[90px_140px_1fr_180px_120px_140px] gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center">
                <span className="font-mono text-[10px] text-accent">{c.code}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{c.domain}</span>
                <div>
                  <div className="text-sm font-bold">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{c.evidence}</div>
                </div>
                <span className="text-[11px] text-muted-foreground">Owner · <span className="text-foreground">{c.owner}</span></span>
                <span className="font-mono text-[10px] text-muted-foreground">{c.lastEvidence}</span>
                <span
                  className={
                    "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 justify-self-end " +
                    (c.status === "operating"
                      ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                      : c.status === "monitoring"
                        ? "text-accent bg-accent/10"
                        : "text-[color:var(--warn)] bg-[color:var(--warn)]/10")
                  }
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-6">
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="SC.5" title="Attestations" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li>· SOC 2 Type II — refresh 2026-Q4</li>
              <li>· ISO 27001:2022 — surveillance audit passed 2026-05</li>
              <li>· ISO 42001 AI mgmt — certified 2026-03</li>
              <li>· HIPAA BAA available on request</li>
              <li>· EU AI Act Article 9 risk register maintained</li>
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="SC.6" title="Incident readiness" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li>· MTTD 3m 12s · MTTR 47m (30d)</li>
              <li>· 24×7 on-call across 3 regions</li>
              <li>· Kill-switch per specialist archetype</li>
              <li>· Tabletop cadence: monthly</li>
              <li>· Customer notification SLA: 24h</li>
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="SC.7" title="Reasoning transparency" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li>· Every deliverable ships a signed trace</li>
              <li>· 7-year WORM retention on L6 events</li>
              <li>· Independent verifier separated from reasoning path</li>
              <li>· Model weights never leave tenant boundary</li>
              <li>· Prompt & tool logs hashed to append-only ledger</li>
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function RoleTags({ roles }: { roles: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <span
          key={r}
          className={
            "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border " +
            (r === "admin"
              ? "text-primary border-primary/40 bg-primary/10"
              : r === "operator"
                ? "text-accent border-accent/40 bg-accent/10"
                : "text-muted-foreground border-border")
          }
        >
          {r}
        </span>
      ))}
    </div>
  );
}