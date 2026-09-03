/**
 * Indian denominations, and how an amount breaks into notes.
 *
 * WHAT IS COPIED FROM THE REAL NOTE, AND WHAT IS NOT
 *
 * Everything here is drawn to the Mahatma Gandhi New Series: the official
 * colour of each denomination and its real milled size, down to the millimetre.
 * Those sizes are not decoration. Indian notes step in length by denomination —
 * a ₹500 is 150mm, a ₹10 is 123mm — and they step in height too, 66mm above
 * ₹50 and 63mm below it. A stack drawn at one ratio for everything is the
 * single most obvious tell that the money is fake, so the sizes are modelled
 * and `Banknote` derives its geometry from them.
 *
 * What is NOT drawn, and must never be:
 *
 *   - the Ashoka Lion Capital. Protected by the Emblems and Names (Prevention
 *     of Improper Use) Act 1950 — the same Act already governing the document
 *     specimens on this site — and protected regardless of context or intent;
 *   - the portrait of Mahatma Gandhi;
 *   - the Reserve Bank of India's name, seal, legend, guarantee clause or the
 *     Governor's signature;
 *   - a serial number in the real format, microtext, or the security-thread
 *     lettering.
 *
 * IPC 489A–489E criminalise counterfeiting and the making of materials for it,
 * and there is no RBI rule expressly permitting decorative reproduction. The
 * line drawn is therefore: everything that makes a note *recognisable* — its
 * colour, its size, its denomination panels in both scripts, the guilloché,
 * the bleed lines — and nothing that makes it *authentic*. The result reads as
 * a ₹500 at a glance in a wallet, which is the entire point, and cannot be
 * mistaken for one in the hand.
 *
 * `denominations.test.ts` holds that line as an allowlist of fields.
 */

export type Denomination = {
  value: number;
  /** Real note length in mm, per RBI. Drives the drawn aspect ratio. */
  widthMm: number;
  /** Real note height in mm. 66 down to ₹50, 63 below it. */
  heightMm: number;
  /** Face colour, from the official description for the series. */
  paper: string;
  /** A second tone for the guilloché and the border. */
  paperEdge: string;
  /** The numerals, dark enough to read on the paper. */
  ink: string;
  /**
   * Raised angular bars on the right edge, by which someone who cannot see the
   * note tells one denomination from another. ₹500 carries five, ₹200 four,
   * ₹100 four; ₹50 and below carry none. A real functional feature, and the
   * kind of correct detail that sells the rest.
   */
  bleedLines: number;
};

/** Highest first — `breakdown` depends on this ordering. */
export const DENOMINATIONS: Denomination[] = [
  // Stone grey
  { value: 500, widthMm: 150, heightMm: 66, paper: "#C9C3B0", paperEdge: "#8B8676", ink: "#33301E", bleedLines: 5 },
  // Bright yellow
  { value: 200, widthMm: 146, heightMm: 66, paper: "#F0C04B", paperEdge: "#C2932A", ink: "#4A3608", bleedLines: 4 },
  // Lavender
  { value: 100, widthMm: 142, heightMm: 66, paper: "#C4B0D4", paperEdge: "#9880AE", ink: "#3B2B47", bleedLines: 4 },
  // Fluorescent blue
  { value: 50, widthMm: 135, heightMm: 66, paper: "#8FC3DD", paperEdge: "#5E97B8", ink: "#1B3A4B", bleedLines: 0 },
  // Greenish yellow
  { value: 20, widthMm: 129, heightMm: 63, paper: "#CFD05F", paperEdge: "#A3A53C", ink: "#3A3B0E", bleedLines: 0 },
  // Chocolate brown
  { value: 10, widthMm: 123, heightMm: 63, paper: "#C1926A", paperEdge: "#96684A", ink: "#3E2A18", bleedLines: 0 },
];

/** Devanagari numerals, for the denomination panel a real note carries. */
const DEVANAGARI = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

/** 500 -> "५००". Digits only: a number in another script is still a number. */
export function devanagari(value: number): string {
  return String(value)
    .split("")
    .map((c) => DEVANAGARI[Number(c)] ?? c)
    .join("");
}

