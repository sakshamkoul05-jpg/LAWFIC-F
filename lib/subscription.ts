import { plans, type Plan } from "./pricing.ts";

/**
 * Memberships: what a subscriber gets, what it costs, and the two hard limits
 * that Indian regulation puts on the shape of the thing.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE: THE BENEFIT IS NEVER DENOMINATED IN WALLET RUPEES
 *
 * The obvious design is "pay ₹1,999 a month, get ₹2,200 of wallet credit".
 * It is also the one design to avoid, and the reason is what happens at the end
 * of the month.
 *
 * Credit that expires is a forfeiture, and forfeiting money a customer has
 * already paid for is exactly the kind of term the CCPA's dark-pattern
 * guidelines exist to catch. Credit that does NOT expire is worse in a
 * different direction: it accumulates into an open-ended liability on a wallet
 * that is deliberately closed-loop and therefore cannot be cashed out, so a
 * customer who stops filing is left holding a balance they can neither spend
 * nor redeem. Either way the argument is about money, and the customer is
 * right.
 *
 * So a membership buys DISCOUNTS and INCLUDED FILINGS. Both are entitlements
 * against work, they lapse with the period they belong to without anybody
 * losing a rupee they paid, and the wallet stays what it is: money the customer
 * put in, spendable on anything in the catalogue. The subscription fee is
 * charged THROUGH the wallet like any other debit, so one statement still
 * explains every movement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO: ₹15,000 IS A CEILING ON THE PRICE OF ANY AUTO-RENEWING TIER
 *
 * Under the RBI's Digital Payments E-mandate Framework, 2026, a recurring debit
 * runs without additional-factor authentication only up to ₹15,000 per
 * transaction. Above that the customer must authenticate EVERY debit, which
 * means a renewal that fails silently whenever somebody is away from their
 * phone. The ₹1,00,000 ceiling reported alongside it does not apply here: it is
 * for insurance premiums, mutual funds and credit-card bills, and professional
 * services are not on that list.
 *
 * Both paid tiers sit well under the line, and `assertMandateSafe` below keeps
 * it that way. The consequence worth knowing before it is discovered the hard
 * way: AN ANNUAL PLAN CANNOT BE AN E-MANDATE. ₹1,999 × 12 with two months off
 * is ₹19,990, which is over the limit, so an annual membership has to be taken
 * as a single authenticated payment rather than as a standing instruction.
 * `ANNUAL_NEEDS_AFA` marks that, and the checkout has to honour it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THREE: CANCELLING IS AS EASY AS SUBSCRIBING
 *
 * "Subscription trap" is one of the thirteen dark patterns the CCPA named in
 * 2023, and hiding cancellation is its textbook form. So cancellation is a
 * button in the account, it takes effect without anyone being telephoned, and
 * `cancellation` below is the copy that says what happens next — stated before
 * the customer subscribes, not after they try to leave.
 */

/** 18%, the GST rate on professional and consultancy services. */
export const GST_RATE = 0.18;

/**
 * The RBI's per-transaction ceiling for a recurring debit with no
 * authentication step. 15,00,000 paise.
 */
export const MANDATE_AFA_CEILING_PAISE = 1500000;

export type BillingPeriod = "monthly" | "annual";

/** Two months free, which is the usual shape and easy to verify against the
    monthly price rather than being a number nobody can check. */
export const ANNUAL_MONTHS_CHARGED = 10;

export type Membership = {
  /** Same id as the plan in pricing.ts. One source for the tier list. */
  id: string;
  /** Percentage off any one-off service in the catalogue. */
  discountPercent: number;
  /**
   * Filings the fee already covers each month, by service slug.
   *
   * Denominated in WORK, not rupees — see the note at the top. An unused
   * allowance lapses with the month and costs the customer nothing, because
   * they were never holding it as money.
   */
  includedMonthly: { slug: string; label: string; count: number }[];
  /** Turnaround promise, if the tier carries one. */
  priorityHours?: number;
  /**
   * Standing benefits that are not a filing and not a discount — a vault, a
   * place in the queue, a named person.
   *
   * The low tiers are built almost entirely out of these, and deliberately. A
   * ₹99 membership that included a ₹499 filing would lose money on every
   * member who used it, and a benefit withdrawn a quarter after launch is
   * worse than one never offered. Still denominated in service rather than
   * money, which is the rule the whole file turns on.
   */
  perks?: string[];
};

