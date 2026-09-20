import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

/**
 * The gate every back-office server action passes through.
 *
 * WHY EVERY ACTION RE-CHECKS, AND NOT JUST THE PAGE
 *
 * A server action is a public endpoint with a generated name. It is not
 * protected by the page that renders the form — anybody who has seen the name
 * can POST to it directly, signed in as anyone. An action that trusts the page
 * to have gated it is an action with no gate.
 *
 * RLS refuses the write regardless, because every back-office table requires
 * `is_staff()`. This check exists as well for two reasons: it turns a silently
 * empty result into an honest error message, and it means a policy dropped by
 * accident does not quietly open a door.
 *
 * WHY THIS LIVES HERE RATHER THAN IN EACH actions.ts
 *
 * There are three of them now — banners, categories, jobs — and the day one
 * copy is updated and the others are not is the day "staff only" means three
 * different things.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export type StaffGate = { supabase: SupabaseClient } | { error: string };

export async function staffClient(): Promise<StaffGate> {
  const supabase = await createClient();
  if (!supabase) return { error: "No database is configured for this build." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in first." };

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) return { error: "This is a staff-only action." };

  return { supabase };
}

/**
 * Turn a Postgres error into something an agent can act on.
 *
 * The raw message is kept — hiding it makes a real fault unreportable — but
 * the two failures that are actually somebody's mistake rather than a bug get
 * said plainly first.
 */
export function describeWriteError(message: string): string {
  if (message.includes("duplicate key")) {
    return "Something with that id or slug already exists.";
  }
  if (message.includes("violates foreign key")) {
    return "That references something which no longer exists — reload and try again.";
  }
  return message;
}
