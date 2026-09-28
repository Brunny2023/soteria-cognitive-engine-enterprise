import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { browserAuthStorage } from "@/integrations/authStorage";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

// These are public browser credentials for the connected Coxec project. Hosting
// environments can and should override them with VITE_* variables; keeping a
// public fallback prevents an otherwise configured production shell from
// disabling account creation when build-time variables were omitted.
const DEFAULT_SUPABASE_URL = "https://ragjpjkkagrfbcwfrefm.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_B6gjdFUrSY0bSUlWFI713w_mzbUdFtO";

export function getSupabaseConfig(): SupabaseConfig | null {
  // Use import.meta.env for client-side (Vite build-time replacement)
  // Fall back to process.env for SSR (server-side rendering)
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    return null;
  }

  return { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

function createSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config) {
    const message =
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for the browser, or SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY for SSR.";
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(config.url, config.publishableKey, {
    global: {
      fetch: createSupabaseFetch(config.publishableKey),
    },
    auth: {
      storage: browserAuthStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