export const memberships: Membership[] = [
  {
    id: "basic",
    discountPercent: 5,
    includedMonthly: [],
    perks: ["Document vault", "Renewal reminders"],
  },
  {
    id: "personal",
    discountPercent: 8,
    includedMonthly: [],
    perks: ["Up to four family members", "Priority queue", "One free re-issue a year"],
  },
  {
    id: "professional",
    discountPercent: 10,
    includedMonthly: [],
    perks: ["Named point of contact", "Annual income tax return"],
  },
  {
    id: "startup",
    discountPercent: 12,
    includedMonthly: [
      { slug: "gst-returns", label: "GST returns (GSTR-1 and 3B)", count: 1 },
    ],
    perks: ["Due-date calendar"],
  },
  {
    id: "business",
    discountPercent: 15,
    includedMonthly: [
      { slug: "gst-returns", label: "GST returns (GSTR-1 and 3B)", count: 1 },
      { slug: "tds-returns", label: "TDS return", count: 1 },
      { slug: "payroll", label: "Payroll run, up to 25 employees", count: 1 },
    ],
    perks: ["Form 16 issuance"],
  },
  {
    id: "compliance",
    discountPercent: 18,
    includedMonthly: [
      { slug: "gst-returns", label: "GST returns (GSTR-1 and 3B)", count: 1 },
      { slug: "tds-returns", label: "TDS return", count: 1 },
      { slug: "payroll", label: "Payroll run, up to 25 employees", count: 1 },
      { slug: "pf-esi", label: "PF and ESI filings", count: 1 },
    ],
    priorityHours: 24,
    perks: ["ROC annual filings", "Dedicated compliance manager"],
  },
];

/**
 * The tiers that actually charge something, in price order.
 *
 * The return type carries the narrowing. `Plan.monthlyPaise` is nullable
 * because the pay-per-filing tier has no recurring fee, and without saying so
 * here every caller would have to re-check a value this function has already
 * filtered on.
 */
export type PaidPlan = Plan & { monthlyPaise: number };

export function paidPlans(): PaidPlan[] {
  return plans
    .filter((p): p is PaidPlan => p.monthlyPaise !== null)
    .sort((a, b) => a.monthlyPaise - b.monthlyPaise);
}

export function membershipFor(planId: string): Membership | undefined {
  return memberships.find((m) => m.id === planId);
}

/**
 * What a period actually costs, with tax shown as its own number.
 *
 * The fee in pricing.ts is the professional fee, exclusive of GST — the same
 * convention the rest of the site uses, where a statutory amount is never
 * folded into LAWFIC's own. A subscriber sees three figures and can add them
 * up: fee, tax, total.
 */
export type PriceBreakdown = {
  period: BillingPeriod;
  /** Months of professional fee actually charged for this period. */
  monthsCharged: number;
  feePaise: number;
  gstPaise: number;
  totalPaise: number;
  /** Annual only: what twelve monthly periods would have cost instead. */
  savingPaise: number;
  /** True when this total is over the no-authentication ceiling. */
  needsAfaEachDebit: boolean;
};

/** Paise, rounded half-up. Money is never left as a fraction. */
function roundPaise(value: number): number {
  return Math.round(value);
}

export function priceFor(monthlyPaise: number, period: BillingPeriod): PriceBreakdown {
  const monthsCharged = period === "annual" ? ANNUAL_MONTHS_CHARGED : 1;
  const feePaise = monthlyPaise * monthsCharged;
  const gstPaise = roundPaise(feePaise * GST_RATE);
  const totalPaise = feePaise + gstPaise;

  return {
    period,
    monthsCharged,
    feePaise,
    gstPaise,
    totalPaise,
    /* Against twelve months at the monthly rate, tax included, so the saving
       is the number that leaves the customer's account rather than a
       pre-tax figure that flatters the comparison. */
    savingPaise:
      period === "annual"
        ? roundPaise(monthlyPaise * 12 * (1 + GST_RATE)) - totalPaise
        : 0,
    needsAfaEachDebit: totalPaise > MANDATE_AFA_CEILING_PAISE,
  };
}

/**
 * True when a price can auto-renew without the customer authenticating each
 * time. Anything false has to be sold as a one-off authenticated payment.
 */
export function canAutoRenew(totalPaise: number): boolean {
  return totalPaise <= MANDATE_AFA_CEILING_PAISE;
}

/**
 * Whether a given tier and period can be put on autopay.
 *
 * PER TIER, BECAUSE THE ANSWER DIFFERS BY TIER
 *
 * Every monthly price on this ladder clears the ceiling comfortably — the
 * dearest is ₹1,999, which is ₹2,358.82 debited. Yearly is where it splits.
 * Ten months of fee plus 18% has to come in under ₹15,000, which means a
 * monthly fee of at most ₹1,271:
 *
 *     ₹99    →  ₹1,168.20 a year   autopay
 *     ₹199   →  ₹2,348.20          autopay
 *     ₹599   →  ₹7,068.20          autopay
 *     ₹999   → ₹11,788.20          autopay
 *     ₹1,499 → ₹17,688.20          one authenticated payment a year
 *     ₹1,999 → ₹23,588.20          one authenticated payment a year
 *
 * So the top two tiers can be paid yearly but cannot be MANDATED yearly, and
 * the checkout has to say which it is before the customer commits. Computed
 * from the price list rather than written down, so it follows a price change
 * instead of quietly becoming wrong.
 */
