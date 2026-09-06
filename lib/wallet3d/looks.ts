import type { WalletLook } from "@/components/wallet3d/WalletModel";

/**
 * The LAWFIC leather range, expressed as material rather than colour.
 *
 * `grain` and `tooth` drive the generated normal map, so nubuck and polished
 * calf differ in how they take light before they differ in hue — which is the
 * whole reason the range reads as ten materials instead of ten swatches.
 */
import type { HideId } from "@/lib/wallet-leather";

export type LookId = HideId;

export type LookDef = {
  id: LookId;
  name: string;
  tagline: string;
  look: WalletLook;
};

const metals = {
  titanium: { color: "#B9BDC2", roughness: 0.34, metalness: 1 },
  silver: { color: "#D9DDE2", roughness: 0.16, metalness: 1 },
  black: { color: "#2A2A2D", roughness: 0.42, metalness: 1 },
  champagne: { color: "#C6A96F", roughness: 0.26, metalness: 1 },
};

export const METALS = metals;

export const LOOKS: LookDef[] = [
  { id: "midnight", name: "Midnight Black", tagline: "Classic. Timeless. Elegant.", look: {
    leather: { color: "#1B1B1D", grain: 0.5, roughness: 0.52, tooth: 1 },
    metal: metals.titanium, stitch: { color: "#6E6656", width: 1 }, lining: "#232326", engraving: "" } },
  { id: "concrete", name: "Concrete Grey", tagline: "Minimal. Urban. Clean.", look: {
    leather: { color: "#111113", grain: 1.0, roughness: 0.78, tooth: 1.2 },
    metal: metals.black, stitch: { color: "#2C2C30", width: 1 }, lining: "#191919", engraving: "" } },
  { id: "oxblood", name: "Oxblood", tagline: "Bold. Rich. Distinctive.", look: {
    leather: { color: "#4A2429", grain: 0.8, roughness: 0.6, tooth: 1 },
    metal: metals.champagne, stitch: { color: "#3A1416", width: 1 }, lining: "#3A171B", engraving: "" } },
  { id: "forest", name: "Forest Green", tagline: "Bold. Natural. Distinct.", look: {
    leather: { color: "#243026", grain: 1.1, roughness: 0.68, tooth: 1.1 },
    metal: metals.titanium, stitch: { color: "#16241A", width: 1 }, lining: "#22321F", engraving: "" } },
  { id: "navy", name: "Navy Blue", tagline: "Deep. Versatile. Premium.", look: {
    leather: { color: "#232B3C", grain: 0.9, roughness: 0.62, tooth: 1 },
    metal: metals.silver, stitch: { color: "#141C30", width: 1 }, lining: "#1E2740", engraving: "" } },
  { id: "cognac", name: "Cognac Brown", tagline: "Rich. Classic. Rugged.", look: {
    leather: { color: "#7A5136", grain: 1.2, roughness: 0.66, tooth: 1 },
    metal: metals.champagne, stitch: { color: "#3E200E", width: 1 }, lining: "#7A4520", engraving: "" } },
  { id: "tan", name: "Tan", tagline: "Warm. Natural. Premium.", look: {
    leather: { color: "#A2917A", grain: 1.3, roughness: 0.74, tooth: 1.1 },
    metal: metals.champagne, stitch: { color: "#6B5A40", width: 1 }, lining: "#A08A68", engraving: "" } },
  { id: "slate", name: "Slate Grey", tagline: "Modern. Sleek. Strong.", look: {
    leather: { color: "#43464A", grain: 1, roughness: 0.7, tooth: 1 },
    metal: metals.silver, stitch: { color: "#2B2E33", width: 1 }, lining: "#3A3E44", engraving: "" } },
  { id: "olive", name: "Suede Olive", tagline: "Earthy. Unique. Refined.", look: {
    leather: { color: "#3A3F2C", grain: 1.4, roughness: 0.88, tooth: 2.8 },
    metal: metals.black, stitch: { color: "#3A3D42", width: 1 }, lining: "#202226", engraving: "" } },
  { id: "chocolate", name: "Dark Chocolate", tagline: "Deep. Elegant. Timeless.", look: {
    leather: { color: "#3B2A1E", grain: 1.0, roughness: 0.64, tooth: 1 },
    metal: metals.silver, stitch: { color: "#6A6E74", width: 1 }, lining: "#4A4E54", engraving: "" } },
];

export function getLook(id: string): LookDef {
  return LOOKS.find((l) => l.id === id) ?? LOOKS[0];
}
