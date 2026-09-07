import type { NoteStyleId } from "./banknote";

/**
 * What the wallet is made of, and what that does to light.
 *
 * A finish is not a colour. These six differ in how they scatter and hold a
 * highlight before they differ in hue, which is why the customiser reads as
 * choosing a MATERIAL rather than choosing a swatch:
 *
 *   leather   pull-up hide: waxed, tonal, the approved wallet
 *   pebble    heavy raised cells, the classic grained calf
 *   saffiano  a fine pressed cross-hatch under a hard lacquer
 *   nubuck    sanded nap, very rough, kills every highlight
 *   suede     the flesh side: deepest nap, no sheen at all
 *   canvas    coarse waxed weave, the one non-hide in the range
 *
 * WHAT WAS DROPPED AND WHY
 *
 * Gloss and metal are gone. They were carried over from a card holder that
 * could plausibly have been anodised aluminium, and on a stitched leather
 * bifold they are not options a maker would offer — a mirror-lacquered or
 * milled-metal bifold is not a thing. Every finish here is something this
 * object could actually be cut and sewn from, which is the only reason to put
 * it in front of a customer.
 *
 * `weave` switches the height field from cellular to a woven grid. That single
 * flag is what separates saffiano and canvas from the hides: a pressed or woven
 * surface has a regular repeating structure and a skin does not, and no amount
 * of roughness tuning fakes the difference.
 *
 * The palette per finish is deliberately SHORT. A configurator with thirty
 * swatches is a paint chart; a handful of considered ones read as a range
 * someone chose.
 */

export type FinishId = "leather" | "pebble" | "saffiano" | "nubuck" | "suede" | "canvas";

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
  /** Clearcoat strength — a finishing lacquer sitting over the base. */
  clearcoat: number;
  clearcoatRoughness: number;
  /** Regular woven or pressed structure instead of cells. */
  weave?: boolean;
  /** How hard the normal map hits. */
  normalScale: number;
  colors: { id: string; name: string; hex: string }[];
};

