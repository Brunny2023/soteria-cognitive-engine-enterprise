import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { APPROVAL_STAGES } from "@/lib/secp-store";
import { useRequests } from "@/lib/secp-store";

const EMAIL_KEY = "secp.email_reminders.v1";

type EmailPrefs = { enabled: boolean; address: string };

function loadPrefs(): EmailPrefs {
  if (typeof window === "undefined") return { enabled: false, address: "" };
  try {
    return JSON.parse(localStorage.getItem(EMAIL_KEY) ?? "") as EmailPrefs;
  } catch {
    return { enabled: false, address: "" };
  }
}
function savePrefs(p: EmailPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EMAIL_KEY, JSON.stringify(p));
}

export function NotificationsBell() {
  const requests = useRequests();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<EmailPrefs>(() => loadPrefs());
  const panelRef = useRef<HTMLDivElement>(null);

  const pending = useMemo(() => {
    const out: { id: string; title: string; stage: string; priority: string }[] = [];
    for (const r of requests) {
      const next = r.steps.find((s) => s.status === "pending" || s.status === "active");
      if (!next) continue;
      if (!APPROVAL_STAGES.includes(next.stage)) continue;
      out.push({ id: r.id, title: r.title, stage: next.stage, priority: r.priority });
    }
    return out;
  }, [requests]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const count = pending.length;
  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center gap-2 px-2 py-1 border border-border rounded-sm hover:border-primary/40 hover:text-foreground"
        aria-label={`Notifications (${count} pending)`}
      >
        <span className="text-sm leading-none">◔</span>
        <span className="uppercase tracking-widest">Alerts</span>
        {count > 0 && (
          <span className="ml-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[color:var(--warn)] text-[9px] font-bold text-background flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-surface border border-border rounded-sm shadow-2xl z-50 text-foreground">
          <div className="px-4 py-3 border-b border-border">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Pending co-approvals</div>
            <div className="text-xs font-bold mt-1">{count === 0 ? "All clear — no approvals waiting" : `${count} directive${count === 1 ? "" : "s"} awaiting a second operator`}</div>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {pending.length === 0 && (
              <div className="px-4 py-4 text-[11px] font-mono text-muted-foreground">
                Auto-run gates for executive · validate · deliver will surface here as soon as cognition reaches them.
              </div>
            )}
            {pending.map((p) => (
              <Link
                key={p.id + p.stage}
                to="/requests/$id"
                params={{ id: p.id }}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 border-b border-border last:border-b-0 hover:bg-secondary"
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-accent">{p.id}</span>
                  <span className="text-[color:var(--warn)] uppercase">{p.stage} gate</span>
                </div>
                <div className="text-[12px] mt-1 line-clamp-1">{p.title}</div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">Priority {p.priority} · Sign & continue →</div>
              </Link>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border bg-surface-2/50">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Email reminders</div>
            <label className="flex items-center gap-2 text-[11px] mb-2">
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={(e) => {
                  const next = { ...prefs, enabled: e.target.checked };
                  setPrefs(next);
                  savePrefs(next);
                }}
              />
              <span>Notify me when a co-approval is pending &gt; 15 min</span>
            </label>
            <input
              type="email"
              placeholder="approver@company.com"
              value={prefs.address}
              onChange={(e) => {
                const next = { ...prefs, address: e.target.value };
                setPrefs(next);
                savePrefs(next);
              }}
              className="w-full bg-background border border-border rounded-sm px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-primary"
            />
            <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
              Reminders dispatch through Lovable Emails when a verified sending domain is configured. Preference is stored locally until then.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}