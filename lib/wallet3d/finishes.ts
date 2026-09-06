/**
 * What the wallet is made of, and what that does to light.
 *
 * A finish is not a colour. These six differ in how they scatter, reflect and
 * hold a highlight before they differ in hue, which is why the customiser reads
 * as choosing a MATERIAL rather than choosing a swatch:
 *
 *   leather  raised pebble cells, mid roughness, no metal
 *   nubuck   fine dense nap, very rough, kills every highlight
 *   nylon    a woven cross-hatch, tight and regular, slight sheen
 *   gloss    almost flat, low roughness, a clearcoat that returns a hard
 *            reflection of the softbox
 *   matte    flat and dry, high roughness, no clearcoat at all
 *   metal    brushed anisotropic-ish streaks, fully metallic
 *
 * `weave` switches the height field from cellular to a woven grid. That single
 * flag is what stops nylon reading as leather in a different colour — a fabric
 * has a regular repeating structure and a hide does not, and no amount of
 * roughness tuning fakes the difference.
 *
 * The palette per finish is deliberately SHORT. A configurator with thirty
 * swatches is a paint chart; six considered ones read as a range someone chose.
 */

export type FinishId = "leather" | "nubuck" | "nylon" | "gloss" | "matte" | "metal";

export type Finish = {
  id: FinishId;
  name: string;
  blurb: string;
  /** Cellular pebbling scale. Ignored when `weave` is set. */
  grain: number;
  /** Fine surface detail frequency. */
  tooth: number;
  roughness: number;
  metalness: number;
  /** Clearcoat strength — a lacquer sitting over the base. */
  clearcoat: number;
  clearcoatRoughness: number;
  /** Regular woven structure instead of cells. */
  weave?: boolean;
  /** Directional brushing, for metal. */
  brushed?: boolean;
  /** How hard the normal map hits. */
  normalScale: number;
  colors: { id: string; name: string; hex: string }[];
};

export const FINISHES: Finish[] = [
  {
    id: "leather",
    name: "Leather",
    blurb: "Full grain. Raised pebbling, soft sheen.",
    grain: 1.1,
    tooth: 1,
    roughness: 0.62,
    metalness: 0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
    normalScale: 1.5,
    colors: [
      { id: "midnight", name: "Midnight", hex: "#1B1B1D" },
      { id: "violet", name: "Violet", hex: "#3B2159" },
      { id: "oxblood", name: "Oxblood", hex: "#4A2429" },
      { id: "cognac", name: "Cognac", hex: "#7A5136" },
      { id: "forest", name: "Forest", hex: "#243026" },
      { id: "navy", name: "Navy", hex: "#232B3C" },
    ],
  },
  {
    id: "nubuck",
    name: "Nubuck",
    blurb: "Brushed nap. Drinks light, returns none.",
    grain: 1.5,
    tooth: 3,
    roughness: 0.95,
    metalness: 0,
    clearcoat: 0,
    clearcoatRoughness: 1,
    normalScale: 1.1,
    colors: [
      { id: "olive", name: "Olive", hex: "#3A3F2C" },
      { id: "sand", name: "Sand", hex: "#A2917A" },
      { id: "slate", name: "Slate", hex: "#43464A" },
      { id: "plum", name: "Plum", hex: "#40304E" },
    ],
  },
  {
    id: "nylon",
    name: "Nylon",
    blurb: "Technical weave. Tight, regular, faintly lustrous.",
    grain: 0.6,
    tooth: 1,
    roughness: 0.5,
    metalness: 0.05,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35,
    weave: true,
    normalScale: 1.3,
    colors: [
      { id: "black", name: "Black", hex: "#141416" },
      { id: "graphite", name: "Graphite", hex: "#33363B" },
      { id: "ink", name: "Ink", hex: "#1D2740" },
      { id: "moss", name: "Moss", hex: "#2C3527" },
    ],
  },
  {
    id: "gloss",
    name: "Gloss",
    blurb: "Lacquered. A hard, clean reflection.",
    grain: 0.2,
    tooth: 0.5,
    roughness: 0.12,
    metalness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    normalScale: 0.35,
    colors: [
      { id: "obsidian", name: "Obsidian", hex: "#0E0E11" },
      { id: "violet", name: "Violet", hex: "#3D1F63" },
      { id: "claret", name: "Claret", hex: "#5A1626" },
      { id: "ivory", name: "Ivory", hex: "#DED8CC" },
    ],
  },
  {
    id: "matte",
    name: "Matte",
    blurb: "Dry, flat, no shine at all.",
    grain: 0.35,
    tooth: 1.4,
    roughness: 0.94,
    metalness: 0,
    clearcoat: 0,
    clearcoatRoughness: 1,
    normalScale: 0.7,
    colors: [
      { id: "charcoal", name: "Charcoal", hex: "#2A2B2E" },
      { id: "stone", name: "Stone", hex: "#8B8880" },
      { id: "clay", name: "Clay", hex: "#6E4B3E" },
      { id: "pine", name: "Pine", hex: "#2A3A33" },
    ],
  },
  {
    id: "metal",
    name: "Metal",
    blurb: "Brushed and anodised. Fully reflective.",
    grain: 0.25,
    tooth: 6,
    roughness: 0.3,
    metalness: 1,
    clearcoat: 0.2,
    clearcoatRoughness: 0.2,
    brushed: true,
    normalScale: 0.5,
    colors: [
      { id: "titanium", name: "Titanium", hex: "#B4B8BD" },
      { id: "graphite", name: "Graphite", hex: "#4A4D52" },
      { id: "champagne", name: "Champagne", hex: "#C0A472" },
      { id: "midnight", name: "Midnight", hex: "#26272B" },
    ],
  },
];

export function getFinish(id: string): Finish {
  return FINISHES.find((f) => f.id === id) ?? FINISHES[0];
}

export function getColor(finish: Finish, id: string): { id: string; name: string; hex: string } {
  return finish.colors.find((c) => c.id === id) ?? finish.colors[0];
}

/** Hardware, kept to four because it is trim rather than the subject. */
export const HARDWARE = [
  { id: "titanium", name: "Brushed titanium", hex: "#B9BDC2", roughness: 0.34 },
  { id: "silver", name: "Polished silver", hex: "#D9DDE2", roughness: 0.14 },
  { id: "black", name: "Matte black", hex: "#2A2A2D", roughness: 0.45 },
  { id: "champagne", name: "Champagne gold", hex: "#C6A96F", roughness: 0.24 },
];

export function getHardware(id: string) {
  return HARDWARE.find((h) => h.id === id) ?? HARDWARE[0];
}

/** Thread. Four, tonal through to bright. */
export const THREADS = [
  { id: "tonal", name: "Tonal", hex: "" },
  { id: "cream", name: "Cream", hex: "#D8CDB6" },
  { id: "gold", name: "Gold", hex: "#B8913F" },
  { id: "black", name: "Black", hex: "#141416" },
];

export type WalletConfig = {
  finish: FinishId;
  color: string;
  hardware: string;
  thread: string;
  engraving: string;
};

export const DEFAULT_CONFIG: WalletConfig = {
  finish: "leather",
  color: "violet",
  hardware: "champagne",
  thread: "tonal",
  engraving: "",
};
