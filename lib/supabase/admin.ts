import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * There are exactly two legitimate callers:
 *
 *   1. the Razorpay webhook, which arrives with no user session but is
 *      authenticated by an HMAC signature over the raw body, and has to write
 *      a wallet credit — something no client role may ever do;
 *   2. the top-up route, which records a payment_intent after checking the
 *      caller's session itself.
 *
 * Rules for this file:
 *   - never import it into a client component, or anything reachable from one;
 *   - never use it to serve a read on behalf of a user (that is what RLS is for);
 *   - verify the caller BEFORE reaching for it, not after.
 *
 * The key deliberately has no NEXT_PUBLIC_ prefix, so Next will not inline it
 * into the browser bundle even by accident.
 */

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isServiceRoleConfigured = Boolean(URL_ && SERVICE_KEY);

export function createAdminClient(): SupabaseClient | null {
  if (!isServiceRoleConfigured) return null;
  return createSupabaseClient(URL_, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
