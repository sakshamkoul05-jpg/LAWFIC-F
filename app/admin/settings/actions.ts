"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SETTING_KEYS, parseSetting, type SettingKey } from "@/lib/settings";

/**
 * Settings writes, each one recorded.
 *
 * THE AUDIT ROW IS WRITTEN AFTER THE CHANGE, NOT BEFORE
 *
 * Logging first and then writing produces a log entry for something that did
 * not happen when the write fails — the worse of the two failures, because a
 * log that records fictional changes is worse than one that misses real ones.
 * Ordered this way, a crash between the two loses the record of a change that
 * did occur, which the `updated_at` on the row still evidences.
 *
 * IT RECORDS THE BEFORE
 *
 * "Someone changed the support phone" is an alert. "Someone changed it from
 * one number to another at 03:14" is an explanation, and the difference
 * matters most on the day it is needed. The previous value is read in the same
 * request, immediately before the update.
 */

type Result = { ok: true } | { ok: false; error: string };

type Gate = { supabase: SupabaseClient } | { error: string };

async function staffClient(): Promise<Gate> {
  const supabase = await createClient();
  if (!supabase) return { error: "No database is configured for this build." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in first." };

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) return { error: "This is a staff-only action." };

  return { supabase };
}

function isSettingKey(k: string): k is SettingKey {
  return (SETTING_KEYS as string[]).includes(k);
}

/** Short enough to read in a list, long enough to say what happened. */
function describe(value: unknown): string {
  if (typeof value === "string") return value.length > 60 ? `${value.slice(0, 57)}…` : value;
  if (Array.isArray(value)) return `${value.length} line${value.length === 1 ? "" : "s"}`;
  if (value && typeof value === "object") {
    const on = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
    return on.length ? `on: ${on.join(", ")}` : "all off";
  }
  return String(value);
}

export async function saveSetting(key: string, value: unknown): Promise<Result> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  /* An unknown key would insert a row nothing reads — a setting that appears
     to save and then does nothing, which is the most confusing outcome
     available on a settings page. */
  if (!isSettingKey(key)) return { ok: false, error: "That is not a setting this site has." };

  const parsed = parseSetting(key, value);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const { data: existing } = await gate.supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  const before = (existing as { value: unknown } | null)?.value ?? null;

  /* Upsert, because a key that has never been changed has no row — the seed
     covers the ones that shipped, but a setting added in a later release
     would otherwise fail to save until somebody inserted it by hand. */
  const { error } = await gate.supabase
    .from("site_settings")
    .upsert({ key, value: parsed.value }, { onConflict: "key" });

  if (error) return { ok: false, error: error.message };

  await gate.supabase.rpc("log_admin_action", {
    p_action: "update",
    p_entity: "setting",
    p_entity_id: key,
    p_summary: `${key}: ${describe(before)} → ${describe(parsed.value)}`,
    p_before: before,
    p_after: parsed.value,
  });

  /* The layout reads settings, so every page is affected. `layout` scope
     rather than a list of paths — enumerating them means the one page added
     next month goes stale and nobody knows why. */
  revalidatePath("/", "layout");
  return { ok: true };
}
