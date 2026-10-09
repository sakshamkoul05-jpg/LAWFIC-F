/**
 * Late fees and interest: what being late on a filing actually costs.
 *
 * ⚠ STATUTORY FIGURES. They were checked in October 2026 against the CGST Act
 * (s.47, s.50) and the late-fee waiver notifications that set today's caps
 * (19/2021 and 07/2023 – Central Tax), the Income-tax Act (s.234A, s.234E,
 * s.234F, s.201(1A)), and the Companies Act / LLP Act additional-fee rules. A
 * Budget or a GST Council meeting can change any of them, and when one does
 * this file is the only place to edit.
 *
 * The calculator is an estimate for a customer deciding how urgent something
 * is. It says so on the page. It does not know about amnesty schemes, waivers
 * for a specific period, or a portal that was down on the due date.
 */

import { daysBetween } from "./calendar.ts";

export type PenaltyKind =
  | "gstr3b"
  | "gstr1"
  | "gstr9"
  | "itr"
  | "tds-return"
  | "tds-payment"
  | "roc"
  | "llp"
  | "dir3kyc";

export const PENALTY_KINDS: { id: PenaltyKind; label: string }[] = [
  { id: "gstr3b", label: "GSTR-3B (monthly / quarterly GST return)" },
  { id: "gstr1", label: "GSTR-1 (sales return)" },
  { id: "gstr9", label: "GSTR-9 (GST annual return)" },
  { id: "itr", label: "Income tax return" },
  { id: "tds-return", label: "TDS return (24Q / 26Q)" },
  { id: "tds-payment", label: "TDS deposit (paid late)" },
  { id: "roc", label: "Company annual filing (AOC-4 / MGT-7)" },
  { id: "llp", label: "LLP filing (Form 8 / Form 11)" },
  { id: "dir3kyc", label: "Director KYC (DIR-3 KYC, every three years)" },
];

export type PenaltyInput = {
  kind: PenaltyKind;
  due: string;
  /** The day it was, or will be, filed. Usually today. */
  filedOn: string;
  /** GST: was the return nil? */
  nil?: boolean;
  /** Aggregate turnover for the year, rupees. Decides GST caps. */
  turnover?: number;
  /** Tax still unpaid, rupees — GST cash liability, income tax due, or TDS amount. */
  taxDue?: number;
  /** Income tax: total income, rupees. Decides the s.234F slab. */
  totalIncome?: number;
};

export type PenaltyLine = { label: string; rupees: number; note?: string };

export type PenaltyResult = {
  daysLate: number;
  lines: PenaltyLine[];
  total: number;
  /** What the figure leaves out. */
  caveats: string[];
};

const CRORE = 10_000_000;
const LAKH = 100_000;

const round = (n: number) => Math.round(n);

/** GSTR-1 / GSTR-3B caps under Notification 19/2021, by turnover. */
export function gstMonthlyCap(turnover: number, nil: boolean): number {
  if (nil) return 500;
  if (turnover <= 1.5 * CRORE) return 2_000;
  if (turnover <= 5 * CRORE) return 5_000;
  return 10_000;
}

/** GSTR-9 per-day fee and cap under Notification 07/2023. */
export function gstr9Rule(turnover: number): { perDay: number; cap: number } {
  if (turnover <= 5 * CRORE) return { perDay: 50, cap: 0.0004 * turnover };
  if (turnover <= 20 * CRORE) return { perDay: 100, cap: 0.0004 * turnover };
  return { perDay: 200, cap: 0.005 * turnover };
}

/** Whole months, any part counted as a full month — how s.234A and s.201(1A) count. */
function monthsPart(days: number): number {
  return days <= 0 ? 0 : Math.ceil(days / 30.4375);
}

