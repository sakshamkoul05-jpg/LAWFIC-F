"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Browser client. Uses the publishable anon key, which is in the JS bundle by
 * design — it is only safe because RLS constrains what it can do. Never
 * disable RLS on a table this key can reach.
 */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export { isSupabaseConfigured };
