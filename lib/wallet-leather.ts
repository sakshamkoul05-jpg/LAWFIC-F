/**
 * The wallet as an object: hide, hardware, stitching, lining, nameplate.
 *
 * This replaces the card model entirely — the five "card types", the chip, the
 * card face. That metaphor was never true here: LAWFIC issues no card, nothing
 * can be tapped or swiped, and what the customer actually has is a prepaid
 * balance for filings. Every fintech ships a rectangle with a chip on it. A
 * wallet is both more honest and, as it turns out, more distinctive.
 *
 * Everything below is cosmetic. Nothing here touches a balance, the ledger, or
 * an order — the same boundary the card model kept.
 */

export type HideId = "midnight" | "suede-green" | "brown" | "slate" | "tan";

export type Hide = {
  id: HideId;
  name: string;
  desc: string;
  /** Outer leather, lit from the upper left like everything else on the site. */
  outer: [string, string, string];
  /** Inside the fold, visible only when open. */
  lining: string;
  /** Cut edge, painted the way a finished leather edge is. */
  edge: string;
  /** Default thread; the holder may override it. */
  stitch: string;
  /** Text that sits on this hide. */
  ink: string;
  inkSoft: string;
  /** How much the grain shows: smooth calf barely, suede a lot. */
  grain: number;
  /** Suede scatters light instead of reflecting it. */
  sheen: number;
};

export const HIDES: Hide[] = [
  {
    id: "midnight",
    name: "Midnight black",
    desc: "Smooth calf. Almost no grain, a long slow highlight.",
    outer: ["#2A2827", "#161514", "#0C0B0B"],
    lining: "#1E1C1A",
    edge: "#0A0909",
    stitch: "#6E6656",
    ink: "#E8E3D9",
    inkSoft: "rgba(232,227,217,0.55)",
    grain: 0.35,
    sheen: 0.5,
  },
  {
    id: "suede-green",
    name: "Suede green",
    desc: "Napped finish. Drinks the light rather than returning it.",
    outer: ["#42574A", "#2D3E34", "#1F2C25"],
    lining: "#243128",
    edge: "#1A251F",
    stitch: "#C7B98F",
    ink: "#EAF0E9",
    inkSoft: "rgba(234,240,233,0.55)",
    grain: 1,
    sheen: 0.12,
  },
  {
    id: "brown",
    name: "Brown",
    desc: "Pebbled hide. The grain you can feel across a desk.",
    outer: ["#70492A", "#50321C", "#3A2413"],
    lining: "#402917",
    edge: "#2B1A0E",
    stitch: "#D8B77A",
    ink: "#F5E8D8",
    inkSoft: "rgba(245,232,216,0.55)",
    grain: 0.8,
    sheen: 0.35,
  },
  {
    id: "slate",
    name: "Slate grey",
    desc: "Fine grain, cool cast. The quietest of the five.",
    outer: ["#5A5E62", "#41454A", "#2F3236"],
    lining: "#383C40",
    edge: "#25282B",
    stitch: "#9AA1A8",
    ink: "#EEF0F2",
    inkSoft: "rgba(238,240,242,0.55)",
    grain: 0.5,
    sheen: 0.42,
  },
  {
    id: "tan",
    name: "Tan",
    desc: "Vegetable tanned. The one that will age visibly.",
    outer: ["#CFA268", "#AE7F48", "#8C6234"],
    lining: "#A97D46",
    edge: "#754F26",
    stitch: "#5C3A18",
    ink: "#3A2410",
    inkSoft: "rgba(58,36,16,0.62)",
    grain: 0.7,
    sheen: 0.4,
  },
];

export function getHide(id: string): Hide | undefined {
  return HIDES.find((h) => h.id === id);
}

/* ------------------------------------------------------------------------- */

export type PlateId = "brass" | "steel" | "blackened";

export type Plate = {
  id: PlateId;
  name: string;
  /** The metal itself. */
  face: [string, string, string];
  /** Stamped lettering: struck into metal, so darker than the metal. */
  letter: string;
  rim: string;
};

export const PLATES: Plate[] = [
  {
    id: "brass",
    name: "Brass",
    face: ["#E8CE86", "#C2A052", "#8A6A2C"],
    letter: "#4A3712",
    rim: "rgba(255,255,255,0.45)",
  },
  {
    id: "steel",
    name: "Steel",
    face: ["#E6E9EC", "#B4BBC1", "#7E868D"],
    letter: "#3D4348",
    rim: "rgba(255,255,255,0.55)",
  },
  {
    id: "blackened",
    name: "Blackened",
    face: ["#5A5754", "#3A3836", "#232120"],
    letter: "#141312",
    rim: "rgba(255,255,255,0.22)",
  },
];

export function getPlate(id: string): Plate | undefined {
  return PLATES.find((p) => p.id === id);
}

/* ------------------------------------------------------------------------- */

export type ThreadId = "tonal" | "contrast" | "brass";

export const THREADS: Array<{ id: ThreadId; name: string; desc: string }> = [
  { id: "tonal", name: "Tonal", desc: "Thread close to the hide. Barely there." },
  { id: "contrast", name: "Contrast", desc: "The hide's own stitch colour, clearly visible." },
  { id: "brass", name: "Brass", desc: "Warm gold thread, matched to the hardware." },
];

/** The thread actually drawn, given the hide and the holder's choice. */
export function threadColour(hide: Hide, thread: ThreadId): string {
  if (thread === "brass") return "#C9A84C";
  if (thread === "tonal") return hide.outer[2];
  return hide.stitch;
}

/* ------------------------------------------------------------------------- */

/**
 * A nameplate is small and stamped. A long name struck into it comes out
 * illegible, so it is capped and upper-cased — which is also how real stamped
 * plates read.
 */
export const NAMEPLATE_MAX = 22;

export function normalizeNameplate(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/\s+/g, " ").trim().slice(0, NAMEPLATE_MAX).toUpperCase();
}
