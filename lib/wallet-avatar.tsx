import type { ReactNode } from "react";

/**
 * LAWFIC Avatar System
 *
 * A CSS-rendered avatar that sits on the collector card — no images, no external
 * assets. Each part is a simple SVG/CSS shape. The avatar is the user's identity
 * on the card, replacing the old badge/flair system.
 *
 * Avatar prefs are stored alongside skin prefs in wallet_prefs.
 */

export type SkinToneId = "fair" | "light" | "medium" | "tan" | "brown" | "deep";
export type HairStyleId = "short" | "side" | "wavy" | "curly" | "long" | "buzz";
export type HairColorId = "black" | "dark-brown" | "brown" | "blonde" | "auburn" | "gray";
export type EyeStyleId = "round" | "almond" | "narrow" | "wide";
export type MouthStyleId = "smile" | "neutral" | "grin" | "lips";
export type ClothesStyleId = "suit" | "tshirt" | "blouse" | "hoodie" | "kurta" | "none";
export type AccessoryId = "none" | "glasses" | "sunglasses" | "earrings" | "cap";

export type AvatarPrefs = {
  skinTone: SkinToneId;
  hairStyle: HairStyleId;
  hairColor: HairColorId;
  eyeStyle: EyeStyleId;
  mouthStyle: MouthStyleId;
  clothes: ClothesStyleId;
  accessory: AccessoryId;
};

export const DEFAULT_AVATAR: AvatarPrefs = {
  skinTone: "medium",
  hairStyle: "short",
  hairColor: "black",
  eyeStyle: "round",
  mouthStyle: "smile",
  clothes: "suit",
  accessory: "none",
};

// ─── Palette ────────────────────────────────────────────────────────────────

export const SKIN_TONES: { id: SkinToneId; label: string; color: string }[] = [
  { id: "fair",  label: "Fair",  color: "#FDDBB4" },
  { id: "light", label: "Light", color: "#E8B88A" },
  { id: "medium", label: "Medium", color: "#C68E5B" },
  { id: "tan",   label: "Tan",   color: "#A67B4B" },
  { id: "brown", label: "Brown", color: "#8D5524" },
  { id: "deep",  label: "Deep",  color: "#5C3310" },
];

export const HAIR_STYLES: { id: HairStyleId; label: string }[] = [
  { id: "short",  label: "Short" },
  { id: "side",   label: "Side part" },
  { id: "wavy",   label: "Wavy" },
  { id: "curly",  label: "Curly" },
  { id: "long",   label: "Long" },
  { id: "buzz",   label: "Buzz" },
];

export const HAIR_COLORS: { id: HairColorId; label: string; color: string }[] = [
  { id: "black",      label: "Black",      color: "#1a1a1a" },
  { id: "dark-brown", label: "Dark brown", color: "#3d2314" },
  { id: "brown",      label: "Brown",      color: "#6b3a1f" },
  { id: "blonde",     label: "Blonde",     color: "#d4a76a" },
  { id: "auburn",     label: "Auburn",     color: "#a0522d" },
  { id: "gray",       label: "Gray",       color: "#808080" },
];

export const EYE_STYLES: { id: EyeStyleId; label: string }[] = [
  { id: "round",  label: "Round" },
  { id: "almond", label: "Almond" },
  { id: "narrow", label: "Narrow" },
  { id: "wide",   label: "Wide" },
];

export const MOUTH_STYLES: { id: MouthStyleId; label: string }[] = [
  { id: "smile",  label: "Smile" },
  { id: "neutral", label: "Neutral" },
  { id: "grin",   label: "Grin" },
  { id: "lips",   label: "Lips" },
];

export const CLOTHES_STYLES: { id: ClothesStyleId; label: string }[] = [
  { id: "suit",   label: "Suit" },
  { id: "tshirt", label: "T-shirt" },
  { id: "blouse", label: "Blouse" },
  { id: "hoodie", label: "Hoodie" },
  { id: "kurta",  label: "Kurta" },
  { id: "none",   label: "None" },
];

export const ACCESSORIES: { id: AccessoryId; label: string }[] = [
  { id: "none",       label: "None" },
  { id: "glasses",    label: "Glasses" },
  { id: "sunglasses", label: "Sunglasses" },
  { id: "earrings",   label: "Earrings" },
  { id: "cap",        label: "Cap" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getSkinTone(id: string) {
  return SKIN_TONES.find((s) => s.id === id);
}

export function getHairColor(id: string) {
  return HAIR_COLORS.find((c) => c.id === id);
}

/** Merge partial avatar input with defaults — used by the server + form. */
export function normalizeAvatar(input: Partial<AvatarPrefs> | null | undefined): AvatarPrefs {
  if (!input || typeof input !== "object") return DEFAULT_AVATAR;
  return {
    skinTone:  SKIN_TONES.find((s) => s.id === input.skinTone)  ? input.skinTone!  : DEFAULT_AVATAR.skinTone,
    hairStyle: HAIR_STYLES.find((s) => s.id === input.hairStyle) ? input.hairStyle! : DEFAULT_AVATAR.hairStyle,
    hairColor: HAIR_COLORS.find((c) => c.id === input.hairColor) ? input.hairColor! : DEFAULT_AVATAR.hairColor,
    eyeStyle:  EYE_STYLES.find((e) => e.id === input.eyeStyle)   ? input.eyeStyle!  : DEFAULT_AVATAR.eyeStyle,
    mouthStyle: MOUTH_STYLES.find((m) => m.id === input.mouthStyle) ? input.mouthStyle! : DEFAULT_AVATAR.mouthStyle,
    clothes:   CLOTHES_STYLES.find((c) => c.id === input.clothes)  ? input.clothes!  : DEFAULT_AVATAR.clothes,
    accessory: ACCESSORIES.find((a) => a.id === input.accessory)    ? input.accessory! : DEFAULT_AVATAR.accessory,
  };
}
