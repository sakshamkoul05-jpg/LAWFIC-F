/**
 * A customer's wallet card preferences.
 *
 * What changed and why: this used to hold a `cardType` chosen from Standard,
 * Premium, Business, Student and Advocate. Those were five gradients wearing
 * the costume of a tier system — nothing gated them, nothing earned them, and
 * "Premium" on an account holding ₹0 asserted something untrue. Picking one
 * was picking a wallpaper that pretended to be a status.
 *
 * They are replaced by two stored choices that are each honest about what they
 * are, defined in `lib/wallet-card.ts`:
 *
 *   entity — what the holder actually is (individual, proprietor, firm,
 *            company, professional). It changes what the card *says*: which
 *            statutory identifier it carries. Different information.
 *
 *   finish — matte, gloss, brushed or etched. Openly cosmetic, and the only
 *            thing here that is.
 *
 * The third layer, the part that makes a card unique to its holder, is not
 * stored at all: it is derived from their real filing history every time the
 * card renders. See `signatureFor`.
 *
 * Everything in this file is still cosmetic — none of it touches a balance,
 * the ledger, or an order. That boundary is the point of the feature.
 *
 * Validation lives here because the server route, the customize form and the
 * card all need one idea of what a valid choice is.
 */

import { ENTITIES, FINISHES, getEntity, getFinish, type EntityId, type FinishId } from "./wallet-card";

export { ENTITIES, FINISHES, getEntity, getFinish };
export type { EntityId, FinishId };

export type WalletPrefs = {
  entity: EntityId;
  finish: FinishId;
  avatarSeed: string;
};

export const DEFAULT_PREFS: WalletPrefs = {
  entity: "individual",
  finish: "matte",
  avatarSeed: "Felix",
};

/**
 * Seeds for the avatar picker. Internal keys, never shown — each one produces
 * a fixed face from the lorelei set. Order is the order they appear.
 */
export const AVATAR_SEEDS = [
  "Felix", "Aneka", "Jasper", "Lola", "Milo",
  "Nala", "Oscar", "Piper", "Quinn", "Remy",
  "Sage", "Toni", "Uma", "Vex", "Wren",
];

/**
 * Accepts anything and returns a valid preference set, or null.
 *
 * It also reads the old `cardType` field, because rows written before this
 * change still hold one and a customer should not lose their avatar because
 * the card model moved on. The five retired types map onto the closest
 * surviving finish; nothing maps onto an entity, since the old types never
 * carried that information in the first place.
 */
const RETIRED_TYPE_TO_FINISH: Record<string, FinishId> = {
  standard: "matte",
  premium: "etched",
  business: "brushed",
  student: "gloss",
  advocate: "etched",
};

export function normalizePrefs(input: unknown): WalletPrefs | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;

  const rawSeed = typeof obj.avatarSeed === "string" ? obj.avatarSeed.trim() : "";
  if (!rawSeed) return null;
  const avatarSeed = rawSeed.slice(0, 64);

  const entity = getEntity(String(obj.entity ?? ""))?.id ?? DEFAULT_PREFS.entity;

  const finish =
    getFinish(String(obj.finish ?? ""))?.id ??
    RETIRED_TYPE_TO_FINISH[String(obj.cardType ?? "")] ??
    DEFAULT_PREFS.finish;

  return { entity, finish, avatarSeed };
}
