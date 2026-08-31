import type { ReactNode } from "react";

/**
 * The LAWFIC wallet "collector card" customization kit.
 *
 * A wallet feels owned when it can become yours: a card type that reflects
 * your identity, and an avatar (DiceBear) that represents you on the card.
 * Everything here is cosmetic — a card type or avatar never touches a balance,
 * the ledger, or an order. That boundary is the point of the feature.
 *
 * Validation lives here because the server route, the customize form, and the
 * card all need the same idea of what is a valid choice.
 */

// ─── Card Types ─────────────────────────────────────────────────────────────

export type CardTypeId = "standard" | "premium" | "business" | "student" | "advocate";

export type CardType = {
  id: CardTypeId;
  name: string;
  desc: string;
  /** CSS gradient for the card face. */
  gradient: string;
  /** Primary accent color (text, chip, highlights). */
  accent: string;
  /** Secondary accent (subtle text, badges). */
  accentSub: string;
  /** Gradient for the gold chip area. */
  chipGradient: string;
  /** CSS gradient for the pocket body. */
  pocketGradient: string;
};

export const CARD_TYPES: CardType[] = [
  {
    id: "standard",
    name: "Standard",
    desc: "The classic purple — clean, confident, yours.",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #5b21b6 100%)",
    accent: "#ffffff",
    accentSub: "rgba(255,255,255,0.7)",
    chipGradient: "linear-gradient(135deg, #e8c86a 0%, #d4af37 35%, #b8860b 70%, #8d6407 100%)",
    pocketGradient: "linear-gradient(135deg, #4c1d95 0%, #3b0764 100%)",
  },
  {
    id: "premium",
    name: "Premium",
    desc: "Gold on dark — for the ones who lead.",
    gradient: "linear-gradient(135deg, #1c1917 0%, #292524 40%, #1c1917 100%)",
    accent: "#e8c86a",
    accentSub: "rgba(232,200,106,0.7)",
    chipGradient: "linear-gradient(135deg, #f0d678 0%, #d4af37 35%, #b8860b 70%, #8d6407 100%)",
    pocketGradient: "linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)",
  },
  {
    id: "business",
    name: "Business",
    desc: "Charcoal and silver — sharp and professional.",
    gradient: "linear-gradient(135deg, #374151 0%, #1f2937 40%, #111827 100%)",
    accent: "#d1d5db",
    accentSub: "rgba(209,213,219,0.6)",
    chipGradient: "linear-gradient(135deg, #e5e7eb 0%, #9ca3af 35%, #6b7280 70%, #4b5563 100%)",
    pocketGradient: "linear-gradient(135deg, #111827 0%, #030712 100%)",
  },
  {
    id: "student",
    name: "Student",
    desc: "Teal and bright — for the ones starting out.",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 40%, #0e7490 100%)",
    accent: "#ffffff",
    accentSub: "rgba(255,255,255,0.7)",
    chipGradient: "linear-gradient(135deg, #e8c86a 0%, #d4af37 35%, #b8860b 70%, #8d6407 100%)",
    pocketGradient: "linear-gradient(135deg, #155e75 0%, #164e63 100%)",
  },
  {
    id: "advocate",
    name: "Advocate",
    desc: "Deep blue and gold — the legal seal.",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 40%, #1d4ed8 100%)",
    accent: "#e8c86a",
    accentSub: "rgba(232,200,106,0.7)",
    chipGradient: "linear-gradient(135deg, #f0d678 0%, #d4af37 35%, #b8860b 70%, #8d6407 100%)",
    pocketGradient: "linear-gradient(135deg, #172554 0%, #1e3a5f 100%)",
  },
];

// ─── Wallet Prefs ───────────────────────────────────────────────────────────

export type WalletPrefs = {
  cardType: CardTypeId;
  avatarSeed: string;
};

export const DEFAULT_PREFS: WalletPrefs = {
  cardType: "standard",
  avatarSeed: "Felix",
};

/** Pre-set avatar seeds for the picker — names that produce good lorelei avatars. */
export const AVATAR_SEEDS = [
  "Felix", "Aneka", "Jasper", "Lola", "Milo",
  "Nala", "Oscar", "Piper", "Quinn", "Remy",
  "Sage", "Toni", "Uma", "Vex", "Wren",
];

export function getCardType(id: string): CardType | undefined {
  return CARD_TYPES.find((ct) => ct.id === id);
}

/**
 * Accepts unknown input from the wire and returns a valid WalletPrefs, or null
 * if it is irredeemably malformed. Used by the PUT route so the browser can
 * never plant a bogus card type. avatarSeed is trimmed and capped at 64 chars.
 */
export function normalizePrefs(input: unknown): WalletPrefs | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;

  const cardType = getCardType(String(obj.cardType ?? ""))?.id;
  if (!cardType) return null;

  const rawSeed = typeof obj.avatarSeed === "string" ? obj.avatarSeed.trim() : "";
  if (!rawSeed) return null;
  const avatarSeed = rawSeed.slice(0, 64);

  return { cardType, avatarSeed };
}
