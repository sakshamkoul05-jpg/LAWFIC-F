/**
 * MSME classification: the slabs, and what a given pair of figures makes you.
 *
 * ⚠ THE NUMBERS BELOW ARE A FACT ABOUT INDIAN LAW AND THEY CHANGE.
 *
 * They were last revised in the Union Budget 2025 and took effect on
 * 1 April 2025, roughly doubling investment and turnover ceilings against the
 * 2020 set. Before this calculator goes in front of a paying customer somebody
 * must check them against the current notification on udyamregistration.gov.in
 * — and re-check whenever a Budget touches MSME definitions.
 *
 * They are ALL IN ONE PLACE for exactly that reason: updating the law is
 * editing this array, not hunting through components. A calculator quietly
 * running last year's slabs tells a small business it is medium, which changes
 * which schemes it can apply for, and the customer has no way to know we are
 * wrong.
 *
 * THE RULE ITSELF, WHICH IS NOT OBVIOUS
 *
 * An enterprise is classified on the HIGHER of the two tests, not the lower. A
 * business with micro-sized investment and small-sized turnover is small. Get
 * this backwards and every borderline answer is wrong in the direction that
 * flatters the customer, which is the worse direction.
 */

export type MsmeClass = "micro" | "small" | "medium" | "beyond";

export type Slab = {
  id: Exclude<MsmeClass, "beyond">;
  label: string;
  /** Rupees. Plant, machinery and equipment. */
  investmentMax: number;
  /** Rupees. Excluding exports. */
  turnoverMax: number;
};

const CRORE = 10_000_000;

/** As notified with effect from 1 April 2025. Verify before shipping. */
export const SLABS_EFFECTIVE_FROM = "1 April 2025";

export const SLABS: Slab[] = [
  { id: "micro", label: "Micro", investmentMax: 2.5 * CRORE, turnoverMax: 10 * CRORE },
  { id: "small", label: "Small", investmentMax: 25 * CRORE, turnoverMax: 100 * CRORE },
  { id: "medium", label: "Medium", investmentMax: 125 * CRORE, turnoverMax: 500 * CRORE },
];

export type Classification = {
  result: MsmeClass;
  label: string;
  /** Which of the two tests decided it — the one that pushed the class up. */
  decidedBy: "investment" | "turnover" | "both";
  /** 0–1 across the whole ladder, for the visual band. */
  position: number;
  note: string;
};

/**
 * Classify an enterprise.
 *
 * Both figures are taken at face value; nothing here validates that they are
 * true, because nothing can. What it does guarantee is that the same pair of
 * numbers always produces the same answer as the portal's own rule.
 */
export function classify(investment: number, turnover: number): Classification {
  const byInvestment = SLABS.findIndex((s) => investment <= s.investmentMax);
  const byTurnover = SLABS.findIndex((s) => turnover <= s.turnoverMax);

  /* -1 means it fell off the end of the ladder on that test. */
  const i = byInvestment === -1 ? SLABS.length : byInvestment;
  const t = byTurnover === -1 ? SLABS.length : byTurnover;

  /* THE HIGHER of the two, not the lower. */
  const idx = Math.max(i, t);

  if (idx >= SLABS.length) {
    return {
      result: "beyond",
      label: "Above the MSME limits",
      decidedBy: i > t ? "investment" : t > i ? "turnover" : "both",
      position: 1,
      note: "On these figures the enterprise is outside the MSME definition, so Udyam registration does not apply. Worth a conversation before you file anything.",
    };
  }

  const slab = SLABS[idx]!;
  const decidedBy = i === t ? "both" : i > t ? "investment" : "turnover";

  return {
    result: slab.id,
    label: slab.label,
    decidedBy,
    position: (idx + 1) / (SLABS.length + 1),
    note:
      decidedBy === "both"
        ? `Both figures sit inside the ${slab.label.toLowerCase()} band.`
        : decidedBy === "investment"
          ? `Turnover alone would place you lower — investment is what makes this ${slab.label.toLowerCase()}.`
          : `Investment alone would place you lower — turnover is what makes this ${slab.label.toLowerCase()}.`,
  };
}

/**
 * Rupees as a human would say them: 2.5 crore, 40 lakh, 5,000.
 *
 * Written out rather than handed to Intl, which has no idea what a crore is
 * and will offer "25,000,000" — a number an Indian business owner has to
 * count the commas on before they can read it.
 */
export function inWords(rupees: number): string {
  if (!Number.isFinite(rupees) || rupees <= 0) return "0";
  if (rupees >= CRORE) return `${trim(rupees / CRORE)} crore`;
  if (rupees >= 100_000) return `${trim(rupees / 100_000)} lakh`;
  return groupIndian(Math.round(rupees));
}

function trim(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, "");
}

/** Last three digits, then pairs — the way a rupee amount is grouped. */
export function groupIndian(n: number): string {
  const s = Math.abs(Math.round(n)).toString();
  if (s.length <= 3) return (n < 0 ? "-" : "") + s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  let out = "";
  while (rest.length > 2) {
    out = "," + rest.slice(-2) + out;
    rest = rest.slice(0, -2);
  }
  return (n < 0 ? "-" : "") + rest + out + "," + last3;
}

/**
 * The organisation types Udyam recognises, in the order the portal lists them.
 * `aadhaarOf` is whose Aadhaar the filing runs against — the single thing
 * people most often get wrong, and the reason a filing bounces.
 */
export const ORG_TYPES = [
  { id: "proprietorship", label: "Proprietorship", aadhaarOf: "the proprietor" },
  { id: "partnership", label: "Partnership firm", aadhaarOf: "the managing partner" },
  { id: "llp", label: "LLP", aadhaarOf: "a designated partner" },
  { id: "private-limited", label: "Private limited company", aadhaarOf: "a director" },
  { id: "opc", label: "One Person Company", aadhaarOf: "the director" },
  { id: "society", label: "Society or trust", aadhaarOf: "an authorised signatory" },
] as const;

export type OrgTypeId = (typeof ORG_TYPES)[number]["id"];

/** The three activities the portal asks you to pick between. */
export const ACTIVITIES = [
  { id: "manufacturing", label: "Manufacturing", hint: "You make or process goods." },
  { id: "service", label: "Service", hint: "You provide services rather than goods." },
  { id: "trading", label: "Trading", hint: "You buy and resell without processing." },
] as const;

export type ActivityId = (typeof ACTIVITIES)[number]["id"];

/**
 * Traders are a special case and it is the single most common disappointment
 * in this whole process, so the form says it before the customer pays rather
 * than after their filing is rejected.
 */
export const TRADING_CAVEAT =
  "Wholesale and retail traders can register on Udyam, but they are admitted only for the purposes of priority-sector lending — not for the wider MSME schemes, subsidies or the 45-day payment protection. If that is what you are registering for, tell us and we will say so plainly before you pay.";
