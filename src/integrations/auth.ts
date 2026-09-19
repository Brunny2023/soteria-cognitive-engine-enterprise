import { supabase } from "@/integrations/supabase/client";

export type OAuthProvider = "google" | "apple" | "azure";

export const auth = {
  signInWithOAuth: async (provider: OAuthProvider, redirectUri: string) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUri },
    });
    return { data, error };
  },
};