export function estimatePenalty(input: PenaltyInput): PenaltyResult {
  const daysLate = Math.max(0, daysBetween(input.due, input.filedOn));
  const lines: PenaltyLine[] = [];
  const caveats: string[] = [];
  const turnover = input.turnover ?? 0;
  const tax = Math.max(0, input.taxDue ?? 0);

  if (daysLate === 0) {
    return { daysLate, lines: [], total: 0, caveats: ["Filed on or before the due date — nothing is owed for lateness."] };
  }

  switch (input.kind) {
    case "gstr3b":
    case "gstr1": {
      const perDay = input.nil ? 20 : 50;
      const cap = gstMonthlyCap(turnover, Boolean(input.nil));
      const fee = Math.min(perDay * daysLate, cap);
      lines.push({
        label: "Late fee",
        rupees: fee,
        note: `₹${perDay}/day (CGST + SGST), capped at ₹${cap.toLocaleString("en-IN")}`,
      });
      if (input.kind === "gstr3b" && tax > 0) {
        lines.push({
          label: "Interest at 18% a year",
          rupees: round((tax * 0.18 * daysLate) / 365),
          note: "On the tax paid in cash after the due date (s.50)",
        });
      }
      if (input.kind === "gstr1") caveats.push("A late GSTR-1 also delays your buyers' input credit, which is usually the bigger cost.");
      break;
    }
    case "gstr9": {
      const r = gstr9Rule(turnover);
      lines.push({
        label: "Late fee",
        rupees: round(Math.min(r.perDay * daysLate, r.cap)),
        note: `₹${r.perDay}/day, capped at ${turnover > 20 * CRORE ? "0.5%" : "0.04%"} of turnover in the state`,
      });
      if (!turnover) caveats.push("Enter turnover — the GSTR-9 cap is a share of it.");
      break;
    }
    case "itr": {
      const income = input.totalIncome ?? 0;
      const fee = income <= 5 * LAKH ? 1_000 : 5_000;
      lines.push({
        label: "Late filing fee (s.234F)",
        rupees: fee,
        note: income <= 5 * LAKH ? "₹1,000 when total income is up to ₹5 lakh" : "₹5,000",
      });
      if (tax > 0) {
        const m = monthsPart(daysLate);
        lines.push({
          label: "Interest at 1% a month (s.234A)",
          rupees: round(tax * 0.01 * m),
          note: `${m} month${m === 1 ? "" : "s"}, part of a month counted as whole`,
        });
      }
      caveats.push("A belated return cannot carry forward most business losses.");
      caveats.push("A belated return can be filed only until 31 December after the year ends; after that only an updated return (ITR-U) with additional tax is possible.");
      break;
    }
    case "tds-return": {
      const raw = 200 * daysLate;
      const fee = tax > 0 ? Math.min(raw, tax) : raw;
      lines.push({
        label: "Late fee (s.234E)",
        rupees: fee,
        note: tax > 0 ? "₹200/day, never more than the TDS in the return" : "₹200/day — enter the TDS amount to apply the cap",
      });
      if (daysLate > 365) caveats.push("Past a year late, a penalty of ₹10,000 to ₹1,00,000 under s.271H is also possible.");
      break;
    }
    case "tds-payment": {
      /* s.201(1A) runs from the date of DEDUCTION, which falls in the month
         before the deposit due date — so the count starts one month earlier
         than the lateness, and any part of a month is a whole month. */
      const m = monthsPart(daysLate) + 1;
      lines.push({
        label: "Interest at 1.5% a month (s.201(1A))",
        rupees: round(tax * 0.015 * m),
        note: `${m} months, counted from the month the tax was deducted`,
      });
      if (!tax) caveats.push("Enter the TDS amount to calculate the interest.");
      break;
    }
    case "roc":
    case "llp": {
      lines.push({
        label: "Additional fee",
        rupees: 100 * daysLate,
        note: "₹100 a day, per form, with no upper limit",
      });
      caveats.push("This is per form — a company late on both AOC-4 and MGT-7 pays it twice.");
      break;
    }
    case "dir3kyc": {
      lines.push({ label: "Reactivation fee", rupees: 5_000, note: "Flat, per director, once the DIN is deactivated" });
      break;
    }
  }

  return {
    daysLate,
    lines,
    total: lines.reduce((s, l) => s + l.rupees, 0),
    caveats,
  };
}
