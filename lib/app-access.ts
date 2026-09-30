import { createClient as createSupabase, type SupabaseClient, type User } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient as createCookieClient } from "@/lib/supabase/server";

/**
 * The LAWFIC mobile app, talking to the same backend as the website.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  HOW THE APP IS AUTHENTICATED
 *
 *  The website carries the Supabase session in cookies. The app has no
 *  cookies; it signs in with the same Supabase project and sends the user's
 *  access token as `Authorization: Bearer <jwt>`. `clientForRequest` accepts
 *  either, and in both cases returns a client built on the ANON key and the
 *  user's own session — so every query is still decided by RLS, exactly as it
 *  is for the website. The service role is never involved in who the caller is.
 *
 *  The token is verified by Supabase (`auth.getUser(jwt)`), not decoded here.
 *  A forged or expired token gets no user and the route answers 401.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * CORS is for the app's browser build only. A native app is not a browser and
 * sends no Origin; these origins are named exactly, never "*".
 */
export const APP_ORIGINS = new Set(["https://law-m.vercel.app", "http://localhost:4173", "http://localhost:8081"]);

export function corsHeaders(request: Request, methods = "POST, OPTIONS"): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !APP_ORIGINS.has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": methods,
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

/** The browser's preflight for the app's origin. */
export function preflight(request: Request, methods = "POST, OPTIONS"): Response {
  const headers = corsHeaders(request, methods);
  return new Response(null, { status: Object.keys(headers).length ? 204 : 403, headers });
}

export function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+([A-Za-z0-9._-]+)$/.exec(h.trim());
  return m ? m[1]! : null;
}

export type RequestClient = {
  supabase: SupabaseClient;
  user: User;
  /** "app" when authenticated by bearer token, "web" by the site's cookies. */
  via: "app" | "web";
};

/** The caller's own Supabase client and user, or null when not signed in. */
export async function clientForRequest(request: Request): Promise<RequestClient | null> {
  if (!isSupabaseConfigured) return null;

  const token = bearerToken(request);
  if (token) {
    const supabase = createSupabase(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { supabase, user: data.user, via: "app" };
  }

  const supabase = await createCookieClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { supabase: supabase as unknown as SupabaseClient, user: data.user, via: "web" };
}
