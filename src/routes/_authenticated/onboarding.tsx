import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { AppShell, SectionHeading } from "@/components/AppShell";
import { ROLE_PROFILES, primaryRole, isOnboarded, markOnboarded } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Operator onboarding — Soteria SECP" },
      { name: "description", content: "Role-aware onboarding that routes each operator to the right dashboard and surfaces of the Soteria cognition platform." },
      { property: "og:title", content: "Operator onboarding — Soteria SECP" },
      { property: "og:description", content: "Land on the right console for your role." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<AppRole | null>(null);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const roles = ((data ?? []) as { role: AppRole }[]).map((r) => r.role);
        const p = primaryRole(roles);
        if (isOnboarded(user.id)) {
          navigate({ to: ROLE_PROFILES[p].home, replace: true });
          return;
        }
        setRole(p);
      });
  }, [user, navigate]);

  if (!role) {
    return (
      <AppShell title="Onboarding" crumb="OB · Resolving role">
        <div className="p-6 font-mono text-[11px] text-muted-foreground">Resolving role assignment…</div>
      </AppShell>
    );
  }

  const profile = ROLE_PROFILES[role];

  function enter(to?: string) {
    if (user) markOnboarded(user.id);
    navigate({ to: to ?? profile.home });
  }

  return (
    <AppShell title="Operator onboarding" crumb={`OB · ${profile.label}`}>
      <div className="p-6 flex flex-col gap-8 animate-entry max-w-4xl">
        <section className="bg-surface border border-border rounded-sm p-6">
          <p className="font-mono text-[10px] tracking-widest text-accent mb-2">OB.0 · ROLE ASSIGNMENT</p>
          <h2 className="text-2xl font-bold tracking-tight">{profile.label}</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{profile.blurb}</p>
          <div className="mt-4 font-mono text-[10px] text-muted-foreground">
            ROLE · <span className="text-primary uppercase">{role}</span> · HOME ·{" "}
            <span className="text-foreground">{profile.home}</span> · RAIL ·{" "}
            <span className="text-foreground">{profile.nav.length} surfaces</span>
          </div>
        </section>

        <section>
          <SectionHeading code="OB.1" title="Your first steps" />
          <div className="bg-surface border border-border rounded-sm mt-3">
            {profile.steps.map((s, i) => {
              const complete = done.includes(s.code);
              return (
                <div
                  key={s.code}
                  className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0"
                >
                  <span className="font-mono text-[10px] text-accent w-10 shrink-0">{s.code}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">
                      {i + 1}. {s.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{s.detail}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDone((d) => (d.includes(s.code) ? d : [...d, s.code]));
                      enter(s.to);
                    }}
                    className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 shrink-0"
                  >
                    {complete ? "▪ Visited" : "▸ Open"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => enter()}
            className="font-mono text-[11px] uppercase tracking-widest px-5 py-3 bg-primary text-primary-foreground hover:bg-accent transition-colors"
          >
            Enter {profile.home} →
          </button>
        </div>
      </div>
    </AppShell>
  );
}
