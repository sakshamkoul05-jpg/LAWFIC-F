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

/* Card faces, re-grounded in the LAWFIC palette.
   These were Tailwind defaults — violet-600, gray-800, cyan-500, blue-700 —
   with violet as the DEFAULT card, which put a purple product in front of a
   black-and-gold brand. Variety is still the point (people like choosing a
   card), so there are still five; they now vary within one world instead of
   sampling five unrelated ones.

   Every face stays lighter than the dark ground (#121110). A card whose
   darkest stop equals the page background stops reading as an object sitting
   on the page and starts reading as a hole cut in it. */
export const CARD_TYPES: CardType[] = [
  {
    id: "standard",
    name: "Standard",
    desc: "Warm ink and gold — the house card.",
    gradient: "linear-gradient(135deg, #3A3630 0%, #2C2823 45%, #211E1A 100%)",
    accent: "#F3EFE8",
    accentSub: "rgba(243,239,232,0.62)",
    chipGradient: "linear-gradient(135deg, #E8C86A 0%, #D0AE55 35%, #A8842F 70%, #7A5E14 100%)",
    pocketGradient: "linear-gradient(135deg, #1C1A17 0%, #0E0D0B 100%)",
  },
  {
    id: "premium",
    name: "Premium",
    desc: "Gold on near-black — for the ones who lead.",
    gradient: "linear-gradient(135deg, #2A241A 0%, #201B14 45%, #17130E 100%)",
    accent: "#DCBC68",
    accentSub: "rgba(220,188,104,0.68)",
    chipGradient: "linear-gradient(135deg, #F0D678 0%, #D0AE55 35%, #A8842F 70%, #7A5E14 100%)",
    pocketGradient: "linear-gradient(135deg, #0E0C0A 0%, #1A1712 100%)",
  },
  {
    id: "business",
    name: "Business",
    desc: "Warm charcoal and silver — sharp and plain.",
    gradient: "linear-gradient(135deg, #47433D 0%, #363229 45%, #26231F 100%)",
    accent: "#DAD5CC",
    accentSub: "rgba(218,213,204,0.6)",
    chipGradient: "linear-gradient(135deg, #E4E0D8 0%, #B0AAA0 35%, #7E7972 70%, #56524C 100%)",
    pocketGradient: "linear-gradient(135deg, #1B1917 0%, #0D0C0B 100%)",
  },
  {
    id: "student",
    name: "Student",
    desc: "Muted jade — for the ones starting out.",
    gradient: "linear-gradient(135deg, #35594F 0%, #26443D 45%, #1B322C 100%)",
    accent: "#E6EFE9",
    accentSub: "rgba(230,239,233,0.62)",
    chipGradient: "linear-gradient(135deg, #E8C86A 0%, #D0AE55 35%, #A8842F 70%, #7A5E14 100%)",
    pocketGradient: "linear-gradient(135deg, #142722 0%, #0B1614 100%)",
  },
  {
    id: "advocate",
    name: "Advocate",
    desc: "Deep ink-blue and gold — the legal seal.",
    gradient: "linear-gradient(135deg, #303A50 0%, #222A3C 45%, #181D2A 100%)",
    accent: "#DCBC68",
    accentSub: "rgba(220,188,104,0.68)",
    chipGradient: "linear-gradient(135deg, #F0D678 0%, #D0AE55 35%, #A8842F 70%, #7A5E14 100%)",
    pocketGradient: "linear-gradient(135deg, #10141E 0%, #080A11 100%)",
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
