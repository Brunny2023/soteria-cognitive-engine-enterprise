import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { WalkthroughPlayer } from "@/components/WalkthroughPlayer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soteria SECP — The Cognitive Operating System for Modern Organizations" },
      {
        name: "description",
        content:
          "Deploy AI executives, consultants, and specialist workforces that reason on your organization's own knowledge, policies, and goals — under enterprise-grade governance.",
      },
      { property: "og:title", content: "Soteria SECP — Enterprise Cognition Platform" },
      {
        property: "og:description",
        content: "The cognitive operating system for modern organizations.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  // If already signed in, jump to dashboard.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/onboarding", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="size-7 bg-primary rounded-sm flex items-center justify-center text-primary-foreground text-xs font-bold">
              S
            </div>
            <span className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
              SOTERIA · SECP
            </span>
          </div>
          <nav className="flex items-center gap-6 text-[11px] font-mono uppercase tracking-widest">
            <a href="#layers" className="text-muted-foreground hover:text-foreground">
              Layers
            </a>
            <a href="#platform" className="text-muted-foreground hover:text-foreground">
              Platform
            </a>
            <Link to="/auth" className="text-primary hover:underline">
              Sign in →
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-8">
            <p className="font-mono text-[10px] tracking-widest text-accent mb-4">
              M0.0 · MISSION STATEMENT
            </p>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              The cognitive operating system for modern organizations.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Soteria SECP lets enterprises deploy AI executives, consultants, and specialist
              workforces that reason on their own knowledge, policies, and objectives — with full
              audit and human control.
            </p>
            <div className="mt-10 flex gap-3">
              <Link
                to="/auth"
                className="bg-primary text-primary-foreground px-6 py-3 text-[11px] font-mono uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Enter Mission Control →
              </Link>
              <a
                href="#layers"
                className="border border-border px-6 py-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Explore the six layers
              </a>
            </div>
          </div>
          <div className="md:col-span-4 bg-surface border border-border p-5 rounded-sm font-mono text-[10px] text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-2 mb-3 text-accent">
              <span className="size-1.5 rounded-full bg-[color:var(--signal)] animate-pulse" />
              <span>SYSTEM_STATUS · NOMINAL</span>
            </div>
            <div>ACTIVE_SPECIALISTS · 1,284</div>
            <div>OPEN_REQUESTS · 47</div>
            <div>VALIDATION_PASS · 98.3%</div>
            <div>ENTITIES_INDEXED · 42,981</div>
          </div>
        </section>

        <section id="demo" className="border-t border-border bg-surface">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-accent mb-2">
                  M0.LIVE · WALKTHROUGH
                </p>
                <h2 className="text-3xl font-bold tracking-tight">
                  See mission control in motion.
                </h2>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                Recorded from the live SECP shell · loops continuously
              </span>
            </div>
            <WalkthroughPlayer />
          </div>
        </section>

        <section id="layers" className="border-t border-border bg-surface">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="font-mono text-[10px] tracking-widest text-accent mb-2">
              M0.1 · COGNITION LAYERS
            </p>
            <h2 className="text-3xl font-bold tracking-tight mb-10">
              Six intelligence layers, one continuous loop.
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                ["L1", "Organizational", "Indexes every entity, policy, decision, and asset."],
                [
                  "L2",
                  "Executive",
                  "AI officers reason over strategy and cross-domain trade-offs.",
                ],
                ["L3", "Consultant", "Domain specialists supply deep expertise on demand."],
                ["L4", "Program", "Plans, orchestrates, and monitors delivery."],
                ["L5", "Workforce", "Specialist agents execute tasks under autonomy policy."],
                ["L6", "Governance", "Validates, audits, and closes the learning loop."],
              ].map(([code, name, desc]) => (
                <div key={code} className="border border-border bg-background p-5 rounded-sm">
                  <div className="font-mono text-[10px] text-accent">{code}</div>
                  <div className="text-lg font-bold mt-1">{name}</div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-accent mb-2">
                M0.2 · PRINCIPLES
              </p>
              <h2 className="text-3xl font-bold tracking-tight mb-6">
                Modular. Explainable. Governed.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Every decision is traceable through the six cognition layers. Autonomy policies
                (L1–L4) keep humans in command from recommendation to end-to-end automation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
              {[
                "AUDIT_TRAIL",
                "AUTONOMY_POLICY",
                "VALIDATOR_BATTERY",
                "MODEL_ROUTING",
                "KNOWLEDGE_GRAPH",
                "LEARNING_LOOP",
                "ROLE_BASED_ACCESS",
                "AGENT_ROSTER",
              ].map((k) => (
                <div key={k} className="border border-border p-3 text-muted-foreground">
                  ▪ {k}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>© SOTERIA SECP · ENTERPRISE COGNITION PLATFORM</span>
          <Link to="/auth" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
