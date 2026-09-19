import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import {
  COURSES,
  TOTAL_LESSONS,
  courseMinutes,
  loadProgress,
  saveProgress,
  type Course,
} from "@/lib/academy";

export const Route = createFileRoute("/_authenticated/academy")({
  head: () => ({
    meta: [
      { title: "Operator Academy — Soteria SECP" },
      {
        name: "description",
        content:
          "Guided courses that teach the Soteria cognition platform through each AI executive's real use case — from first directive to signed audit package.",
      },
      { property: "og:title", content: "Operator Academy — Soteria SECP" },
      {
        property: "og:description",
        content:
          "Learn the platform one executive use case at a time, with click-paths into the live console.",
      },
    ],
  }),
  component: AcademyPage,
});

function AcademyPage() {
  const { user } = useAuth();
  const [done, setDone] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string>(COURSES[0].id);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (user) setDone(loadProgress(user.id));
  }, [user]);

  function toggle(code: string) {
    setDone((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      if (user) saveProgress(user.id, next);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COURSES;
    return COURSES.filter((c) =>
      [c.exec, c.codename, c.useCase, c.summary, ...c.lessons.map((l) => l.title + " " + l.outcome)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  const open = COURSES.find((c) => c.id === openId) ?? COURSES[0];
  const completed = done.length;
  const pct = Math.round((completed / TOTAL_LESSONS) * 100);
  const totalMinutes = COURSES.reduce((n, c) => n + courseMinutes(c), 0);

  return (
    <AppShell
      title="Operator Academy"
      crumb={`AC · ${COURSES.length} courses · ${TOTAL_LESSONS} lessons`}
      inspector={<CourseInspector course={open} done={done} />}
    >
      <div className="p-6 flex flex-col gap-8 animate-entry">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatChip label="Courses" value={String(COURSES.length)} />
          <StatChip label="Lessons" value={String(TOTAL_LESSONS)} />
          <StatChip
            label="Completed"
            value={`${completed}`}
            tone={completed ? "signal" : "default"}
          />
          <StatChip
            label="Est. time"
            value={`${Math.round(totalMinutes / 6) / 10}h`}
            tone="accent"
          />
        </section>

        <section className="bg-surface border border-border rounded-sm p-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-mono text-[10px] tracking-widest text-accent">
              AC.0 · CURRICULUM PROGRESS
            </p>
            <span className="font-mono text-[10px] text-muted-foreground">
              {completed}/{TOTAL_LESSONS} · {pct}%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-secondary rounded-sm overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed max-w-3xl">
            Each course teaches the platform through one executive's real work. Lessons are
            click-paths into the live console — open the surface, do the step, then mark it done.
            Progress is stored for your operator account.
          </p>
        </section>

        <section>
          <SectionHeading
            code="AC.1"
            title="Course catalogue"
            action={
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses & lessons"
                aria-label="Search courses and lessons"
                className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-[10px] w-56 focus:outline-none focus:border-primary/60"
              />
            }
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => {
              const cDone = c.lessons.filter((l) => done.includes(l.code)).length;
              const complete = cDone === c.lessons.length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setOpenId(c.id)}
                  className={
                    "text-left border rounded-sm p-4 bg-surface transition-colors " +
                    (open.id === c.id
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/30")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-accent">{c.id}</span>
                    <span
                      className={
                        "font-mono text-[9px] uppercase tracking-widest " +
                        (complete ? "text-[color:var(--signal)]" : "text-muted-foreground")
                      }
                    >
                      {complete ? "▪ complete" : `${cDone}/${c.lessons.length}`}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold mt-2 leading-snug">{c.useCase}</h3>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    {c.exec} · {c.codename}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                    {c.summary}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-3">
                    {c.lessons.length} lessons · ~{courseMinutes(c)} min
                  </p>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="font-mono text-[11px] text-muted-foreground">
                No course matches “{query}”.
              </p>
            )}
          </div>
        </section>

        <section>
          <SectionHeading code="AC.2" title={`${open.exec} — ${open.useCase}`} />
          <div className="bg-surface border border-border rounded-sm">
            {open.lessons.map((l, i) => {
              const complete = done.includes(l.code);
              return (
                <div
                  key={l.code}
                  className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => toggle(l.code)}
                    aria-pressed={complete}
                    aria-label={`Mark ${l.title} ${complete ? "incomplete" : "complete"}`}
                    className={
                      "mt-0.5 size-5 shrink-0 border rounded-sm font-mono text-[10px] flex items-center justify-center transition-colors " +
                      (complete
                        ? "border-[color:var(--signal)] text-[color:var(--signal)]"
                        : "border-border text-muted-foreground hover:border-primary/50")
                    }
                  >
                    {complete ? "✓" : ""}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] text-accent">{l.code}</span>
                      <span
                        className={
                          "text-sm font-bold " +
                          (complete ? "text-muted-foreground line-through" : "")
                        }
                      >
                        {i + 1}. {l.title}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ~{l.minutes} min
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {l.outcome}
                    </p>
                    <ol className="mt-2 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10px] text-muted-foreground">
                      {l.steps.map((s, si) => (
                        <li key={s} className="flex items-center gap-2">
                          <span className="text-accent">{si + 1}.</span>
                          <span>{s}</span>
                          {si < l.steps.length - 1 && <span className="text-border">→</span>}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <Link
                    to={l.to}
                    onClick={() => {
                      if (!complete) toggle(l.code);
                    }}
                    className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 shrink-0"
                  >
                    ▸ Practise
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function CourseInspector({ course, done }: { course: Course; done: string[] }) {
  const cDone = course.lessons.filter((l) => done.includes(l.code)).length;
  return (
    <div className="p-5 flex flex-col gap-5 overflow-y-auto">
      <div>
        <p className="font-mono text-[10px] tracking-widest text-accent">COURSE BRIEF</p>
        <h2 className="text-base font-bold mt-2 leading-snug">{course.useCase}</h2>
        <p className="font-mono text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
          {course.exec} · {course.codename}
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{course.summary}</p>
      <div>
        <p className="font-mono text-[10px] tracking-widest text-accent mb-2">
          GUARDRAILS TO INTERNALIZE
        </p>
        <ul className="flex flex-col gap-2">
          {course.guardrails.map((g) => (
            <li key={g} className="text-[11px] text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-primary font-mono">▪</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto border-t border-border pt-4 font-mono text-[10px] text-muted-foreground">
        TRACK · <span className="text-foreground">{course.track}</span>
        <br />
        PROGRESS ·{" "}
        <span className="text-foreground">
          {cDone}/{course.lessons.length}
        </span>{" "}
        · ~{courseMinutes(course)} MIN
      </div>
    </div>
  );
}
