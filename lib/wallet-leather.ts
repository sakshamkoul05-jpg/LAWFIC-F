/**
 * The wallet as a physical object: hide, hardware, stitching, lining.
 *
 * This replaces the card model entirely — the five "card types", the chip, the
 * card face. That metaphor was never true here: LAWFIC issues no card, nothing
 * can be tapped or swiped, and what the customer actually has is a prepaid
 * balance for filings. Every fintech ships a rectangle with a chip on it. A
 * wallet is both more honest and, as it turns out, more distinctive.
 *
 * WHY THERE IS A `material` BLOCK AND NOT JUST COLOURS
 *
 * A skin that only changes `background-color` is five of the same wallet. Real
 * hides differ in how they take light before they differ in hue: nubuck has a
 * fine nap that scatters everything and returns no highlight; pebbled cowhide
 * has large raised grain that shades on one side; polished calf is nearly flat
 * with one long specular sweep. So each skin carries the parameters that drive
 * its SVG lighting — grain frequency, how deep the grain sits, and how much of
 * a specular return the surface gives — and `LeatherPanel` builds a different
 * filter for each. Midnight and burgundy get a specular pass; olive nubuck
 * explicitly does not, which is what makes it read as suede rather than as
 * green plastic.
 *
 * Everything below is cosmetic. Nothing here touches a balance, the ledger, or
 * an order — the same boundary the card model kept.
 */

export type HideId =
  | "midnight"
  | "slate"
  | "olive"
  | "tan"
  | "oxblood"
  | "navy"
  | "cognac"
  | "forest"
  | "concrete"
  | "chocolate";

/** Ids this replaced, kept so rows written before the rename still resolve. */
const RENAMED: Record<string, HideId> = {
  "suede-green": "olive",
  // brown, then burgundy, now oxblood — the same leather each time, renamed as
  // the range got its own swatch card. Both old ids point at where it lives
  // now rather than chaining through a name that no longer exists.
  brown: "oxblood",
  burgundy: "oxblood",
};

export type Material = {
  /**
   * Turbulence frequency. Low is large pebbling, high is a fine nap. This is
   * the single number that decides whether a hide reads as cowhide or suede.
   */
  grainFreq: number;
  /** How raised the grain is. Nubuck is deep, polished calf is nearly flat. */
  grainScale: number;
  /** Specular return, 0 for a napped hide that has none. */
  specular: number;
  /** Tight and bright, or broad and soft. */
  specularExp: number;
};

export type Hide = {
  id: HideId;
  name: string;
  /** One line, said the way a leatherworker would say it. */
  desc: string;
  /**
   * Basename of the product photographs in /public/wallet — `<photo>-closed.jpg`
   * and `<photo>-open.jpg`. When both exist the wallet renders as photography;
   * when either is missing it falls back to the drawn one, which is why the
   * material parameters below are still here and must not be deleted.
   */
  photo: string;
  /** Outer leather, lit from the upper left like everything else on the site. */
  outer: [string, string, string];
  /** Inside the fold, visible only when the wallet is open. */
  lining: string;
  /** The lining's own shadow, where it meets the spine. */
  liningDeep: string;
  /** Cut edge, painted the way a finished leather edge is. */
  edge: string;
  /** Where that edge catches light. Burnishing leaves a sheen. */
  edgeHi: string;
  /** Default thread; the holder may override it. */
  stitch: string;
  /** Text that sits on this hide. */
  ink: string;
  inkSoft: string;
  material: Material;
};