/** The largest note in circulation, used to scale the others against it. */
export const LARGEST_MM = 150;

/**
 * A note's width as a percentage of a ₹500's, for laying a stack out in CSS.
 *
 * A stack is positioned against the biggest note it can hold, and every other
 * denomination is drawn shorter by exactly the millimetres it really is —
 * which is what makes a mixed stack look like cash rather than like one note
 * drawn several times.
 */
export function widthPct(value: number): number {
  const d = getDenomination(value);
  return d ? (d.widthMm / LARGEST_MM) * 100 : 100;
}

export type NoteRun = { value: number; count: number };

/**
 * Break an amount into notes, the way a cashier would: largest first.
 *
 * Amounts are paise everywhere else in this codebase, so this takes paise and
 * works in rupees internally. Anything below ₹10 cannot be represented as a
 * note and is ignored by the animation — the balance is still exact, because
 * the balance comes from the ledger and never from this.
 */
export function breakdown(amountPaise: number): NoteRun[] {
  let rupees = Math.floor(Math.max(0, amountPaise) / 100);
  const runs: NoteRun[] = [];

  for (const d of DENOMINATIONS) {
    const count = Math.floor(rupees / d.value);
    if (count > 0) {
      runs.push({ value: d.value, count });
      rupees -= count * d.value;
    }
  }
  return runs;
}

/** Total notes in a breakdown. */
export function noteCount(runs: NoteRun[]): number {
  return runs.reduce((n, r) => n + r.count, 0);
}

/**
 * How many notes to actually animate.
 *
 * A ₹50,000 top-up is a hundred ₹500 notes, and a hundred notes flying one at
 * a time is a minute of animation nobody asked for. Past a dozen the extras
 * arrive as fanned groups, so the sequence stays around a second whatever the
 * amount. The COUNT shown to the customer is always the true one.
 */
export const MAX_ANIMATED_NOTES = 12;

export function animationPlan(runs: NoteRun[]): {
  /** One entry per note actually drawn flying. */
  flying: number[];
  /** Notes represented by the stack but not individually animated. */
  grouped: number;
  total: number;
} {
  const total = noteCount(runs);
  const flying: number[] = [];

  for (const run of runs) {
    for (let i = 0; i < run.count; i++) {
      if (flying.length >= MAX_ANIMATED_NOTES) break;
      flying.push(run.value);
    }
    if (flying.length >= MAX_ANIMATED_NOTES) break;
  }

  return { flying, grouped: Math.max(0, total - flying.length), total };
}

export function getDenomination(value: number): Denomination | undefined {
  return DENOMINATIONS.find((d) => d.value === value);
}

/**
 * The notes to draw sitting in the wallet at rest, for a given balance.
 *
 * Drawn from the real breakdown rather than invented, so the mix in the
 * compartment is one the balance actually contains: ₹24,350 is forty-eight
 * ₹500s, a ₹200, a ₹100 and a ₹50, and showing one of each of those plus a few
 * ₹500s is both truthful and what a wallet holding that much would look like.
 * A stack of identical ₹500s reads as wallpaper; a mix reads as money.
 *
 * Largest first, because that is the order they end up stacked in.
 */
export function restingStack(balancePaise: number, max = 6): number[] {
  const runs = breakdown(balancePaise);
  if (runs.length === 0) return [];

  // One of every denomination present, so the mix is visible at all.
  const picked = runs.slice(0, max).map((r) => r.value);

  // Then fill the remaining room from the largest note, which is where the
  // bulk of any real balance sits.
  let i = 0;
  while (picked.length < max && i < runs.length) {
    const run = runs[i];
    const alreadyShown = picked.filter((v) => v === run.value).length;
    if (alreadyShown < run.count) picked.push(run.value);
    else i++;
  }

  return picked.sort((a, b) => b - a);
}

/** Human summary of a breakdown: "5 × ₹500 · 1 × ₹200". */
export function describeBreakdown(runs: NoteRun[]): string {
  return runs.map((r) => `${r.count} × ₹${r.value}`).join(" · ");
}