export const FINISHES: Finish[] = [
  {
    id: "leather",
    name: "Pull-up",
    blurb: "Waxed full grain. Colour lifts where it is handled.",
    /* Tuned to the approved wallet, which is a pull-up hide rather than a
       pebbled one: its character is TONAL — colour lifting where the surface
       has been stretched and handled — not structural. Heavy pebbling read as
       a golf ball beside the client's photographs. The albedo does the work
       now, so the grain and the normal are dialled well back. */
    grain: 0.45,
    tooth: 1.2,
    roughness: 0.58,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.45,
    normalScale: 0.6,
    colors: [
      /* Walnut leads and is the default: the approved wallet is a distressed
         brown full-grain, and a range whose first swatch is not the product
         makes every customer undo a choice they did not make. */
      { id: "walnut", name: "Walnut", hex: "#5C3A21" },
      { id: "midnight", name: "Midnight", hex: "#1B1B1D" },
      { id: "oxblood", name: "Oxblood", hex: "#4A2429" },
      { id: "cognac", name: "Cognac", hex: "#6B4529" },
      { id: "forest", name: "Forest", hex: "#243026" },
      { id: "navy", name: "Navy", hex: "#232B3C" },
    ],
  },
  {
    id: "pebble",
    name: "Pebble grain",
    blurb: "Raised cells with valleys between. Hard-wearing.",
    grain: 1.35,
    tooth: 1,
    roughness: 0.64,
    metalness: 0,
    clearcoat: 0.22,
    clearcoatRoughness: 0.5,
    normalScale: 1.4,
    colors: [
      { id: "chestnut", name: "Chestnut", hex: "#5A3520" },
      { id: "black", name: "Black", hex: "#191919" },
      { id: "burgundy", name: "Burgundy", hex: "#45202A" },
      { id: "olive", name: "Olive", hex: "#3A3B29" },
    ],
  },
  {
    id: "saffiano",
    name: "Saffiano",
    blurb: "Pressed cross-hatch under a hard lacquer. Scratch-proof.",
    grain: 0.5,
    tooth: 1.7,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.22,
    weave: true,
    normalScale: 0.75,
    colors: [
      { id: "jet", name: "Jet", hex: "#17181A" },
      { id: "tan", name: "Tan", hex: "#7A5433" },
      { id: "claret", name: "Claret", hex: "#4E1F2A" },
      { id: "ink", name: "Ink", hex: "#1E2637" },
    ],
  },
  {
    id: "nubuck",
    name: "Nubuck",
    blurb: "Sanded grain. Drinks light, returns none.",
    grain: 1.5,
    tooth: 3,
    roughness: 0.95,
    metalness: 0,
    clearcoat: 0,
    clearcoatRoughness: 1,
    normalScale: 1.1,
    colors: [
      { id: "sand", name: "Sand", hex: "#8E7B62" },
      { id: "slate", name: "Slate", hex: "#43464A" },
      { id: "moss", name: "Moss", hex: "#3A3F2C" },
      { id: "plum", name: "Plum", hex: "#40304E" },
    ],
  },
  {
    id: "suede",
    name: "Suede",
    blurb: "The flesh side. Deepest nap, no sheen at all.",
    grain: 1.9,
    tooth: 3,
    roughness: 0.99,
    metalness: 0,
    clearcoat: 0,
    clearcoatRoughness: 1,
    normalScale: 1.25,
    colors: [
      { id: "tobacco", name: "Tobacco", hex: "#6B4B2E" },
      { id: "charcoal", name: "Charcoal", hex: "#33343A" },
      { id: "bottle", name: "Bottle", hex: "#28382F" },
      { id: "rust", name: "Rust", hex: "#6E3B26" },
    ],
  },
  {
    id: "canvas",
    name: "Waxed canvas",
    blurb: "Coarse weave, waxed. The one non-hide in the range.",
    grain: 0.6,
    tooth: 0.6,
    roughness: 0.72,
    metalness: 0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.55,
    weave: true,
    normalScale: 1.25,
    colors: [
      { id: "field", name: "Field tan", hex: "#7A6642" },
      { id: "olive", name: "Olive drab", hex: "#414630" },
      { id: "graphite", name: "Graphite", hex: "#33363B" },
      { id: "navy", name: "Navy", hex: "#26303F" },
    ],
  },
];

export function getFinish(id: string): Finish {
  return FINISHES.find((f) => f.id === id) ?? FINISHES[0];
}

export function getColor(finish: Finish, id: string): { id: string; name: string; hex: string } {
  return finish.colors.find((c) => c.id === id) ?? finish.colors[0];
}

/**
 * How the marks are stamped into the hide.
 *
 * This replaced a "hardware" list of brushed metals, which belonged to a card
 * holder with a metal plate on it. A leather bifold has no hardware on its
 * face — it has an EMBOSS, and the real choice a maker offers is whether that
 * stamp is blind or foiled. Blind is the default because it is what the
 * client's own renders show: the mark is the leather's own colour and the only
 * thing that reveals it is the way light falls into the depression.
 */
export const EMBOSS = [
  { id: "blind", name: "Blind", hex: null as string | null, roughness: 0.8 },
  { id: "gold", name: "Gold foil", hex: "#C6A96F" as string | null, roughness: 0.24 },
  { id: "silver", name: "Silver foil", hex: "#D9DDE2" as string | null, roughness: 0.16 },
  { id: "copper", name: "Copper foil", hex: "#B87551" as string | null, roughness: 0.26 },
];

export function getEmboss(id: string) {
  return EMBOSS.find((e) => e.id === id) ?? EMBOSS[0];
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
  /** Blind or foiled stamping. See EMBOSS. */
  emboss: string;
  thread: string;
  engraving: string;
  /** How the LAWFIC Credits inside are printed. See NOTE_STYLES. */
  notes: NoteStyleId;
};

export const DEFAULT_CONFIG: WalletConfig = {
  finish: "leather",
  color: "walnut",
  emboss: "blind",
  thread: "tonal",
  engraving: "",
  notes: "classic",
};
