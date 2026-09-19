import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { pingLayerFn, LAYER_MODEL_CATALOG, type LayerPingResult } from "@/lib/gateway.functions";
import { LAYERS } from "@/lib/secp-data";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Soteria SECP" },
      {
        name: "description",
        content:
          "Enterprise administration: tenants, autonomy policy, security posture, model routing, and integration surface.",
      },
      { property: "og:title", content: "Administration — Soteria SECP" },
      {
        property: "og:description",
        content: "Configure the cognitive operating system for your enterprise.",
      },
    ],
  }),
  component: AdminPage,
});

const AUTONOMY_POLICY = [
  {
    level: 1,
    label: "Recommend only",
    scope: "All new specialist archetypes on first deployment.",
    enabled: true,
  },
  {
    level: 2,
    label: "Execute on approval",
    scope: "Finance, Legal, HR specialists in production.",
    enabled: true,
  },
  {
    level: 3,
    label: "Autonomous within policy",
    scope: "Data, Software, Operations specialists with clean 30-day audit.",
    enabled: true,
  },
  {
    level: 4,
    label: "End-to-end autonomous",
    scope: "Reserved. No agents currently elevated.",
    enabled: false,
  },
];

const INTEGRATIONS = [
  {
    code: "INT-01",
    name: "Salesforce CRM",
    status: "connected",
    surface: "Customer graph, opportunity ledger",
  },
  { code: "INT-02", name: "SAP S/4HANA", status: "connected", surface: "GL, AP/AR, materials" },
  { code: "INT-03", name: "Snowflake", status: "connected", surface: "Warehouse, model features" },
  { code: "INT-04", name: "Workday", status: "connected", surface: "People graph, comp bands" },
  { code: "INT-05", name: "Atlassian", status: "connected", surface: "Delivery telemetry" },
  { code: "INT-06", name: "Slack", status: "connected", surface: "Directive intake, notification" },
  { code: "INT-07", name: "AWS", status: "connected", surface: "Runtime, secrets, storage" },
  { code: "INT-08", name: "Okta SSO", status: "connected", surface: "Identity, SCIM" },
  { code: "INT-09", name: "GitHub", status: "connected", surface: "Codebase, code review agents" },
  { code: "INT-10", name: "DocuSign", status: "pending", surface: "Contract execution" },
];