export const HIDES: Hide[] = [
  {
    id: "midnight",
    name: "Midnight Black",
    desc: "Classic. Timeless. Elegant.",
    photo: "midnight",
    outer: ["#31302E", "#1A1918", "#0D0C0C"],
    lining: "#302D2A",
    liningDeep: "#131211",
    edge: "#0A0909",
    edgeHi: "#4A4744",
    stitch: "#7A7263",
    ink: "#EFEAE0",
    inkSoft: "rgba(239,234,224,0.5)",
    material: { grainFreq: 0.11, grainScale: 0.55, specular: 0.14, specularExp: 30 },
  },
  {
    id: "slate",
    name: "Slate Grey",
    desc: "Modern. Sleek. Strong.",
    photo: "slate",
    outer: ["#6A6E73", "#494D52", "#31353A"],
    lining: "#474C53",
    liningDeep: "#22262A",
    edge: "#22252A",
    edgeHi: "#8A8F96",
    stitch: "#2B2E33",
    ink: "#F2F4F6",
    inkSoft: "rgba(242,244,246,0.55)",
    material: { grainFreq: 0.055, grainScale: 1.9, specular: 0.06, specularExp: 12 },
  },
  {
    id: "olive",
    name: "Suede Olive",
    desc: "Earthy. Unique. Refined.",
    photo: "olive",
    outer: ["#5C6446", "#454B33", "#2F3423"],
    lining: "#454B33",
    liningDeep: "#22261A",
    edge: "#252A1B",
    edgeHi: "#6E7754",
    stitch: "#2A2E1D",
    ink: "#F0F2E8",
    inkSoft: "rgba(240,242,232,0.55)",
    // No specular at all. A napped hide has none, and adding one is the exact
    // mistake that makes rendered suede look like painted plastic.
    material: { grainFreq: 0.42, grainScale: 2.4, specular: 0, specularExp: 1 },
  },
  {
    id: "tan",
    name: "Tan",
    desc: "Warm. Natural. Premium.",
    photo: "tan",
    outer: ["#C9955C", "#A9743F", "#84562B"],
    lining: "#9C6C3B",
    liningDeep: "#5C3D1F",
    edge: "#6B451F",
    edgeHi: "#E0B683",
    stitch: "#4E3218",
    ink: "#2C1B0B",
    inkSoft: "rgba(44,27,11,0.6)",
    material: { grainFreq: 0.05, grainScale: 2.2, specular: 0.09, specularExp: 14 },
  },
  {
    id: "oxblood",
    name: "Oxblood",
    desc: "Bold. Rich. Distinctive.",
    photo: "oxblood",
    outer: ["#7A2F31", "#5A1F22", "#3C1315"],
    lining: "#5C2225",
    liningDeep: "#2A0F11",
    edge: "#2C0E10",
    edgeHi: "#9B4A48",
    stitch: "#3A1416",
    ink: "#F7E9E6",
    inkSoft: "rgba(247,233,230,0.55)",
    material: { grainFreq: 0.07, grainScale: 1.4, specular: 0.12, specularExp: 22 },
  },
  {
    id: "navy",
    name: "Navy Blue",
    desc: "Deep. Versatile. Premium.",
    photo: "navy",
    outer: ["#2E3C5C", "#1E2A44", "#131B2C"],
    lining: "#243050",
    liningDeep: "#101623",
    edge: "#0E1420",
    edgeHi: "#4A5C82",
    stitch: "#16203A",
    ink: "#EAEEF7",
    inkSoft: "rgba(234,238,247,0.55)",
    material: { grainFreq: 0.09, grainScale: 1.1, specular: 0.11, specularExp: 24 },
  },
  {
    id: "cognac",
    name: "Cognac Brown",
    desc: "Rich. Classic. Rugged.",
    photo: "cognac",
    outer: ["#A65C2A", "#8B4A22", "#653417"],
    lining: "#7E441F",
    liningDeep: "#472510",
    edge: "#4E2812",
    edgeHi: "#C98449",
    stitch: "#3E200E",
    ink: "#FBEFE4",
    inkSoft: "rgba(251,239,228,0.55)",
    material: { grainFreq: 0.05, grainScale: 2.4, specular: 0.1, specularExp: 15 },
  },
  {
    id: "forest",
    name: "Forest Green",
    desc: "Bold. Natural. Distinct.",
    photo: "forest",
    outer: ["#33472C", "#22331F", "#151F13"],
    lining: "#293B24",
    liningDeep: "#111A10",
    edge: "#101810",
    edgeHi: "#4F6B46",
    stitch: "#182415",
    ink: "#EAF2E7",
    inkSoft: "rgba(234,242,231,0.55)",
    material: { grainFreq: 0.08, grainScale: 1.6, specular: 0.09, specularExp: 20 },
  },
  {
    id: "concrete",
    name: "Concrete Grey",
    desc: "Minimal. Urban. Clean.",
    photo: "concrete",
    outer: ["#A6A69F", "#8A8A85", "#6A6A66"],
    lining: "#7E7E79",
    liningDeep: "#4E4E4A",
    edge: "#55554F",
    edgeHi: "#C6C6BF",
    stitch: "#5E5E58",
    ink: "#211F1D",
    inkSoft: "rgba(33,31,29,0.6)",
    material: { grainFreq: 0.06, grainScale: 2.0, specular: 0.05, specularExp: 10 },
  },
  {
    id: "chocolate",
    name: "Dark Chocolate",
    desc: "Deep. Elegant. Timeless.",
    photo: "chocolate",
    outer: ["#513322", "#3A2318", "#241510"],
    lining: "#402A1C",
    liningDeep: "#1D110B",
    edge: "#1E120C",
    edgeHi: "#7A5236",
    stitch: "#2A1810",
    ink: "#F6EBE0",
    inkSoft: "rgba(246,235,224,0.55)",
    material: { grainFreq: 0.06, grainScale: 1.8, specular: 0.1, specularExp: 18 },
  },
];

