import type { ReactNode } from "react";

/**
 * The LAWFIC wallet "collector card" customization kit.
 *
 * A wallet feels owned when it can become yours: a material (skin) you choose
 * for the card face, and a few pinned badges (flairs) that say who you are in
 * the system. Everything here is cosmetic — a skin or a flair never touches a
 * balance, the ledger, or an order. That boundary is the point of the feature.
 *
 * Validation lives here because the server route, the customize form, and the
 * card all need the same idea of what is a valid choice.
 */

export type SkinId =
  | "gilded"
  | "midnight-satin"
  | "jade"
  | "slate-onyx"
  | "ivory"
  | "rose-brass";

export type FlairId =
  | "scales"
  | "pillar"
  | "quill"
  | "shield"
  | "star"
  | "bolt";

export type WalletPrefs = {
  skin: SkinId;
  flairs: FlairId[];
};

export type Skin = {
  id: SkinId;
  name: string;
  desc: string;
  /** CSS background for the card face. */
  bg: string;
  /** A small CSS value for the chip + accents so it reads on the material. */
  accent: string;
  /** Overlay tint applied to the card face. */
  vein: string;
};

export type Flair = {
  id: FlairId;
  label: string;
  /** An inline SVG glyph (24x24 viewBox). */
  glyph: ReactNode;
};

export const MAX_FLAIRS = 3;

export const SKINS: Skin[] = [
  {
    id: "gilded",
    name: "Gilded",
    desc: "Warm gold leaf on dark. The signature.",
    bg: "radial-gradient(140% 120% at 20% 10%, #3a2f12 0%, #17140c 45%, #0d0c08 100%)",
    accent: "#e8c86a",
    vein: "rgba(232,200,106,0.10)",
  },
  {
    id: "midnight-satin",
    name: "Midnight Satin",
    desc: "Cool graphite with a soft sheen.",
    bg: "linear-gradient(150deg, #23262b 0%, #14161a 55%, #0c0d10 100%)",
    accent: "#b9c2cf",
    vein: "rgba(255,255,255,0.05)",
  },
  {
    id: "jade",
    name: "Jade",
    desc: "Deep green, calm and assured.",
    bg: "linear-gradient(150deg, #173c30 0%, #0e241c 60%, #08140f 100%)",
    accent: "#7fc98e",
    vein: "rgba(127,201,142,0.08)",
  },
  {
    id: "slate-onyx",
    name: "Slate Onyx",
    desc: "Near-black with a faint blue cast.",
    bg: "linear-gradient(150deg, #1a1f26 0%, #10141a 55%, #090c10 100%)",
    accent: "#8fa5bf",
    vein: "rgba(143,165,191,0.06)",
  },
  {
    id: "ivory",
    name: "Ivory",
    desc: "Ink on warm bone — an editorial ledger.",
    bg: "linear-gradient(150deg, #f1e9d8 0%, #e6dcc5 55%, #d9cdb2 100%)",
    accent: "#1c1a16",
    vein: "rgba(28,26,22,0.05)",
  },
  {
    id: "rose-brass",
    name: "Rose Brass",
    desc: "Warm copper-rose, softly burnished.",
    bg: "linear-gradient(150deg, #3c2430 0%, #271720 55%, #170c12 100%)",
    accent: "#d9a9b4",
    vein: "rgba(217,169,180,0.08)",
  },
];

export const FLAIRS: Flair[] = [
  {
    id: "scales",
    label: "Legal Eagle",
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M4 7h16" />
        <path d="M7 7l-3 5a3 3 0 0 0 5 0l-2-5" />
        <path d="M17 7l-3 5a3 3 0 0 0 5 0l-2-5" />
      </svg>
    ),
  },
  {
    id: "pillar",
    label: "Justice",
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V10M12 21V6M19 21V10" />
        <path d="M3 10h16" />
        <path d="M9 6h6" />
        <path d="M12 3v3" />
      </svg>
    ),
  },
  {
    id: "quill",
    label: "Advocate",
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 4c-3 1-11 7-13 13l-1 4" />
        <path d="M16 8c0 2 0 7-3 9" />
        <path d="M4 10v4h4" />
      </svg>
    ),
  },
  {
    id: "shield",
    label: "Counsel",
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "star",
    label: "Top filer",
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M12 3l2.5 6 6.5.5-5 4 1.5 6.5L12 17l-5.5 3 1.5-6.5-5-4 6.5-.5L12 3z" />
      </svg>
    ),
  },
  {
    id: "bolt",
    label: "Swift payer",
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" />
      </svg>
    ),
  },
];

export const DEFAULT_PREFS: WalletPrefs = { skin: "gilded", flairs: [] };

export function getSkin(id: string): Skin | undefined {
  return SKINS.find((s) => s.id === id);
}

export function getFlair(id: string): Flair | undefined {
  return FLAIRS.find((f) => f.id === id);
}

/**
 * Accepts unknown input from the wire and returns a valid WalletPrefs, or null
 * if it is irredeemably malformed. Used by the PUT route so the browser can
 * never plant a bogus skin. `flairs` are de-duplicated, trimmed to MAX_FLAIRS,
 * and only valid ids are kept.
 */
export function normalizePrefs(input: unknown): WalletPrefs | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;

  const skin = getSkin(String(obj.skin ?? ""))?.id;
  if (!skin) return null;

  if (!Array.isArray(obj.flairs)) return null;
  const seen = new Set<FlairId>();
  for (const id of obj.flairs) {
    const f = getFlair(String(id));
    if (f && !seen.has(f.id) && seen.size < MAX_FLAIRS) seen.add(f.id);
  }

  return { skin, flairs: [...seen] };
}
