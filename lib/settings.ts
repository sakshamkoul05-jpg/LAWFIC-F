import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { company } from "./company";
import { ANNOUNCEMENTS } from "./announcements";

/**
 * Site settings, read from the database and validated on the way in.
 *
 * EVERY KEY HAS A SCHEMA AND A COMPILED DEFAULT
 *
 * The table stores jsonb, which the database cannot type-check — that is the
 * price of a settings store that does not need a migration to gain a setting.
 * The check has to happen here instead, and it has to happen on every read: a
 * row written by an older version of a form, or by hand in the SQL editor, must
 * not reach a component.
 *
 * A value that fails its schema falls back to the constant the site shipped
 * with. So the worst case for a malformed setting is that the site looks like
 * it did before anyone touched it, rather than a blank footer or a crash on the
 * home page. That is the right failure for configuration: the page still works
 * and the back office is where the problem is visible.
 *
 * ONE ROUND TRIP, NOT ONE PER KEY
 *
 * `loadSettings` fetches the whole table at once. There are a handful of keys
 * and they are read together on nearly every page; six selects to build one
 * header would be six round trips before anything renders.
 */

const Sections = z.object({
  promotions: z.boolean(),
  why: z.boolean(),
  trending: z.boolean(),
  categories: z.boolean(),
});

/* A key is defined by its schema and its fallback, together. Keeping them in
   one place is what makes it impossible to add a setting and forget what
   should happen when it is missing. */
const KEYS = {
  "contact.support_email": {
    schema: z.string().email().or(z.literal("")),
    fallback: () => company.supportEmail ?? "",
  },
  "contact.support_phone": {
    schema: z.string().max(24),
    fallback: () => company.supportPhone ?? "",
  },
  "contact.support_hours": {
    schema: z.string().max(80),
    fallback: () => company.supportHours ?? "",
  },
  "home.sections": {
    schema: Sections,
    fallback: () => ({ promotions: true, why: true, trending: true, categories: true }),
  },
  "ticker.lines": {
    /* At least one line, because an empty strip is a black band with nothing
       in it — which reads as broken rather than as switched off. Pulling the
       strip is a different control. */
    schema: z.array(z.string().trim().min(1).max(60)).min(1).max(20),
    fallback: () => ANNOUNCEMENTS,
  },
  "site.banner_notice": {
    schema: z.string().max(160),
    fallback: () => "",
  },
} as const;

export type SettingKey = keyof typeof KEYS;

export type Settings = {
  [K in SettingKey]: z.infer<(typeof KEYS)[K]["schema"]>;
};

/** Everything at its shipped value. Also what a failed read returns. */
export function defaultSettings(): Settings {
  return Object.fromEntries(
    Object.entries(KEYS).map(([k, def]) => [k, def.fallback()]),
  ) as Settings;
}

export function settingDescription(key: SettingKey): string {
  return DESCRIPTIONS[key];
}

/* Mirrors the `description` column so the back office can label a field even
   before the row exists. */
const DESCRIPTIONS: Record<SettingKey, string> = {
  "contact.support_email": "Shown in the footer and on the contact page.",
  "contact.support_phone": "Shown in the footer. Empty hides the line entirely.",
  "contact.support_hours": "The line under the support contact details.",
  "home.sections": "Which blocks the home page shows to everyone.",
  "ticker.lines": "The running strip above the header.",
  "site.banner_notice":
    "One line shown site-wide above the header — an outage, a holiday, a deadline. Empty shows nothing.",
};

export const SETTING_KEYS = Object.keys(KEYS) as SettingKey[];

/**
 * Read the settings.
 *
 * RLS decides what comes back: a signed-out visitor sees only rows flagged
 * public, staff see everything. Anything not returned — private, missing, or
 * malformed — resolves to its compiled default, so this function always
 * returns a complete object and no caller has to handle a partial one.
 */
export async function loadSettings(client: SupabaseClient | null): Promise<Settings> {
  const settings = defaultSettings();
  if (!client) return settings;

  try {
    const { data, error } = await client.from("site_settings").select("key, value");
    if (error || !data) return settings;

    for (const row of data as { key: string; value: unknown }[]) {
      const def = KEYS[row.key as SettingKey];
      if (!def) continue;
      const parsed = def.schema.safeParse(row.value);
      if (parsed.success) {
        /* The cast is safe because the key indexes the same map the schema
           came from; TypeScript cannot see that through a string index. */
        (settings as Record<string, unknown>)[row.key] = parsed.data;
      }
      /* A row that fails its schema is silently left at the default. It is
         logged nowhere on purpose — this runs on every page render, and a
         malformed setting would otherwise fill the logs once per request. The
         back office shows the raw value, which is where it can be fixed. */
    }
    return settings;
  } catch {
    return settings;
  }
}

/** Validate one value before writing it. Used by the back office form. */
export function parseSetting(
  key: SettingKey,
  value: unknown,
): { ok: true; value: unknown } | { ok: false; error: string } {
  const parsed = KEYS[key].schema.safeParse(value);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, error: parsed.error.issues[0]?.message ?? "That value is not valid." };
}