export function autopayable(monthlyPaise: number, period: BillingPeriod): boolean {
  return canAutoRenew(priceFor(monthlyPaise, period).totalPaise);
}

/** The tiers whose YEARLY price is over the mandate ceiling, by id. */
export function annualNeedsAfa(): string[] {
  return paidPlans()
    .filter((p) => !autopayable(p.monthlyPaise, "annual"))
    .map((p) => p.id);
}

/** True when at least one tier cannot be mandated yearly. */
export const ANNUAL_NEEDS_AFA = annualNeedsAfa().length > 0;

/**
 * Throws if a plan has been priced where its renewals would start failing.
 *
 * Called by the test suite rather than at import time: a module that throws
 * on load takes the whole site down over a pricing typo, when what is wanted
 * is a red build.
 */
export function assertMandateSafe(): void {
  for (const plan of paidPlans()) {
    const monthly = priceFor(plan.monthlyPaise, "monthly");
    if (!canAutoRenew(monthly.totalPaise)) {
      throw new Error(
        `Plan "${plan.id}" costs ${monthly.totalPaise} paise a month including GST, over the ` +
          `₹15,000 e-mandate ceiling. Every renewal would need the customer to authenticate, ` +
          `so it cannot be sold as an auto-renewing monthly plan at this price.`,
      );
    }
  }
}

/**
 * What a subscriber saves on one service, and whether the membership has paid
 * for itself yet.
 *
 * The honest version of this number: it compares against what the same work
 * costs WITHOUT a membership, and it counts the fee actually paid. A saving
 * figure that ignores the subscription price is an advertisement.
 */
export function savingOn(
  servicePaise: number,
  planId: string,
): { discountPaise: number; payablePaise: number } {
  const m = membershipFor(planId);
  if (!m) return { discountPaise: 0, payablePaise: servicePaise };
  const discountPaise = roundPaise(servicePaise * (m.discountPercent / 100));
  return { discountPaise, payablePaise: servicePaise - discountPaise };
}

/**
 * The break-even: rupees of one-off work per month at which the discount alone
 * repays the fee, ignoring included filings.
 *
 * Deliberately the pessimistic figure. Counting the included filings would
 * produce a smaller, more flattering number that depends on the customer
 * needing exactly those filings, and a break-even that assumes the best case
 * is not a break-even.
 */
export function breakEvenMonthlyPaise(planId: string): number | null {
  const plan = paidPlans().find((p) => p.id === planId);
  const m = membershipFor(planId);
  if (!plan || !m || m.discountPercent === 0) return null;
  return roundPaise(plan.monthlyPaise / (m.discountPercent / 100));
}

/** State of one subscriber, as the app needs to read it. */
export type SubscriptionStatus =
  | "active"
  /** Cancelled, still inside the period already paid for. */
  | "cancelling"
  | "past_due"
  | "expired"
  | "none";

export type Subscription = {
  planId: string;
  period: BillingPeriod;
  status: SubscriptionStatus;
  /** When the paid period ends. The next debit lands on this date if active. */
  currentPeriodEnd: string;
  /** Set once cancellation is requested, for "runs until" copy. */
  cancelledAt?: string | null;
};

/** Entitlements still apply through a period that has been paid for. */
export function isEntitled(sub: Subscription | null): boolean {
  return sub !== null && (sub.status === "active" || sub.status === "cancelling");
}

/**
 * The terms, written once and shown before anybody subscribes.
 *
 * This is not boilerplate. Under the CCPA's dark-pattern guidelines the
 * renewal amount, its frequency and the way out all have to be disclosed at
 * the point of subscription, so they live next to the price rather than in a
 * policy page nobody opens.
 */
export const cancellation = {
  heading: "How renewal and cancellation work",
  points: [
    "Your membership renews automatically on the date shown, at the same price. You will be told what the amount is before it is taken.",
    "Your bank or card issuer sends you a notice at least 24 hours before each debit, giving the amount, the date and a reference.",
    "Cancel from your account at any time, in one step — no call, no email, no form.",
    "Cancelling stops the next renewal. The period you have already paid for runs to its end and your benefits stay on until then.",
    "Filings already in progress are completed whether you cancel or not.",
    "Unused included filings belong to the month they were in and do not carry over. They are work we set aside for you, not money held on your behalf, so nothing you paid is lost.",
  ],
};
