import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Soteria SECP" },
      { name: "description", content: "Sign in to Soteria SECP to access Mission Control." },
      { property: "og:title", content: "Sign in — Soteria SECP" },
      { property: "og:description", content: "Access the Soteria Enterprise Cognition Platform." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/onboarding", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/onboarding", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(result.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-7 bg-primary rounded-sm flex items-center justify-center text-primary-foreground text-xs font-bold">S</div>
            <span className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">SOTERIA · SECP</span>
          </Link>
          <Link to="/" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back</Link>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md bg-surface border border-border rounded-sm p-8">
          <p className="font-mono text-[10px] tracking-widest text-accent mb-2">M0.0 · CREDENTIAL CHECKPOINT</p>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {mode === "signin" ? "Access Mission Control" : "Register operator"}
          </h1>
          <p className="text-xs text-muted-foreground mb-6">
            {mode === "signin" ? "Sign in with your Soteria operator credentials." : "Provision a new operator account for this workspace."}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full border border-border bg-background hover:bg-secondary py-2.5 px-4 rounded-sm text-sm font-medium mb-4 transition-colors"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">or email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </label>
            {error && (
              <div className="text-[11px] text-[color:var(--danger)] border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 rounded-sm px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="mt-2 bg-primary text-primary-foreground py-2.5 text-[11px] font-mono uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
            >
              {busy ? "…" : mode === "signin" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="mt-6 w-full text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            {mode === "signin" ? "Need an account? Register →" : "Have an account? Sign in →"}
          </button>
        </div>
      </main>
    </div>
  );
}