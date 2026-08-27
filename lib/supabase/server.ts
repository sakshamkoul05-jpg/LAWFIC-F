import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Server-side Supabase client, bound to the request's cookies so the signed-in
 * user's session is carried into RLS.
 *
 * Always the ANON key, never the service role — this client's queries are
 * meant to be constrained by RLS. The service role bypasses RLS entirely and
 * has no business anywhere near a request a visitor can trigger.
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Session refresh happens in proxy.ts, so this is safe to ignore.
        }
      },
    },
  });
}

/** The signed-in user, or null. Never throws when Supabase is unconfigured. */
export async function getUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
