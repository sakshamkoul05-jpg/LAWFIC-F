/**
 * A customer's wallet preferences.
 *
 * The card is gone. It held an `entity` and a `finish` — a statutory
 * identifier and a surface treatment for a credit-card face — and that whole
 * metaphor was untrue: LAWFIC issues no card, and nothing it holds can be
 * tapped or swiped. What a customer actually has is a prepaid balance for
 * filings, so the object is now a leather wallet and the choices are the ones
 * a wallet offers.
 *
 *   hide       — the leather. Five, each with its own grain and stitch.
 *   plate      — the metal nameplate: brass, steel or blackened.
 *   thread     — the stitching: tonal, contrast or brass.
 *   nameplate  — what is stamped on it. A person's name or their firm's.
 *   avatarSeed — unchanged; the avatar moves onto the wallet.
 *
 * The filing signature is not stored and never was: it derives from the
 * customer's real ledger at render time.
 *
 * Everything here is cosmetic. None of it touches a balance, the ledger or an
 * order — the boundary the card model kept, kept.
 */

import {
  HIDES,
  PLATES,
  THREADS,
  getHide,
  getPlate,
  normalizeNameplate,
  NAMEPLATE_MAX,
  type HideId,
  type PlateId,
  type ThreadId,
} from "./wallet-leather";

export { HIDES, PLATES, THREADS, getHide, getPlate, normalizeNameplate, NAMEPLATE_MAX };
export type { HideId, PlateId, ThreadId };

export type WalletPrefs = {
  hide: HideId;
  plate: PlateId;
  thread: ThreadId;
  nameplate: string;
  avatarSeed: string;
};

export const DEFAULT_PREFS: WalletPrefs = {
  hide: "midnight",
  plate: "brass",
  thread: "contrast",
  nameplate: "",
  avatarSeed: "Felix",
};

/**
 * Seeds for the avatar picker. Internal keys, never shown — each produces a
 * fixed face.
 */
export const AVATAR_SEEDS = [
  "Felix", "Aneka", "Jasper", "Lola", "Milo",
  "Nala", "Oscar", "Piper", "Quinn", "Remy",
  "Sage", "Toni", "Uma", "Vex", "Wren",
];

/**
 * Rows written before the wallet existed still hold a card `finish`, and
 * before that a `cardType`. Neither maps onto anything meaningful now — a
 * surface treatment for a plastic card says nothing about which leather
 * someone would pick — so they map onto the default hide rather than a guess
 * dressed up as a migration. What a customer chose that still matters, their
 * avatar, survives untouched.
 */
export function normalizePrefs(input: unknown): WalletPrefs | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;

  const rawSeed = typeof obj.avatarSeed === "string" ? obj.avatarSeed.trim() : "";
  if (!rawSeed) return null;

  return {
    hide: getHide(String(obj.hide ?? ""))?.id ?? DEFAULT_PREFS.hide,
    plate: getPlate(String(obj.plate ?? ""))?.id ?? DEFAULT_PREFS.plate,
    thread:
      THREADS.find((t) => t.id === String(obj.thread ?? ""))?.id ?? DEFAULT_PREFS.thread,
    nameplate: normalizeNameplate(obj.nameplate),
    avatarSeed: rawSeed.slice(0, 64),
  };
}
