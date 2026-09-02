/**
 * Indian denominations, and how an amount breaks into notes.
 *
 * WHAT MAY BE DRAWN, AND WHAT MAY NOT
 *
 * These are stylised slips: a colour and a numeral. They are deliberately not
 * facsimiles, and that line is drawn well back from where the law sits.
 *
 * Every Indian banknote carries the Ashoka Lion Capital, which is protected by
 * the Emblems and Names (Prevention of Improper Use) Act 1950 — the same Act
 * already governing the document specimens on this site. Separately, IPC
 * sections 489A–489E criminalise counterfeiting and the making of materials
 * for it. There is no RBI rule expressly permitting decorative reproduction,
 * which is exactly why this errs well inside the safe margin.
 *
 * So a note here carries a denomination colour and its numeral. Never the
 * emblem, a portrait, a serial number, a security thread, microtext, the
 * Devanagari denomination panel, the RBI seal, or the Swachh Bharat logo.
 * `denominations.test.ts` holds the colour-and-numeral rule; the rest is a
 * matter of not drawing them, and the note component draws nothing else.
 *
 * The colours approximate the Mahatma Gandhi New Series closely enough that a
 * ₹500 slip reads as ₹500 at a glance, which is the entire point of the
 * animation.
 */

export type Denomination = {
  value: number;
  /** Face colour of the slip. */
  paper: string;
  /** A second tone, so a slip is not a flat rectangle. */
  paperEdge: string;
  /** The numeral, dark enough to read on the paper. */
  ink: string;
};

/** Highest first — `breakdown` depends on this ordering. */
export const DENOMINATIONS: Denomination[] = [
  { value: 500, paper: "#D5CDB6", paperEdge: "#A2966F", ink: "#33301E" },
  { value: 200, paper: "#EEBC50", paperEdge: "#D69F2F", ink: "#4A3608" },
  { value: 100, paper: "#BCA7CE", paperEdge: "#A08BB4", ink: "#3B2B47" },
  { value: 50, paper: "#84BBDA", paperEdge: "#659CBC", ink: "#1E3B4D" },
  { value: 20, paper: "#C9C660", paperEdge: "#ADA943", ink: "#3D3B0E" },
  { value: 10, paper: "#BE9470", paperEdge: "#A17953", ink: "#402A16" },
];

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

/** Human summary of a breakdown: "5 × ₹500 · 1 × ₹200". */
export function describeBreakdown(runs: NoteRun[]): string {
  return runs.map((r) => `${r.count} × ₹${r.value}`).join(" · ");
}
