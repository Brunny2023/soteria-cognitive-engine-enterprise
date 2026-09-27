import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CoxecLogo } from "@/components/CoxecLogo";
import { MacbookFrame } from "@/components/PublicSite";
import { AutonomySlider, LayerStack, SampleDirectives } from "@/components/LandingInteractives";
import commandRoom from "@/assets/coxec-command-room.jpg";

const TITLE = "Coxec — Your Company’s Data, Guided by the World’s Best Minds";
const DESC =
  "Connect your files and let an AI executive board reason through operations, surface insights, and solve complex business problems in real time.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Coxec",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: DESC,
        }),
      },
    ],
  }),
  component: Landing,
});

const LAYERS = [
  [
    "L1",
    "Organizational Knowledge",
    "Every entity, policy, decision, and asset indexed into one governed knowledge graph. Your AI thinks with your facts — not the internet's.",
    "AI knowledge management",
  ],
  [
    "L2",
    "Cognitive Executives",
    "Chief-level officers apply synthesized schools of judgement—from owner-operator strategy and constraint management to capital allocation and risk—then explain every decision.",
    "framework-led AI executives for enterprises",
  ],
  [
    "L3",
    "AI Consultants",
    "Commission deep domain specialists on demand: market analysis, due diligence, operating reviews — evidence-backed and citation-first.",
    "AI consulting services",
  ],
  [
    "L4",
    "Program Orchestration",
    "Workstreams and tasks are planned, assigned, and monitored automatically — with checkpoints that keep delivery on rails.",
    "AI project management",
  ],
  [
    "L5",
    "Specialist Workforce",
    "An on-demand bench of specialist agents executes scoped tasks under your autonomy policy — from recommendation-only to end-to-end.",
    "AI workforce automation",
  ],
  [
    "L6",
    "Governance & Learning",
    "Every action is validated, audited, and fed back into the platform. The system gets smarter; control never leaves your hands.",
    "AI governance and compliance",
  ],
];

const PAIN = [
  [
    "Decisions wait on people who are already overloaded",
    "Your best leaders spend their days gathering context instead of deciding. Coxec officers arrive with the full organizational picture already assembled.",
  ],
  [
    "Institutional knowledge walks out the door",
    "Policies, precedents, and hard-won lessons live in inboxes and heads. Coxec turns them into governed organizational memory.",
  ],
  [
    "Raw AI gives generic answers",
    "A language model predicts plausible text. Coxec executives apply specialized decision frameworks to your margins, risk appetite, policies, and board commitments.",
  ],
  [
    "Automation you can't audit is a liability",
    "Every Coxec action carries a reasoning trace, deterministic validation, and a signed audit export. Regulators and boards get evidence, not assertions.",
  ],
];

const HOW = [
  [
    "01",
    "Connect your knowledge",
    "Ingest documents, policies, and systems of record. Coxec builds a governed knowledge graph of your organization in hours, not quarters.",
  ],
  [
    "02",
    "Activate your council",
    "Choose the officers you need. Each applies an original synthesis of publicly documented frameworks from accomplished leaders in its discipline—not a blank chatbot persona.",
  ],
  [
    "03",
    "Set the rules of command",
    "Autonomy levels L1–L4 decide what agents may recommend, draft, or execute. SQL allowlists, per-executive scopes, and human approval gates are built in.",
  ],
  [
    "04",
    "Direct, review, compound",
    "Issue directives from Mission Control. Approve, redirect, or veto — every outcome feeds the learning loop and makes the next decision sharper.",
  ],
];

const PROOF = [
  [
    "12-stage reasoning pipeline",
    "Intake → context → doctrine → plan → validation → execution → review. Inspect any stage, any time.",
  ],
  [
    "Deterministic validation",
    "Nine knowledge-graph invariants and evidence-level verdicts catch bad outputs before they ship.",
  ],
  [
    "Signed audit exports",
    "Tamper-evident audit packages with integrity checks — board, regulator, and customer ready.",
  ],
  [
    "Enterprise-grade isolation",
    "Role-based access, tenant-scoped data, leaked-password protection, retention and purge controls.",
  ],
];

