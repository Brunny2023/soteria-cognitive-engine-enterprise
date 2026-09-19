import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { AUTONOMY_LABELS, DEPARTMENTS, SPECIALISTS, type Department } from "@/lib/secp-data";
import {
  executeTaskFn,
  getTaskArtifactFn,
  listInboxFn,
  type InboxTask,
} from "@/lib/workforce.functions";

export const Route = createFileRoute("/_authenticated/workforce")({
  head: () => ({
    meta: [
      { title: "Specialist Workforce — Soteria SECP" },
      {
        name: "description",
        content:
          "Specialist task inbox and roster: assigned work executes into checksummed deliverables in the artifact ledger.",
      },
      { property: "og:title", content: "Specialist Workforce — Soteria SECP" },
      {
        property: "og:description",
        content: "L5 execution mesh — assigned tasks, live execution, and signed work products.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkforcePage,
});

const STATUS_TONE: Record<InboxTask["status"], string> = {
  todo: "text-muted-foreground border-border",
  in_progress: "text-primary border-primary/40 bg-primary/10",
  blocked: "text-[color:var(--danger)] border-[color:var(--danger)]/40",
  done: "text-[color:var(--signal)] border-[color:var(--signal)]/40",
};

function WorkforcePage() {
  const [tab, setTab] = useState<"inbox" | "roster">("inbox");
  return (
    <AppShell title="Specialist Workforce" crumb="L5 · Execution mesh">
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <div className="flex gap-2">
          {(
            [
              ["inbox", "TASK INBOX"],
              ["roster", "ROSTER"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={
                "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border rounded-sm transition-colors " +
                (tab === id
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40")
              }
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "inbox" ? <TaskInbox /> : <Roster />}
      </div>
    </AppShell>
  );
}

function TaskInbox() {
  const qc = useQueryClient();
  const listInbox = useServerFn(listInboxFn);
  const executeTask = useServerFn(executeTaskFn);
  const getArtifact = useServerFn(getTaskArtifactFn);

  const [dept, setDept] = useState<Department | "ALL">("ALL");
  const [openArtifact, setOpenArtifact] = useState<string | null>(null);

  const inbox = useQuery({ queryKey: ["secp", "inbox"], queryFn: () => listInbox() });
  const tasks = useMemo(() => {
    const all = inbox.data ?? [];
    return dept === "ALL" ? all : all.filter((t) => t.department === dept);
  }, [inbox.data, dept]);

  const run = useMutation({
    mutationFn: (taskId: string) => executeTask({ data: { taskId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secp", "inbox"] });
      qc.invalidateQueries({ queryKey: ["secp", "programs"] });
      qc.invalidateQueries({ queryKey: ["secp", "artifacts"] });
    },
  });

  const artifact = useQuery({
    queryKey: ["secp", "inbox-artifact", openArtifact],
    queryFn: () => getArtifact({ data: { artifactId: openArtifact as string } }),
    enabled: !!openArtifact,
  });

  const done = (inbox.data ?? []).filter((t) => t.status === "done").length;
  const delivered = (inbox.data ?? []).filter((t) => t.artifact_id).length;
  const hours = (inbox.data ?? []).reduce((a, t) => a + t.effort_hours, 0);

  return (
    <>
      <section className="grid grid-cols-4 gap-3">
        <StatChip label="Assigned tasks" value={String(inbox.data?.length ?? 0)} />
        <StatChip label="Completed" value={String(done)} tone="signal" />
        <StatChip label="Deliverables signed" value={String(delivered)} tone="accent" />
        <StatChip label="Effort under management" value={`${hours}h`} />
      </section>

      <section>
        <SectionHeading
          code="L5.1"
          title="Specialist Task Inbox"
          action={
            <span className="font-mono text-[10px] text-muted-foreground">
              {tasks.length} shown
            </span>
          }
        />
        <div className="flex flex-wrap gap-2 mb-3">
          {(["ALL", ...DEPARTMENTS] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDept(d as Department | "ALL")}
              className={
                "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border rounded-sm transition-colors " +
                (dept === d
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40")
              }
            >
              {d}
            </button>
          ))}
        </div>

        {inbox.isLoading ? (
          <div className="text-xs font-mono text-muted-foreground">Loading assignments…</div>
        ) : tasks.length === 0 ? (
          <div className="bg-surface border border-border rounded-sm p-6 text-sm text-muted-foreground">
            No tasks assigned yet. Generate a work breakdown on the Program layer (L4) and
            specialists will receive their assignments here.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-accent">
                      {t.workstream_code} · {t.request_title}
                    </div>
                    <div className="text-sm font-bold tracking-tight">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.detail}</div>
                  </div>
                  <span
                    className={
                      "shrink-0 font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5 " +
                      STATUS_TONE[t.status]
                    }
                  >
                    {t.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <span className="text-primary">{t.specialist_id}</span>
                  <span>{t.specialist_role}</span>
                  <span>{t.department}</span>
                  <span>{t.effort_hours}h</span>
                  {t.artifact_checksum ? (
                    <span className="text-[color:var(--signal)]">
                      sha256 {t.artifact_checksum.slice(0, 12)}…
                    </span>
                  ) : null}
                  <div className="ml-auto flex gap-2">
                    {t.artifact_id ? (
                      <button
                        onClick={() =>
                          setOpenArtifact(openArtifact === t.artifact_id ? null : t.artifact_id)
                        }
                        className="border border-border px-2 py-1 hover:border-foreground/40 hover:text-foreground"
                      >
                        {openArtifact === t.artifact_id ? "Hide deliverable" : "View deliverable"}
                      </button>
                    ) : null}
                    <button
                      onClick={() => run.mutate(t.id)}
                      disabled={run.isPending}
                      className="border border-primary/40 text-primary bg-primary/10 px-2 py-1 disabled:opacity-50"
                    >
                      {run.isPending && run.variables === t.id
                        ? "Executing…"
                        : t.artifact_id
                          ? "Re-execute"
                          : "Execute task"}
                    </button>
                  </div>
                </div>

                {openArtifact && openArtifact === t.artifact_id ? (
                  <pre className="bg-secondary/30 border border-border rounded-sm p-3 text-[11px] whitespace-pre-wrap max-h-96 overflow-auto">
                    {artifact.isLoading
                      ? "Loading deliverable…"
                      : (artifact.data?.content ?? "Not found")}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {run.isError ? (
          <div className="mt-3 text-[11px] font-mono text-[color:var(--danger)]">
            Execution failed: {(run.error as Error).message}
          </div>
        ) : null}
      </section>
    </>
  );
}

function Roster() {
  const [dept, setDept] = useState<Department | "ALL">("ALL");
  const filtered = dept === "ALL" ? SPECIALISTS : SPECIALISTS.filter((s) => s.department === dept);
  const activeCount = SPECIALISTS.filter((s) => s.status === "active").length;

  return (
    <>
      <section className="grid grid-cols-4 gap-3">
        <StatChip label="Roles catalogued" value={String(SPECIALISTS.length)} />
        <StatChip label="Active now" value={String(activeCount)} tone="signal" />
        <StatChip label="Departments" value={String(DEPARTMENTS.length)} tone="accent" />
        <StatChip
          label="Autonomy L3+ share"
          value={`${Math.round((SPECIALISTS.filter((s) => s.autonomy >= 3).length / SPECIALISTS.length) * 100)}%`}
        />
      </section>

      <section>
        <SectionHeading code="L5.2" title="Filter Workforce" />
        <div className="flex flex-wrap gap-2">
          {(["ALL", ...DEPARTMENTS] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDept(d as Department | "ALL")}
              className={
                "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border rounded-sm transition-colors " +
                (dept === d
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40")
              }
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          code="L5.3"
          title={dept === "ALL" ? "All Specialists" : dept}
          action={
            <span className="font-mono text-[10px] text-muted-foreground">
              {filtered.length} matches
            </span>
          }
        />
        <div className="bg-surface border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 border-b border-border">
              <tr className="text-[10px] font-mono uppercase text-muted-foreground">
                <th className="text-left px-4 py-2">ID</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-left px-4 py-2">Department</th>
                <th className="text-left px-4 py-2">Level</th>
                <th className="text-left px-4 py-2">Autonomy</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border last:border-b-0 hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{s.id}</td>
                  <td className="px-4 py-3 font-medium">{s.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.department}</td>
                  <td className="px-4 py-3 font-mono">L{s.level}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] text-primary">A{s.autonomy}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      {AUTONOMY_LABELS[s.autonomy]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 " +
                        (s.status === "active"
                          ? "text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                          : s.status === "reserved"
                            ? "text-accent bg-accent/10"
                            : "text-muted-foreground bg-secondary")
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
