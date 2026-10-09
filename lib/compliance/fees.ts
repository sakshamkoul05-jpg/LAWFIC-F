/**
 * The fee calculator's arithmetic: government fee, LAWFIC's fee, the member
 * discount, and tax — four numbers a customer can add up themselves.
 *
 * GST ON OUR FEE IS CONDITIONAL, NOT ASSUMED
 *
 * LAWFIC charges GST on its professional fee only once it holds a GSTIN
 * (lib/company.ts). Until then the line reads "No GST charged" rather than
 * adding 18% to a total — charging tax without a registration is an offence,
 * and showing it on an estimate would be a promise the invoice cannot keep.
 * Government fees never carry GST from us: they are the government's.
 */

import { savingOn } from "../subscription.ts";

/** "₹1,499" → 1499. Returns null for prose like "Free" or a range. */
export function parseRupees(text: string): number | null {
  if (/^\s*free/i.test(text)) return 0;
  const m = /₹\s*([\d,]+)/.exec(text);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

export type FeeEstimate = {
  governmentPaise: number;
  professionalPaise: number;
  discountPaise: number;
  gstPaise: number;
  totalPaise: number;
  gstApplies: boolean;
};

export function estimateFees(input: {
  governmentRupees: number;
  professionalRupees: number;
  planId: string;
  gstRegistered: boolean;
  gstRate?: number;
}): FeeEstimate {
  const governmentPaise = Math.max(0, Math.round(input.governmentRupees * 100));
  const professionalPaise = Math.max(0, Math.round(input.professionalRupees * 100));
  const { discountPaise, payablePaise } = savingOn(professionalPaise, input.planId);
  const gstPaise = input.gstRegistered ? Math.round(payablePaise * (input.gstRate ?? 0.18)) : 0;
  return {
    governmentPaise,
    professionalPaise,
    discountPaise,
    gstPaise,
    totalPaise: governmentPaise + payablePaise + gstPaise,
    gstApplies: input.gstRegistered,
  };
}
