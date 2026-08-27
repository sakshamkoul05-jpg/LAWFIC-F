export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * With no keys set the site still renders — every page falls back to its
 * signed-out state and the wallet shows a "not configured" notice instead of
 * throwing. That is the state until a Supabase project exists, so it is a
 * supported path rather than an error case.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
