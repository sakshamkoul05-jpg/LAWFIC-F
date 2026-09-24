/**
 * What a customer's wallet row still holds that the wallet itself does not.
 *
 * WHAT THIS FILE USED TO BE
 *
 * The wallet's whole appearance: a `hide`, a `plate` and a `thread`, describing
 * a leather bifold, and before that an `entity` and a `finish` describing a
 * plastic card. Both of those objects are gone. The product is a card holder
 * configured by finish, colour, stamping, stitch and note style, and all of
 * that now lives in lib/wallet3d/config.ts against the columns the
 * wallet_config migration added.
 *
 * Two fields outlived the redesigns, because neither ever described the object:
 *
 *   nameplate  — what is stamped on it. The wallet reads it as `engraving`.
 *   avatarSeed — the customer's face, which moved from the card to the wallet
 *                to the account header without ever meaning anything else.
 *
 * Keeping a whole vocabulary for a bifold nobody can see any more is how a
 * codebase ends up with two wallets, which is exactly what happened: the
 * no-WebGL fallback drew the bifold while everyone else saw the card holder.
 */

import { normalizeEngraving, ENGRAVING_MAX } from "./wallet3d/config";

export const NAMEPLATE_MAX = ENGRAVING_MAX;

export type WalletPrefs = {
  /** Stamped into the wallet. The 3D renderer calls the same string `engraving`. */
  nameplate: string;
  avatarSeed: string;
};

export const DEFAULT_PREFS: WalletPrefs = {
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

export function normalizeNameplate(input: unknown): string {
  return normalizeEngraving(input);
}

/**
 * A prefs object from anything: a row, a request body, a value a previous build
 * wrote. Columns that described the retired objects are ignored rather than
 * mapped onto something new — a surface treatment for a plastic card says
 * nothing about which leather somebody would have picked, and inventing a
 * correspondence is a guess dressed up as a migration.
 */
export function normalizePrefs(input: unknown): WalletPrefs | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;

  const rawSeed = typeof obj.avatarSeed === "string" ? obj.avatarSeed.trim() : "";
  if (!rawSeed) return null;

  return {
    nameplate: normalizeNameplate(obj.nameplate),
    avatarSeed: rawSeed.slice(0, 64),
  };
}
