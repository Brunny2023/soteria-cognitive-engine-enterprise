import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import {
  useAdvanceArchetype,
  useCreateArchetype,
  useRetireArchetype,
  useTogglePack,
  useArchetypes,
  usePacks,
  type Archetype,
  type DomainPack,
} from "@/lib/skills-store";

export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({
    meta: [
      { title: "Skills & Training — Soteria SECP" },
      {
        name: "description",
        content:
          "Define, train, and deploy specialist archetypes and domain packs without redesign.",
      },
    ],
  }),
  component: SkillsConsole,
});

const STATUS_TONE: Record<Archetype["status"], string> = {
  draft: "text-muted-foreground border-border",
  training: "text-[color:var(--warn)] border-[color:var(--warn)]/40",
  deployed: "text-[color:var(--signal)] border-[color:var(--signal)]/40",
  retired: "text-[color:var(--danger)] border-[color:var(--danger)]/40",
};
const PACK_TONE: Record<DomainPack["status"], string> = {
  installed: "text-[color:var(--signal)] border-[color:var(--signal)]/40",
  available: "text-muted-foreground border-border",
  pending: "text-[color:var(--warn)] border-[color:var(--warn)]/40",
};

function SkillsConsole() {
  const archetypes = useArchetypes();
  const packs = usePacks();
  const togglePack = useTogglePack();
  const [selectedId, setSelectedId] = useState<string | null>(archetypes[0]?.id ?? null);
  const [showComposer, setShowComposer] = useState(false);
  const [tab, setTab] = useState<"archetypes" | "packs">("archetypes");

  const selected = archetypes.find((a) => a.id === selectedId) ?? archetypes[0];

  const kpis = useMemo(() => {
    const deployed = archetypes.filter((a) => a.status === "deployed").length;
    const training = archetypes.filter((a) => a.status === "training").length;
    const drafts = archetypes.filter((a) => a.status === "draft").length;
    const instances = archetypes.reduce((s, a) => s + a.deployed, 0);
    const installedPacks = packs.filter((p) => p.status === "installed").length;
    return { deployed, training, drafts, instances, installedPacks };
  }, [archetypes, packs]);

  return (
    <AppShell
      title="SKILLS & TRAINING"
      crumb="MODULE :: extensibility.forge"
      status="FORGE_STATUS: READY"
      inspector={selected ? <ArchetypeInspector a={selected} /> : undefined}
    >
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatChip label="ARCHETYPES DEPLOYED" value={String(kpis.deployed)} tone="signal" />
          <StatChip label="IN TRAINING" value={String(kpis.training)} tone="warn" />
          <StatChip label="DRAFTS" value={String(kpis.drafts)} />
          <StatChip label="LIVE INSTANCES" value={String(kpis.instances)} tone="accent" />
          <StatChip label="DOMAIN PACKS" value={String(kpis.installedPacks)} tone="accent" />
        </div>

        <div className="flex items-center gap-1 border-b border-border">
          {(["archetypes", "packs"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "px-4 py-2 text-[11px] font-mono uppercase tracking-widest border-b-2 -mb-px " +
                (tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t === "archetypes" ? "◈ Specialist archetypes" : "▤ Domain packs"}
            </button>
          ))}
        </div>

        {tab === "archetypes" ? (
          <section>
            <SectionHeading
              code="AT"
              title="Specialist archetypes"
              action={
                <button
                  type="button"
                  onClick={() => setShowComposer((v) => !v)}
                  className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-sm"
                >
                  {showComposer ? "× Close composer" : "+ Forge archetype"}
                </button>
              }
            />
            {showComposer && (
              <Composer
                packs={packs}
                onCreated={(rec) => {
                  setSelectedId(rec.id);
                  setShowComposer(false);
                }}
              />
            )}
            <div className="grid gap-2 mt-2">
              {archetypes.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={
                    "text-left grid grid-cols-12 gap-3 items-center px-4 py-3 border rounded-sm transition-colors " +
                    (a.id === selected?.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-surface hover:bg-secondary")
                  }
                >
                  <span className="col-span-3 font-mono text-[11px] text-accent truncate">
                    {a.codename}
                  </span>
                  <span className="col-span-3 text-xs truncate">{a.role}</span>
                  <span className="col-span-2 font-mono text-[10px] text-muted-foreground">
                    {a.layer} · {a.department}
                  </span>
                  <span
                    className={
                      "col-span-2 font-mono text-[10px] uppercase px-2 py-1 border rounded-sm w-fit " +
                      STATUS_TONE[a.status]
                    }
                  >
                    {a.status}
                  </span>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.round(a.trained * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground w-9 text-right">
                      {Math.round(a.trained * 100)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <SectionHeading code="PK" title="Domain packs · plug-in expertise" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {packs.map((p) => (
                <div
                  key={p.id}
                  className="border border-border bg-surface rounded-sm p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {p.id} · v{p.version}
                      </div>
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-accent">
                        {p.domain}
                      </div>
                    </div>
                    <span
                      className={
                        "font-mono text-[10px] uppercase px-2 py-1 border rounded-sm " +
                        PACK_TONE[p.status]
                      }
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.summary}</p>
                  <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                    <div className="border border-border rounded-sm p-2">
                      <div className="text-muted-foreground">SKILLS</div>
                      <div className="text-foreground text-sm">{p.skills}</div>
                    </div>
                    <div className="border border-border rounded-sm p-2">
                      <div className="text-muted-foreground">POLICIES</div>
                      <div className="text-foreground text-sm">{p.policies}</div>
                    </div>
                    <div className="border border-border rounded-sm p-2">
                      <div className="text-muted-foreground">CORPORA</div>
                      <div className="text-foreground text-sm">{p.corpora}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePack({ id: p.id, status: p.status })}
                    className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border border-border hover:border-primary/40 hover:text-primary rounded-sm w-fit"
                  >
                    {p.status === "installed"
                      ? "Uninstall"
                      : p.status === "available"
                        ? "Queue install"
                        : "Confirm install"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function ArchetypeInspector({ a }: { a: Archetype }) {
  const advance = useAdvanceArchetype();
  const retire = useRetireArchetype();
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          INSPECTOR :: {a.id}
        </div>
        <div className="text-sm text-accent font-mono mt-1">{a.codename}</div>
        <div className="text-xs text-foreground">{a.role}</div>
      </div>
      <div className="p-5 space-y-5 overflow-y-auto text-xs">
        <Row label="LAYER" value={`${a.layer} · ${a.department}`} />
        <Row label="AUTONOMY" value={`A${a.autonomy}`} />
        <Row label="STATUS" value={a.status.toUpperCase()} />
        <Row label="LIVE INSTANCES" value={String(a.deployed)} />
        <Row label="UPDATED" value={a.updated} />

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            TRAINING
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.round(a.trained * 100)}%` }}
            />
          </div>
          <div className="font-mono text-[10px] text-muted-foreground mt-1">
            {Math.round(a.trained * 100)}% corpus mastered
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            SKILLS
          </div>
          <ul className="space-y-1">
            {a.skills.map((s) => (
              <li
                key={s}
                className="border border-border rounded-sm px-2 py-1 font-mono text-[11px]"
              >
                ◈ {s}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            DOMAIN PACKS
          </div>
          <ul className="space-y-1">
            {a.packs.map((p) => (
              <li key={p} className="font-mono text-[11px] text-accent">
                ▤ {p}
              </li>
            ))}
            {a.packs.length === 0 && (
              <li className="text-[11px] text-muted-foreground">No packs bound.</li>
            )}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            GUARDRAILS
          </div>
          <ul className="space-y-1">
            {a.guardrails.map((g) => (
              <li
                key={g}
                className="border-l-2 border-[color:var(--warn)]/60 pl-2 text-[11px] text-muted-foreground"
              >
                {g}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => advance(a.id)}
            disabled={a.status === "retired"}
            className="text-[10px] font-mono uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary hover:bg-primary/10 rounded-sm disabled:opacity-40"
          >
            {a.status === "draft" && "▶ Begin training"}
            {a.status === "training" && "▶ Advance training cycle"}
            {a.status === "deployed" && "▶ Scale up 1 instance"}
            {a.status === "retired" && "— Retired"}
          </button>
          <button
            type="button"
            onClick={() => retire(a.id)}
            disabled={a.status === "retired"}
            className="text-[10px] font-mono uppercase tracking-widest px-3 py-2 border border-border text-muted-foreground hover:text-[color:var(--danger)] hover:border-[color:var(--danger)]/40 rounded-sm disabled:opacity-40"
          >
            ◼ Retire archetype
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-[11px] text-foreground text-right">{value}</span>
    </div>
  );
}

function Composer({
  packs,
  onCreated,
}: {
  packs: DomainPack[];
  onCreated: (a: { id: string }) => void;
}) {
  const [codename, setCodename] = useState("");
  const [role, setRole] = useState("");
  const [layer, setLayer] = useState<"L3" | "L5">("L5");
  const [department, setDepartment] = useState("");
  const [autonomy, setAutonomy] = useState<1 | 2 | 3 | 4>(2);
  const [skills, setSkills] = useState("");
  const [guardrails, setGuardrails] = useState("");
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const { create, isPending } = useCreateArchetype();
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    codename.trim().length >= 3 &&
    role.trim().length >= 3 &&
    department.trim().length >= 2 &&
    skills.trim().length >= 3;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || isPending) return;
    setError(null);
    try {
      const rec = await create({
        codename: codename.trim().toUpperCase(),
        role: role.trim(),
        layer,
        department: department.trim(),
        autonomy,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        packs: selectedPacks,
        guardrails: guardrails
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      onCreated(rec);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to forge archetype");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="border border-primary/30 bg-primary/5 rounded-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-3 mb-4"
    >
      <Field label="CODENAME">
        <input
          value={codename}
          onChange={(e) => setCodename(e.target.value)}
          className="w-full bg-background border border-border rounded-sm px-2 py-1.5 text-xs font-mono"
          placeholder="TIER TRACER"
        />
      </Field>
      <Field label="ROLE">
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full bg-background border border-border rounded-sm px-2 py-1.5 text-xs"
          placeholder="Strategic Buyer"
        />
      </Field>
      <Field label="LAYER">
        <div className="flex gap-1">
          {(["L3", "L5"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLayer(l)}
              className={
                "flex-1 px-2 py-1.5 text-[11px] font-mono border rounded-sm " +
                (layer === l
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground")
              }
            >
              {l === "L3" ? "L3 · Consultant" : "L5 · Specialist"}
            </button>
          ))}
        </div>
      </Field>
      <Field label="DEPARTMENT">
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full bg-background border border-border rounded-sm px-2 py-1.5 text-xs"
          placeholder="Supply Chain"
        />
      </Field>
      <Field label="AUTONOMY">
        <div className="flex gap-1">
          {([1, 2, 3, 4] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAutonomy(n)}
              className={
                "flex-1 px-2 py-1.5 text-[11px] font-mono border rounded-sm " +
                (autonomy === n
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground")
              }
            >
              A{n}
            </button>
          ))}
        </div>
      </Field>
      <Field label="SKILLS · comma-separated">
        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="w-full bg-background border border-border rounded-sm px-2 py-1.5 text-xs"
          placeholder="RFQ orchestration, should-cost modeling"
        />
      </Field>
      <Field label="DOMAIN PACKS" wide>
        <div className="flex flex-wrap gap-1">
          {packs.map((p) => {
            const on = selectedPacks.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  setSelectedPacks((prev) =>
                    on ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                  )
                }
                className={
                  "px-2 py-1 text-[10px] font-mono border rounded-sm " +
                  (on
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {p.id}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="GUARDRAILS · one per line" wide>
        <textarea
          value={guardrails}
          onChange={(e) => setGuardrails(e.target.value)}
          rows={3}
          className="w-full bg-background border border-border rounded-sm px-2 py-1.5 text-xs font-mono"
          placeholder="Materiality > $250K → escalate"
        />
      </Field>
      <div className="md:col-span-2 flex items-center justify-end gap-2">
        {error && <span className="font-mono text-[10px] text-[color:var(--danger)]">{error}</span>}
        <span className="font-mono text-[10px] text-muted-foreground">
          {isPending ? "FORGING…" : canSubmit ? "READY TO FORGE" : "COMPLETE REQUIRED FIELDS"}
        </span>
        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="text-[10px] font-mono uppercase tracking-widest px-4 py-2 border border-primary text-primary bg-primary/10 hover:bg-primary/20 rounded-sm disabled:opacity-40"
        >
          ▶ Commit archetype
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={"flex flex-col gap-1 " + (wide ? "md:col-span-2" : "")}>
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
