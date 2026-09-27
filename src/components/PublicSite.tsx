import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CoxecLogo } from "@/components/CoxecLogo";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link to="/" aria-label="Coxec home">
          <CoxecLogo />
        </Link>
        <nav
          aria-label="Public navigation"
          className="hidden items-center gap-7 font-mono text-[10px] uppercase text-muted-foreground md:flex"
        >
          <Link to={"/demo" as never} className="hover:text-foreground">
            Product demo
          </Link>
          <Link to={"/data-room" as never} className="hover:text-foreground">
            Data room
          </Link>
          <Link to="/auth" className="text-primary hover:text-accent">
            Sign in
          </Link>
        </nav>
        <Button asChild size="sm" className="md:hidden">
          <Link to={"/demo" as never}>Demo</Link>
        </Button>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-3 md:px-8">
        <div>
          <CoxecLogo />
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Governed executive cognition, grounded in your organization.
          </p>
        </div>
        <div className="flex flex-col gap-2 font-mono text-[10px] uppercase text-muted-foreground">
          <Link to={"/demo" as never} className="hover:text-foreground">
            Product demo
          </Link>
          <Link to={"/data-room" as never} className="hover:text-foreground">
            Investor data room
          </Link>
          <Link to="/auth" className="hover:text-foreground">
            Operator sign in
          </Link>
        </div>
        <div className="font-mono text-[9px] uppercase leading-relaxed text-muted-foreground md:text-right">
          Coxec · Executive cognition platform
          <br />
          Evidence before assertion
        </div>
      </div>
    </footer>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <p className="font-mono text-[10px] uppercase text-accent">{eyebrow}</p>
        <h1 className="mt-4 max-w-5xl text-4xl font-bold leading-tight md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}

export function MacbookFrame({
  children,
  label = "COXEC · LIVE PRODUCT",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl" aria-label="Coxec product shown in a MacBook mockup">
      <div className="rounded-t-xl border-[6px] border-secondary bg-secondary p-1 shadow-2xl">
        <div className="relative overflow-hidden rounded-md border border-border bg-background">
          <div className="absolute left-1/2 top-0 z-20 h-3 w-24 -translate-x-1/2 rounded-b-md bg-secondary" />
          <div className="border-b border-border bg-surface px-4 py-2 font-mono text-[8px] uppercase text-muted-foreground">
            {label}
          </div>
          {children}
        </div>
      </div>
      <div className="mx-auto h-3 w-full rounded-b-xl border border-border bg-secondary sm:w-[104%] sm:-translate-x-[1.9%]" />
      <div className="mx-auto h-1 w-1/3 rounded-b-full bg-muted" />
    </div>
  );
}

export function CommercialCta({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={
        compact ? "border border-border bg-surface p-7" : "border-y border-border bg-surface"
      }
    >
      <div className={compact ? "" : "mx-auto max-w-7xl px-5 py-20 text-center md:px-8"}>
        <p className="font-mono text-[10px] uppercase text-accent">
          Licensing · Acquisition · Partnership
        </p>
        <h2 className={`mt-3 font-bold ${compact ? "text-2xl" : "text-3xl md:text-5xl"}`}>
          Put Coxec inside your operating model.
        </h2>
        <p
          className={`mt-4 text-sm leading-relaxed text-muted-foreground ${compact ? "" : "mx-auto max-w-2xl"}`}
        >
          Discuss enterprise licensing, strategic deployment, channel partnership, or an acquisition
          process with the Coxec team.
        </p>
        <div className={`mt-7 flex flex-wrap gap-3 ${compact ? "" : "justify-center"}`}>
          <Button asChild>
            <Link to="/auth">
              Request commercial access <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={"/data-room" as never}>Review data room</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
