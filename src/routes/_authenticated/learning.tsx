import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({
    meta: [
      { title: "Learning Loop — Soteria SECP" },
      { name: "description", content: "Post-delivery lessons captured from completed requests, routed back to the layer that needs to learn." },
    ],
  }),
  component: LearningLoop,
});

const LAYER_OPTIONS = [
  { code: "L1", label: "Organizational" },
  { code: "L2", label: "Executive" },
  { code: "L3", label: "Consultant" },
  { code: "L4", label: "Program" },
  { code: "L5", label: "Workforce" },
  { code: "L6", label: "Governance" },
];

interface LearningRow {
  id: string;
  author_id: string;
  request_id: string;
  request_title: string;
  category: string;
  rating: number;
  outcome: string;
  lesson: string;
  target_layer: string;
  applied: boolean;
  created_at: string;
}

function LearningLoop() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LearningRow[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    supabase
      .from("learning_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as LearningRow[]));
  }, [reload]);

  const applied = rows.filter((r) => r.applied).length;
  const avgRating = rows.length ? (rows.reduce((a, r) => a + r.rating, 0) / rows.length).toFixed(2) : "—";

  async function toggleApplied(row: LearningRow) {
    await supabase.from("learning_entries").update({ applied: !row.applied }).eq("id", row.id);
    setReload((r) => r + 1);
  }

  return (
    <AppShell title="Learning Loop" crumb="L6→L1 · POST_DELIVERY_FEEDBACK">
      <div className="p-6 flex flex-col gap-6 animate-entry">
        <section className="grid grid-cols-4 gap-3">
          <StatChip label="Lessons Captured" value={String(rows.length)} tone="accent" />
          <StatChip label="Applied to Training" value={String(applied)} tone="signal" />
          <StatChip label="Pending" value={String(rows.length - applied)} tone="warn" />
          <StatChip label="Avg Outcome Rating" value={avgRating} />
        </section>

        <section>
          <SectionHeading code="L∞.1" title="Log a lesson" />
          <LessonForm onCreated={() => setReload((r) => r + 1)} />
        </section>

        <section>
          <SectionHeading code="L∞.2" title="Captured lessons" />
          <div className="bg-surface border border-border rounded-sm">
            {rows.length === 0 && (
              <div className="p-6 text-xs text-muted-foreground text-center">
                No lessons captured yet. Every delivered request should feed the loop.
              </div>
            )}
            {rows.map((r) => (
              <div key={r.id} className="border-b border-border last:border-b-0 p-4 flex gap-4">
                <div className="w-14 shrink-0 flex flex-col items-center">
                  <span className="font-mono text-[10px] text-accent">{r.target_layer}</span>
                  <span className="font-mono text-lg text-primary">{r.rating}</span>
                  <span className="font-mono text-[8px] text-muted-foreground">/ 5</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground">{r.request_id}</span>
                    <span className="text-sm font-bold">{r.request_title}</span>
                    <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase bg-secondary text-muted-foreground">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1"><span className="text-foreground">Outcome:</span> {r.outcome}</p>
                  <p className="text-xs text-muted-foreground"><span className="text-foreground">Lesson:</span> {r.lesson}</p>
                </div>
                <div className="w-32 shrink-0 flex flex-col items-end gap-2 text-[10px] font-mono">
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => toggleApplied(r)}
                    disabled={!user || (r.author_id !== user.id && false)}
                    className={
                      "px-2 py-1 uppercase tracking-widest border " +
                      (r.applied
                        ? "border-[color:var(--signal)]/40 text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                        : "border-border text-muted-foreground hover:text-primary hover:border-primary/40")
                    }
                  >
                    {r.applied ? "APPLIED" : "MARK APPLIED"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function LessonForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [requestId, setRequestId] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [category, setCategory] = useState("Reasoning quality");
  const [rating, setRating] = useState(4);
  const [outcome, setOutcome] = useState("");
  const [lesson, setLesson] = useState("");
  const [targetLayer, setTargetLayer] = useState("L3");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setBusy(true);
    const { error } = await supabase.from("learning_entries").insert({
      author_id: user.id,
      request_id: requestId.trim() || "REQ-ADHOC",
      request_title: requestTitle.trim() || "Ad-hoc reflection",
      category,
      rating,
      outcome: outcome.trim(),
      lesson: lesson.trim(),
      target_layer: targetLayer,
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setRequestId(""); setRequestTitle(""); setOutcome(""); setLesson("");
    onCreated();
  }

  return (
    <form onSubmit={submit} className="bg-surface border border-border p-5 rounded-sm grid grid-cols-6 gap-3">
      <Field label="Request ID" className="col-span-2">
        <input value={requestId} onChange={(e) => setRequestId(e.target.value)} placeholder="REQ-2041" className={inputCx} />
      </Field>
      <Field label="Request title" className="col-span-4">
        <input value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} placeholder="Q3 pricing review" className={inputCx} />
      </Field>
      <Field label="Category" className="col-span-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCx}>
          {["Reasoning quality","Data completeness","Validator gap","Policy conflict","Delivery timing","Human override"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Target layer" className="col-span-2">
        <select value={targetLayer} onChange={(e) => setTargetLayer(e.target.value)} className={inputCx}>
          {LAYER_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.code} · {l.label}</option>)}
        </select>
      </Field>
      <Field label={`Rating (1–5): ${rating}`} className="col-span-2">
        <input type="range" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full" />
      </Field>
      <Field label="Outcome observed" className="col-span-6">
        <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} required minLength={10} rows={2} className={inputCx} />
      </Field>
      <Field label="Lesson for the platform" className="col-span-6">
        <textarea value={lesson} onChange={(e) => setLesson(e.target.value)} required minLength={10} rows={2} className={inputCx} />
      </Field>
      {error && <div className="col-span-6 text-[11px] text-[color:var(--danger)]">{error}</div>}
      <div className="col-span-6 flex justify-end">
        <button
          type="submit"
          disabled={busy || !user}
          className="bg-primary text-primary-foreground px-4 py-2 text-[11px] font-mono uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
        >
          {busy ? "…" : "Commit lesson →"}
        </button>
      </div>
    </form>
  );
}

const inputCx = "bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary w-full";

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={"flex flex-col gap-1 " + (className ?? "")}>
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}