import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { LAYERS } from "@/lib/secp-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/dashboard", label: "MISSION CONTROL", code: "M0", glyph: "◎" },
  { to: "/organizational", label: "ORGANIZATIONAL", code: "L1", glyph: "▣" },
  { to: "/ingest", label: "INGESTION", code: "IN", glyph: "⇪" },
  { to: "/executives", label: "EXECUTIVE", code: "L2", glyph: "▲" },
  { to: "/consultants", label: "CONSULTANT", code: "L3", glyph: "◆" },
  { to: "/program", label: "PROGRAM", code: "L4", glyph: "▤" },
  { to: "/workforce", label: "WORKFORCE", code: "L5", glyph: "◈" },
  { to: "/governance", label: "GOVERNANCE", code: "L6", glyph: "◉" },
  { to: "/requests", label: "REQUESTS", code: "RQ", glyph: "▸" },
  { to: "/learning", label: "LEARNING LOOP", code: "L∞", glyph: "↻" },
  { to: "/skills", label: "SKILLS & TRAINING", code: "SK", glyph: "⚙" },
  { to: "/knowledge", label: "KNOWLEDGE GRAPH", code: "KG", glyph: "◊" },
  { to: "/security", label: "SECURITY & COMPLIANCE", code: "SC", glyph: "⛨" },
  { to: "/admin", label: "ADMIN", code: "AD", glyph: "◇" },
] as const;

export function AppShell({
  title,
  crumb,
  status = "SYSTEM_STATUS: NOMINAL",
  children,
  inspector,
}: {
  title: string;
  crumb?: string;
  status?: string;
  children: ReactNode;
  inspector?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name ?? null));
  }, [user]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <nav className="w-16 shrink-0 border-r border-border flex flex-col items-center py-5 gap-6 bg-surface">
        <Link
          to="/dashboard"
          className="size-8 bg-primary rounded-sm flex items-center justify-center font-bold text-primary-foreground text-xs tracking-tight"
          aria-label="Soteria SECP home"
        >
          S
        </Link>
        <div className="flex flex-col gap-3">
          {NAV.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "group relative size-10 rounded flex items-center justify-center transition-colors border " +
                  (active
                    ? "border-primary/40 text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary")
                }
              >
                <span className="text-sm leading-none">{n.glyph}</span>
                <span className="absolute left-12 top-1/2 -translate-y-1/2 bg-surface border border-border px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 font-mono tracking-wider pointer-events-none">
                  {n.code} · {n.label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="mt-auto text-[9px] font-mono text-muted-foreground text-center leading-tight">
          {LAYERS.length}
          <br />
          LAYERS
        </div>
      </nav>

      <main className="flex-1 flex flex-col min-w-0 bg-surface-2">
        <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-6 bg-surface/60 backdrop-blur-md">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground whitespace-nowrap">
              {title}
            </h1>
            {crumb && (
              <>
                <div className="h-4 w-px bg-border" />
                <span className="font-mono text-[10px] text-accent truncate">{crumb}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-5 font-mono text-[10px] text-muted-foreground">
            <span className="text-accent">{status}</span>
            <div className="hidden md:flex gap-2">
              <span>CPU</span>
              <span className="text-foreground">12.4%</span>
            </div>
            <div className="hidden md:flex gap-2">
              <span>COG_LOAD</span>
              <span className="text-foreground">42.8%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[color:var(--signal)] animate-pulse" />
              <span>LIVE</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-3">
              <span className="text-foreground truncate max-w-[140px]" title={user?.email ?? undefined}>
                {displayName || user?.email?.split("@")[0] || "OPERATOR"}
              </span>
              <button
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-[color:var(--danger)] uppercase tracking-widest"
                type="button"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 min-h-0 flex">
          <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
          {inspector && (
            <aside className="w-80 shrink-0 border-l border-border bg-surface hidden xl:flex flex-col">
              {inspector}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

export function StatChip({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "accent" | "signal" | "warn" | "danger" }) {
  const color =
    tone === "accent"
      ? "text-accent"
      : tone === "signal"
        ? "text-[color:var(--signal)]"
        : tone === "warn"
          ? "text-[color:var(--warn)]"
          : tone === "danger"
            ? "text-[color:var(--danger)]"
            : "text-foreground";
  return (
    <div className="flex flex-col gap-1 border border-border bg-surface rounded-sm p-3">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={"text-xl font-semibold font-mono " + color}>{value}</span>
    </div>
  );
}

export function SectionHeading({ code, title, action }: { code: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] text-accent">{code}</span>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}