import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { CONSULTANTS } from "@/lib/secp-data";
import { listEngagementsFn, runEngagementFn } from "@/lib/consulting.functions";
import { listProgramsFn } from "@/lib/program.functions";

export const Route = createFileRoute("/_authenticated/consultants")({
  head: () => ({
    meta: [
      { title: "Consultant Tier — Soteria SECP" },
      {
        name: "description",
        content:
          "Commission domain consultants to turn directives into solution architectures with specialist requisitions and measurable acceptance criteria.",
      },
      { property: "og:title", content: "Consultant Tier — Soteria SECP" },
      {
        property: "og:description",
        content: "L3 engagement workflow — domain expertise applied to live directives.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultantsPage,
});

function ConsultantsPage() {
  const qc = useQueryClient();
  const listPrograms = useServerFn(listProgramsFn);
  const listEngagements = useServerFn(listEngagementsFn);
  const runEngagement = useServerFn(runEngagementFn);

  const [directive, setDirective] = useState<string>("");
  const [open, setOpen] = useState<string | null>(null);

  const directives = useQuery({ queryKey: ["secp", "programs"], queryFn: () => listPrograms() });
  const engagements = useQuery({
    queryKey: ["secp", "engagements"],
    queryFn: () => listEngagements(),
  });

  const active = directive || directives.data?.[0]?.request_id || "";

  const engage = useMutation({
    mutationFn: (c: (typeof CONSULTANTS)[number]) =>
      runEngagement({
        data: {
          requestId: active,
          consultantId: c.id,
          consultantName: c.name,
          domain: c.domain,
          expertise: c.expertise,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secp", "engagements"] });
      qc.invalidateQueries({ queryKey: ["secp", "artifacts"] });
    },
  });

  const rows = engagements.data ?? [];
  const forActive = rows.filter((e) => e.request_id === active);

  return (
    <AppShell title="Consultant Tier" crumb="L3 · Domain expertise">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Domain consultants" value={String(CONSULTANTS.length)} />
          <StatChip label="Engagements delivered" value={String(rows.length)} tone="accent" />
          <StatChip label="On selected directive" value={String(forActive.length)} tone="signal" />
          <StatChip label="Open directives" value={String(directives.data?.length ?? 0)} />
        </section>

        <section>
          <SectionHeading code="L3.1" title="Engagement Target" />
          {directives.isLoading ? (
            <div className="text-xs font-mono text-muted-foreground">Loading directives…</div>
          ) : (directives.data ?? []).length === 0 ? (
            <div className="bg-surface border border-border rounded-sm p-6 text-sm text-muted-foreground">
              No directives submitted yet. Submit one from Requests, then commission a consultant
              here.
            </div>
          ) : (
            <select
              value={active}
              onChange={(e) => setDirective(e.target.value)}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm w-full max-w-xl"
            >
              {(directives.data ?? []).map((d) => (
                <option key={d.request_id} value={d.request_id}>
                  {d.request_id} — {d.title}
                </option>
              ))}
            </select>
          )}
          {engage.isError ? (
            <div className="mt-3 text-[11px] font-mono text-[color:var(--danger)]">
              Engagement failed: {(engage.error as Error).message}
            </div>
          ) : null}
        </section>

        <section>
          <SectionHeading code="L3.2" title="Consultant Catalog" />
          <div className="grid grid-cols-3 gap-3">
            {CONSULTANTS.map((c) => {
              const count = forActive.filter((e) => e.consultant.startsWith(c.id)).length;
              return (
                <div
                  key={c.id}
                  className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[10px] text-accent">{c.id}</div>
                      <div className="text-sm font-bold tracking-tight">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        {c.domain}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ×{c.engagements + count}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.expertise.map((x) => (
                      <span
                        key={x}
                        className="text-[9px] font-mono uppercase tracking-widest border border-border px-1.5 py-0.5 text-muted-foreground"
                      >
                        {x}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => engage.mutate(c)}
                    disabled={!active || engage.isPending}
                    className="mt-auto text-[10px] font-mono uppercase tracking-widest border border-primary/40 text-primary bg-primary/10 px-2 py-1.5 disabled:opacity-40"
                  >
                    {engage.isPending && engage.variables?.id === c.id
                      ? "Engaging…"
                      : "Commission engagement"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            code="L3.3"
            title="Engagement Ledger"
            action={
              <span className="font-mono text-[10px] text-muted-foreground">
                {rows.length} deliverables
              </span>
            }
          />
          {rows.length === 0 ? (
            <div className="bg-surface border border-border rounded-sm p-6 text-sm text-muted-foreground">
              No engagements yet. Commission a consultant above to produce a solution architecture.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((e) => (
                <div
                  key={e.id}
                  className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] text-accent">{e.consultant}</div>
                      <div className="text-sm font-bold tracking-tight">{e.request_title}</div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {e.domain} · sha256 {e.checksum.slice(0, 12)}… ·{" "}
                        {new Date(e.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => setOpen(open === e.id ? null : e.id)}
                      className="shrink-0 text-[10px] font-mono uppercase tracking-widest border border-border px-2 py-1 hover:border-foreground/40"
                    >
                      {open === e.id ? "Hide" : "Open"}
                    </button>
                  </div>
                  {open === e.id ? (
                    <pre className="bg-secondary/30 border border-border rounded-sm p-3 text-[11px] whitespace-pre-wrap max-h-96 overflow-auto">
                      {e.content}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
