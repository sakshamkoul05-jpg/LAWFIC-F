import type { SupabaseClient } from "@supabase/supabase-js";
import type { Banner, BannerTone } from "./promotional";
import { promotionalBanners, TONES } from "./promotional";

/**
 * The banners, from the database when there are any and from the code when
 * there are not.
 *
 * WHY THE FALLBACK IS NOT A LOADING STATE
 *
 * The home page's first screen is the carousel. If reading the table fails —
 * no database configured, a migration not yet run, the network having a bad
 * second — the choice is a blank band where the hero should be, or the eleven
 * banners that are compiled into the bundle. The second is obviously better
 * and costs nothing, because the list is already there.
 *
 * It does mean a failed read looks like a successful one, which is normally a
 * thing to avoid. Here it is the right trade: this is marketing copy, not a
 * balance, and nobody is harmed by seeing last week's headline. The back
 * office says plainly whether it is reading the table or the fallback, so the
 * one person who needs to know is told.
 *
 * TONE IS VALIDATED ON THE WAY IN
 *
 * The column has a check constraint, but this code also has to survive a row
 * written before a tone was renamed. An unknown tone falls back to `ink`
 * rather than reaching the component, where `TONES[tone]` would be undefined
 * and the banner would render with `background: linear-gradient(...undefined)`
 * — a transparent band with white text on it.
 */

export type PromotionRow = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  cta_label: string;
  href: string;
  tone: string;
  photo: string | null;
  photo_alt: string | null;
  is_live: boolean;
  position: number;
  starts_at: string | null;
  ends_at: string | null;
};

/** The columns every read of this table wants. Kept in one place so the admin
    list and the public carousel cannot drift apart. */
export const PROMOTION_COLUMNS =
  "id, eyebrow, title, body, cta_label, href, tone, photo, photo_alt, is_live, position, starts_at, ends_at";

function toneOrDefault(tone: string): BannerTone {
  return (Object.prototype.hasOwnProperty.call(TONES, tone) ? tone : "ink") as BannerTone;
}

/** A row as the carousel wants it. */
export function rowToBanner(row: PromotionRow, index: number): Banner {
  return {
    /* The carousel keys and labels slides by a numeric id. Position is not
       unique by design, so the index is what guarantees distinct keys. */
    id: index + 1,
    eyebrow: row.eyebrow,
    title: row.title,
    label: row.body,
    cta: row.cta_label,
    href: row.href,
    tone: toneOrDefault(row.tone),
    ...(row.photo ? { photo: row.photo, photoAlt: row.photo_alt ?? "" } : {}),
  };
}

export type BannerSource = "database" | "fallback";

/**
 * Read the live banners.
 *
 * `client` is passed in rather than created here so this stays usable from a
 * server component, a route handler and the back office without knowing which
 * Supabase client it is holding.
 *
 * RLS does the filtering. The public policy already restricts a select to rows
 * that are live and inside their window, so this query says nothing about
 * `is_live` — repeating the condition here would mean two places to change it
 * and one of them eventually not being changed.
 */
export async function liveBanners(
  client: SupabaseClient | null,
): Promise<{ banners: Banner[]; source: BannerSource }> {
  if (!client) return { banners: promotionalBanners, source: "fallback" };

  try {
    const { data, error } = await client
      .from("promotions")
      .select(PROMOTION_COLUMNS)
      .order("position", { ascending: true });

    const rows = (data ?? []) as PromotionRow[];
    if (error || rows.length === 0) {
      return { banners: promotionalBanners, source: "fallback" };
    }
    return { banners: rows.map(rowToBanner), source: "database" };
  } catch {
    /* A thrown read is the same outcome as a failed one: show the compiled
       list rather than an empty hero. */
    return { banners: promotionalBanners, source: "fallback" };
  }
}