export function getHide(id: string): Hide | undefined {
  const key = RENAMED[id] ?? id;
  return HIDES.find((h) => h.id === key);
}

/** True for any id this app has ever written, so old rows are not thrown away. */
export function isKnownHide(id: unknown): id is HideId {
  return typeof id === "string" && Boolean(getHide(id));
}

/* ---------------------------------------------------------------- hardware */

export type PlateId = "brass" | "steel" | "blackened";

export type Plate = {
  id: PlateId;
  name: string;
  face: [string, string, string];
  letter: string;
  rim: string;
};

export const PLATES: Plate[] = [
  {
    id: "brass",
    name: "Brass",
    face: ["#E4C378", "#B8913F", "#8A6828"],
    letter: "#3A2A0C",
    rim: "#6E5220",
  },
  {
    id: "steel",
    name: "Steel",
    face: ["#E2E6EA", "#A8B0B8", "#767D85"],
    letter: "#2A2F34",
    rim: "#5E656C",
  },
  {
    id: "blackened",
    name: "Blackened",
    face: ["#4E4E52", "#2C2C30", "#171719"],
    letter: "#C9C6C0",
    rim: "#0E0E10",
  },
];

export function getPlate(id: string): Plate | undefined {
  return PLATES.find((p) => p.id === id);
}

/* ----------------------------------------------------------------- thread */

export type ThreadId = "tonal" | "contrast" | "brass";

export const THREADS: { id: ThreadId; name: string; desc: string }[] = [
  { id: "tonal", name: "Tonal", desc: "Thread the colour of the hide." },
  { id: "contrast", name: "Contrast", desc: "The maker's stitch, pale against the leather." },
  { id: "brass", name: "Brass", desc: "Warm thread picking up the hardware." },
];

export function threadColour(hide: Hide, thread: ThreadId): string {
  if (thread === "tonal") return hide.outer[2];
  if (thread === "brass") return "#B8913F";
  return hide.stitch;
}

/* -------------------------------------------------------------- nameplate */

/** A plate is small and stamped. Longer than this renders as a smear. */
export const NAMEPLATE_MAX = 22;

/* Takes unknown, not string: every caller is handing it a value straight off a
   database row or a request body, and a nameplate that arrives as null should
   come back as an empty plate rather than throw on the wallet page. */
export function normalizeNameplate(raw: unknown): string {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9 &.'-]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, NAMEPLATE_MAX);
}