const FRAMEWORKS = [
  ["Strategy", "Long-horizon ownership, strategic inflection points, reversible decisions"],
  ["Operations", "Theory of Constraints, flow efficiency, go-and-see discipline"],
  ["Finance", "Opportunity cost, free-cash-flow discipline, asymmetric downside"],
  ["Technology", "Conceptual integrity, error budgets, evolutionary architecture"],
  ["Risk & Legal", "Premortems, tail-risk survival, evidence-first defensibility"],
  ["People & Market", "Talent density, psychological safety, category positioning"],
];

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/onboarding", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border sticky top-0 bg-background/90 backdrop-blur z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <CoxecLogo />
          <nav className="hidden md:flex items-center gap-6 text-[11px] font-mono uppercase tracking-widest">
            <Link to={"/demo" as never} className="text-muted-foreground hover:text-foreground">
              Product demo
            </Link>
            <a href="#layers" className="text-muted-foreground hover:text-foreground">
              Layers
            </a>
            <Link
              to={"/data-room" as never}
              className="text-muted-foreground hover:text-foreground"
            >
              Data room
            </Link>
            <Link to="/auth" className="text-primary hover:underline">
              Sign in →
            </Link>
          </nav>
          <Link
            to="/auth"
            className="md:hidden text-primary text-[11px] font-mono uppercase tracking-widest"
          >
            Sign in →
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative flex min-h-[calc(100svh-4rem)] items-end overflow-hidden border-b border-border">
          <img
            src={commandRoom}
            alt="Coxec executive cognition command room"
            width={1600}
            height={900}
            className="absolute inset-0 size-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-background/60" />
          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-end gap-8 px-6 py-10 md:grid-cols-12 md:py-12">
            <div className="md:col-span-8">
              <p className="mb-3 font-mono text-[10px] uppercase text-accent">
                Coxec · Synthesized executive intelligence
              </p>
              <h1 className="max-w-4xl text-4xl font-bold leading-[1.02] md:text-6xl">
                Your company’s data. Guided by the world’s best minds.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 md:text-lg">
                Connect your files and let an AI executive board of proven CEOs, CTOs, and
                consultants reason through your daily operations, surface insights, and solve
                complex problems in real time.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  className="bg-primary text-primary-foreground px-6 py-3 text-[11px] font-mono uppercase tracking-widest hover:bg-accent transition-colors"
                >
                  Build your executive council →
                </Link>
                <Link
                  to={"/demo" as never}
                  className="border border-border px-6 py-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Explore the demo
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Free to start · No credit card · Your data stays yours
              </p>
            </div>
            <div className="md:col-span-4 bg-background/90 backdrop-blur border border-border p-5 rounded-sm font-mono text-[10px] text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-2 mb-3 text-accent">
                <span className="size-1.5 rounded-full bg-[color:var(--signal)] animate-pulse" />
                <span>SYSTEM_STATUS · NOMINAL</span>
              </div>
              <div>REASONING_STAGES · 12</div>
              <div>EXECUTIVE_DOCTRINES · 11</div>
              <div>RAW_AI_COGNITION · DISABLED</div>
              <div>VALIDATION_INVARIANTS · 9</div>
              <div>AUDIT_EXPORTS · SIGNED</div>
              <div>AUTONOMY_LEVELS · L1–L4</div>
            </div>
          </div>
        </section>

        {/* PAIN */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="font-mono text-[10px] tracking-widest text-accent mb-2">THE PROBLEM</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 max-w-3xl">
              Your company already has the answers. They're just impossible to reach in time.
            </h2>
            <p className="text-muted-foreground max-w-2xl mb-12 leading-relaxed">
              Strategy stalls in slide decks. Knowledge hides in inboxes. And generic AI tools bring
              no professional judgement to the table. Coxec closes both gaps.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {PAIN.map(([t, d]) => (
                <div key={t} className="border border-border bg-surface p-6 rounded-sm">
                  <h3 className="font-bold tracking-tight">{t}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5">
                <p className="mb-2 font-mono text-[10px] uppercase text-accent">
                  Synthesized—not simulated
                </p>
                <h2 className="max-w-xl text-3xl font-bold md:text-4xl">
                  Executive frameworks synthesized from world-renowned leadership practice.
                </h2>
                <p className="mt-5 text-muted-foreground leading-relaxed">
                  Coxec does not ask a general-purpose model to role-play an executive. Its eleven
                  officers use original cognitive frameworks synthesized from the publicly
                  documented methods of accomplished CEOs, CTOs, investors, operators, strategists,
                  and leading management institutions.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Each framework combines explicit heuristics, recurring questions, decision
                  disciplines, and failure-mode checks—then grounds that professional judgement in
                  your company’s governed data.
                </p>
                <p className="mt-4 text-xs text-muted-foreground leading-relaxed border-l-2 border-primary pl-4">
                  Coxec never impersonates or claims endorsement from any person. It synthesizes
                  shared public principles into original, governed operating judgement.
                </p>
              </div>
              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-px bg-border border border-border">
                {FRAMEWORKS.map(([discipline, framework]) => (
                  <div key={discipline} className="bg-background p-5">
                    <div className="font-mono text-[10px] uppercase text-accent">{discipline}</div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/80">{framework}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section id="demo" className="border-t border-border bg-surface">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-accent mb-2">
                  LIVE WALKTHROUGH
                </p>
                <h2 className="text-3xl font-bold tracking-tight">
                  See mission control in motion.
                </h2>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                Recorded from the live Coxec workspace · loops continuously
              </span>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-center">
              <div className="min-w-0">
                <MacbookFrame label="COXEC · PRODUCT DEMO">
                  <video
                    className="block aspect-video w-full bg-background"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="Coxec product demo preview"
                  >
                    <source src="/secp-demo.webm" type="video/webm" />
                    <source src="/secp-demo.mp4" type="video/mp4" />
                  </video>
                </MacbookFrame>
              </div>
              <SampleDirectives />
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                to={"/demo" as never}
                className="bg-primary px-6 py-3 font-mono text-[11px] uppercase text-primary-foreground hover:bg-accent"
              >
                Open the complete demo →
              </Link>
            </div>
          </div>
        </section>

        {/* LAYERS */}
        <section id="layers" className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="font-mono text-[10px] tracking-widest text-accent mb-2">THE PLATFORM</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 max-w-3xl">
              One platform. Six intelligence layers. A complete AI organization.
            </h2>
            <p className="text-muted-foreground max-w-2xl mb-12 leading-relaxed">
              Read from the bottom up: your data is the foundation, and each layer builds on the one
              below. Tap a layer to see what it does.
            </p>
            <LayerStack />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="border-t border-border bg-surface">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="font-mono text-[10px] tracking-widest text-accent mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 max-w-3xl">
              From sign-up to a working AI council in an afternoon.
            </h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
              {HOW.map(([n, t, d]) => (
                <div key={n} className="flex gap-5">
                  <span className="font-mono text-accent text-sm pt-1 shrink-0">{n}</span>
                  <div>
                    <h3 className="font-bold tracking-tight text-lg">{t}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <AutonomySlider />
          </div>
        </section>

        {/* GOVERNANCE / PROOF */}
        <section id="governance" className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="font-mono text-[10px] tracking-widest text-accent mb-2">
              BUILT FOR THE BOARDROOM
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 max-w-3xl">
              Powerful enough to run on. Transparent enough to trust.
            </h2>
            <p className="text-muted-foreground max-w-2xl mb-12 leading-relaxed">
              Coxec was designed for organizations where "the AI said so" is never an acceptable
              answer.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {PROOF.map(([t, d]) => (
                <div key={t} className="border border-border bg-surface p-6 rounded-sm">
                  <h3 className="font-bold tracking-tight">{t}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-surface">
          <div className="max-w-6xl mx-auto px-6 py-24 text-center">
            <p className="font-mono text-[10px] tracking-widest text-accent mb-4">MISSION READY</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
              Your competitors are hiring AI. You're about to promote it.
            </h2>
            <p className="mt-6 text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Create your workspace, activate your first cognitive executive, and issue your first
              directive today. The Operator Academy walks you through every screen.
            </p>
            <div className="mt-10 flex justify-center gap-3 flex-wrap">
              <Link
                to="/auth"
                className="bg-primary text-primary-foreground px-8 py-3 text-[11px] font-mono uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Get started free →
              </Link>
              <Link
                to={"/demo" as never}
                className="border border-border px-8 py-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Open product demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-6 font-mono text-[10px] text-muted-foreground">
          <div>
            <CoxecLogo />
            <p className="leading-relaxed mt-3">
              Specialized executive judgement, grounded in your organization.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to={"/demo" as never} className="hover:text-foreground">
              Product demo
            </Link>
            <a href="#layers" className="hover:text-foreground">
              Six layers
            </a>
            <Link to={"/data-room" as never} className="hover:text-foreground">
              Investor data room
            </Link>
          </div>
          <div className="flex md:justify-end items-start">
            <Link to="/auth" className="text-primary hover:underline">
              Sign in →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