function AdminPage() {
  const ping = useServerFn(pingLayerFn);
  const [results, setResults] = useState<
    Record<string, LayerPingResult | { pending: true } | undefined>
  >({});
  const [running, setRunning] = useState(false);

  async function pingOne(layer: (typeof LAYERS)[number]["id"]) {
    setResults((r) => ({ ...r, [layer]: { pending: true } }));
    const res = await ping({ data: { layer } });
    setResults((r) => ({ ...r, [layer]: res }));
    return res;
  }
  async function pingAll() {
    setRunning(true);
    for (const l of LAYERS) {
      await pingOne(l.id);
    }
    setRunning(false);
  }

  return (
    <AppShell title="Enterprise Administration" crumb="AD · Tenant & policy">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Tenants" value="1" />
          <StatChip label="Seats provisioned" value="248" tone="accent" />
          <StatChip label="Integrations live" value="9 / 10" tone="signal" />
          <StatChip label="Model spend (24h)" value="$4,218" tone="warn" />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionHeading code="AD.0" title="AI Gateway · Model routing & connectivity" />
            <button
              type="button"
              onClick={pingAll}
              disabled={running}
              className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-40"
            >
              {running ? "▸ Pinging all layers…" : "▸ Validate every layer"}
            </button>
          </div>
          <div className="bg-surface border border-border rounded-sm">
            <div className="grid grid-cols-[80px_1fr_1fr_120px_120px_140px] gap-4 px-5 py-3 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Layer</span>
              <span>Model (Lovable AI Gateway)</span>
              <span>Reply</span>
              <span>Latency</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            {LAYERS.map((l) => {
              const r = results[l.id];
              const pending = r && "pending" in r;
              const done = r && !("pending" in r);
              const ok = done && (r as LayerPingResult).ok;
              const res = done ? (r as LayerPingResult) : null;
              return (
                <div
                  key={l.id}
                  className="grid grid-cols-[80px_1fr_1fr_120px_120px_140px] gap-4 px-5 py-3 border-b border-border last:border-b-0 items-center"
                >
                  <span className="font-mono text-[10px] text-accent">{l.code}</span>
                  <div>
                    <div className="text-sm font-bold">{l.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {LAYER_MODEL_CATALOG[l.id]}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 min-h-[16px]">
                    {res ? (res.ok ? res.reply : res.error) : pending ? "…" : "— not yet validated"}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {res ? `${res.latency_ms} ms` : pending ? "…" : "—"}
                  </div>
                  <span
                    className={
                      "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 w-fit " +
                      (pending
                        ? "text-accent bg-accent/10"
                        : ok
                          ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                          : done
                            ? "text-[color:var(--danger)] bg-[color:var(--danger)]/10"
                            : "text-muted-foreground bg-secondary")
                    }
                  >
                    {pending ? "pinging" : ok ? "connected" : done ? "failed" : "unchecked"}
                  </span>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => pingOne(l.id)}
                      disabled={pending || running}
                      className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 border border-border text-muted-foreground hover:text-primary hover:border-primary/60 disabled:opacity-40"
                    >
                      Ping
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] font-mono text-muted-foreground">
            Ping issues a live request through the Lovable AI Gateway with reasoning off and records
            latency per layer.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-6">
          <div>
            <SectionHeading code="AD.1" title="Autonomy Policy" />
            <div className="bg-surface border border-border rounded-sm">
              {AUTONOMY_POLICY.map((p) => (
                <div
                  key={p.level}
                  className="px-5 py-4 border-b border-border last:border-b-0 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-primary">A{p.level}</span>
                      <span className="text-sm font-bold">{p.label}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{p.scope}</div>
                  </div>
                  <span
                    className={
                      "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 shrink-0 " +
                      (p.enabled
                        ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                        : "text-muted-foreground bg-secondary")
                    }
                  >
                    {p.enabled ? "ENABLED" : "LOCKED"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading code="AD.2" title="Model Routing" />
            <div className="bg-surface border border-border rounded-sm p-5 space-y-4">
              <div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Reasoning tier
                </div>
                <div className="text-sm font-bold mt-1">
                  Frontier reasoning model · fallback: workhorse
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Used by executive council & consultant deliberations.
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Specialist tier
                </div>
                <div className="text-sm font-bold mt-1">Workhorse model · task-tuned adapters</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Used by 42 specialist archetypes across 7 departments.
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Governance tier
                </div>
                <div className="text-sm font-bold mt-1">Independent verification model</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Separated from reasoning path for defensible audit.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading code="AD.3" title="Enterprise Integrations" />
          <div className="grid grid-cols-2 gap-3">
            {INTEGRATIONS.map((i) => (
              <div
                key={i.code}
                className="bg-surface border border-border rounded-sm px-4 py-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] text-accent">{i.code}</span>
                    <span className="text-sm font-bold">{i.name}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{i.surface}</div>
                </div>
                <span
                  className={
                    "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 shrink-0 " +
                    (i.status === "connected"
                      ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                      : "text-[color:var(--warn)] bg-[color:var(--warn)]/10")
                  }
                >
                  {i.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-6">
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="AD.4" title="Security posture" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li>· SSO enforced (Okta, SAML 2.0)</li>
              <li>· Data residency: US-East, EU-Central</li>
              <li>· Reasoning-trace retention 7y</li>
              <li>· Independent kill-switch per specialist</li>
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="AD.5" title="Continuous learning" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li>· Feedback loops: 24 active</li>
              <li>· Outcome-linked scoring on every request</li>
              <li>· Policy delta review every Monday 09:00</li>
              <li>· No model weights leave tenant boundary</li>
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-sm p-5">
            <SectionHeading code="AD.6" title="Extensibility" />
            <ul className="text-[11px] text-muted-foreground space-y-2">
              <li>· Add new domain consultant archetype</li>
              <li>· Define specialist SLA & escalation path</li>
              <li>· Author custom validation gate</li>
              <li>· Publish outcome report template</li>
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
