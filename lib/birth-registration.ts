/**
 * Delayed birth registration: which rule applies, by how long after the birth.
 *
 * ⚠ LAW, CHECKED OCTOBER 2026. Section 13 of the Registration of Births and
 * Deaths Act, 1969, as amended in 2023. A 2026 Bill (passed by the Lok Sabha,
 * awaiting the Rajya Sabha when last checked) would send registrations more
 * than two years late to a Judicial Magistrate First Class instead of the
 * District Magistrate. If it becomes law, edit the "beyond" tier below and
 * delete `pendingChange`.
 *
 * Late FEES are set by each state's rules and differ, so none are quoted here.
 */

export type TierId = "on-time" | "late" | "permission" | "order" | "order-long";

export type Tier = {
  id: TierId;
  /** Inclusive lower bound, in days after birth. */
  fromDays: number;
  title: string;
  /** Who signs off. */
  decides: string;
  /** Short form for the stamp ring. */
  stamp: string;
  need: string[];
  /** LAWFIC's typical turnaround once papers are complete. */
  takes: string;
  tone: "good" | "warn" | "info" | "bad";
  pendingChange?: string;
};

const BASE_PAPERS = [
  "Hospital discharge summary or birth intimation",
  "Parents' identity proof",
  "Address proof at the time of birth",
];

export const TIERS: Tier[] = [
  {
    id: "on-time",
    fromDays: 0,
    title: "On time — no fee, no permission",
    decides: "The Registrar of Births and Deaths",
    stamp: "REGISTRAR",
    need: BASE_PAPERS,
    takes: "7–10 days for the certificate",
    tone: "good",
  },
  {
    id: "late",
    fromDays: 22,
    title: "A few days late — a small late fee",
    decides: "The Registrar, on payment of the late fee",
    stamp: "REGISTRAR · LATE FEE",
    need: [...BASE_PAPERS, "Late fee receipt (your state sets the amount)"],
    takes: "10–15 days",
    tone: "warn",
  },
  {
    id: "permission",
    fromDays: 31,
    title: "More than a month late — written permission",
    decides: "The District Registrar, in writing",
    stamp: "DISTRICT REGISTRAR",
    need: [...BASE_PAPERS, "Self-attested declaration of the birth", "Late fee receipt"],
    takes: "3–5 weeks",
    tone: "info",
  },
  {
    id: "order",
    fromDays: 366,
    title: "More than a year late — a magistrate's order",
    decides: "The District Magistrate, SDM or an authorised Executive Magistrate",
    stamp: "MAGISTRATE'S ORDER",
    need: [
      ...BASE_PAPERS,
      "Affidavit on the date and place of birth",
      "Non-availability certificate from the registrar",
      "Supporting proof — school record, hospital record or vaccination card",
    ],
    takes: "1–3 months, after the event is verified",
    tone: "bad",
  },
  {
    id: "order-long",
    fromDays: 731,
    title: "More than two years late — a magistrate's order",
    decides: "The District Magistrate, SDM or an authorised Executive Magistrate",
    stamp: "MAGISTRATE'S ORDER",
    need: [
      ...BASE_PAPERS,
      "Affidavit on the date and place of birth",
      "Non-availability certificate from the registrar",
      "The oldest records you have — school, hospital, vaccination, ration card",
    ],
    takes: "1–3 months, after the event is verified",
    tone: "bad",
    pendingChange:
      "A 2026 Bill, passed by the Lok Sabha, would move these to a Judicial Magistrate First Class. Until it becomes law, the rule above applies.",
  },
];

export function tierFor(days: number): Tier {
  let t = TIERS[0];
  for (const tier of TIERS) if (days >= tier.fromDays) t = tier;
  return t;
}

/* ── The dial's scale ──────────────────────────────────────────────────────
   Linear time would give 21 days a hair's width next to twenty years, and the
   first month is where most decisions happen. So the ring is piecewise: each
   legal tier gets a fair share of the circle, and the last stretch is
   logarithmic. */
const SEGMENTS: { t0: number; t1: number; d0: number; d1: number; log?: boolean }[] = [
  { t0: 0, t1: 0.22, d0: 0, d1: 21 },
  { t0: 0.22, t1: 0.32, d0: 21, d1: 30 },
  { t0: 0.32, t1: 0.56, d0: 30, d1: 365 },
  { t0: 0.56, t1: 0.72, d0: 365, d1: 730 },
  { t0: 0.72, t1: 1, d0: 730, d1: 7300, log: true },
];

export const MAX_DAYS = 7300;

export function daysFromT(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  const s = SEGMENTS.find((g) => x <= g.t1) ?? SEGMENTS[SEGMENTS.length - 1];
  const f = (x - s.t0) / (s.t1 - s.t0);
  const d = s.log ? s.d0 * Math.pow(s.d1 / s.d0, f) : s.d0 + f * (s.d1 - s.d0);
  return Math.round(d);
}

export function tFromDays(days: number): number {
  const d = Math.min(MAX_DAYS, Math.max(0, days));
  const s = SEGMENTS.find((g) => d <= g.d1) ?? SEGMENTS[SEGMENTS.length - 1];
  const f = s.log ? Math.log(d / s.d0) / Math.log(s.d1 / s.d0) : (d - s.d0) / (s.d1 - s.d0);
  return s.t0 + f * (s.t1 - s.t0);
}

/** The boundaries, as fractions of the ring, for tick marks. */
export const BOUNDARIES = SEGMENTS.slice(1).map((s) => ({ t: s.t0, days: s.d0 }));

export function describeDays(days: number): { big: string; small: string } {
  if (days <= 60) return { big: String(days), small: days === 1 ? "day after birth" : "days after birth" };
  if (days < 730) {
    const m = Math.round(days / 30.44);
    return { big: String(m), small: "months after birth" };
  }
  const y = days / 365.25;
  return { big: y >= 10 ? String(Math.round(y)) : y.toFixed(1).replace(/\.0$/, ""), small: "years after birth" };
}

/** Births on or after this date: the certificate is the single proof of date of birth. */
export const SINGLE_PROOF_FROM = "2023-10-01";

export const SINGLE_PROOF_USES = [
  "School admission",
  "Driving licence",
  "Voter roll",
  "Passport",
  "Aadhaar",
  "Marriage registration",
  "Government jobs",
];
