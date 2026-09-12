import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ANNUAL_MONTHS_CHARGED,
  ANNUAL_NEEDS_AFA,
  GST_RATE,
  MANDATE_AFA_CEILING_PAISE,
  assertMandateSafe,
  breakEvenMonthlyPaise,
  canAutoRenew,
  isEntitled,
  membershipFor,
  memberships,
  paidPlans,
  priceFor,
  savingOn,
  type Subscription,
} from "./subscription.ts";
import { plans } from "./pricing.ts";

/**
 * The tests that matter here are the regulatory ones.
 *
 * Arithmetic on a price is easy to eyeball; a plan quietly priced over the
 * e-mandate ceiling is not, because nothing breaks until real customers'
 * renewals start failing one at a time. So the ceiling has a test, and it is
 * the one that fails the build.
 */

test("no auto-renewing monthly plan is priced over the e-mandate ceiling", () => {
  /* The real assertion: this must not throw for the prices in pricing.ts. */
  assert.doesNotThrow(() => assertMandateSafe());
});

test("assertMandateSafe would actually catch a plan priced over the ceiling", () => {
  /* A guard nobody has seen fail is a guard nobody knows works. The ceiling is
     ₹15,000; ₹14,000 a month is under it on its own and over it once 18% GST
     is added, which is exactly the mistake worth catching. */
  const overByTax = priceFor(1400000, "monthly");
  assert.equal(overByTax.feePaise, 1400000);
  assert.ok(overByTax.feePaise < MANDATE_AFA_CEILING_PAISE, "fee alone is under the line");
  assert.ok(
    overByTax.totalPaise > MANDATE_AFA_CEILING_PAISE,
    "but the amount actually debited is over it",
  );
  assert.equal(overByTax.needsAfaEachDebit, true);
  assert.equal(canAutoRenew(overByTax.totalPaise), false);
});

test("GST is added to the fee rather than carved out of it", () => {
  const { feePaise, gstPaise, totalPaise } = priceFor(199900, "monthly");
  assert.equal(feePaise, 199900);
  assert.equal(gstPaise, Math.round(199900 * GST_RATE));
  assert.equal(totalPaise, feePaise + gstPaise);
  /* The customer can add the two visible numbers and get the third. */
  assert.equal(feePaise + gstPaise, totalPaise);
});

test("an annual period charges ten months and says what that saves", () => {
  const monthly = 199900;
  const annual = priceFor(monthly, "annual");

  assert.equal(annual.monthsCharged, ANNUAL_MONTHS_CHARGED);
  assert.equal(annual.feePaise, monthly * 10);

  /* The saving is measured against twelve months INCLUDING tax, because that
     is the money that leaves the customer's account. A pre-tax comparison
     would overstate it. */
  const twelveWithTax = Math.round(monthly * 12 * (1 + GST_RATE));
  assert.equal(annual.savingPaise, twelveWithTax - annual.totalPaise);
  assert.ok(annual.savingPaise > 0);
});

test("the annual price is over the ceiling, so it cannot be a standing instruction", () => {
  /* Not a preference — it is why annual has to be sold as a single
     authenticated payment. If a future price brings it under the line this
     test fails and the checkout note can come out. */
  assert.equal(ANNUAL_NEEDS_AFA, true);

  for (const plan of paidPlans()) {
    const annual = priceFor(plan.monthlyPaise, "annual");
    assert.equal(
      annual.needsAfaEachDebit,
      true,
      `${plan.id} annual is ${annual.totalPaise} paise, expected over the ceiling`,
    );
  }
});

test("every membership matches a paid plan, and every paid plan a membership", () => {
  const paid = paidPlans().map((p) => p.id).sort();
  const member = memberships.map((m) => m.id).sort();
  assert.deepEqual(member, paid, "a tier with a price but no benefits sells nothing");
});

test("the free tier has no membership attached to it", () => {
  const free = plans.filter((p) => p.monthlyPaise === null);
  assert.ok(free.length > 0, "there is still a pay-per-filing tier");
  for (const p of free) {
    assert.equal(membershipFor(p.id), undefined);
  }
});

test("a discount comes off the service fee and never makes it negative", () => {
  const { discountPaise, payablePaise } = savingOn(100000, "compliance");
  assert.equal(discountPaise, 10000);
  assert.equal(payablePaise, 90000);
  assert.equal(discountPaise + payablePaise, 100000);
});

test("a non-subscriber pays the listed fee", () => {
  const { discountPaise, payablePaise } = savingOn(100000, "per-filing");
  assert.equal(discountPaise, 0);
  assert.equal(payablePaise, 100000);
});

test("break-even ignores the included filings, so it is not flattered", () => {
  /* ₹1,999 a month at 10% off repays itself at ₹19,990 of one-off work. If the
     included GST return were counted the figure would be smaller and would
     depend on the customer needing that exact filing. */
  assert.equal(breakEvenMonthlyPaise("compliance"), 1999000);
  assert.equal(breakEvenMonthlyPaise("per-filing"), null);
});

test("a higher tier discounts at least as much as the one below it", () => {
  const tiers = paidPlans().map((p) => membershipFor(p.id)!);
  for (let i = 1; i < tiers.length; i++) {
    assert.ok(
      tiers[i].discountPercent >= tiers[i - 1].discountPercent,
      "paying more must not buy a smaller discount",
    );
  }
});

test("benefits survive cancellation until the paid period ends", () => {
  const base: Subscription = {
    planId: "compliance",
    period: "monthly",
    status: "active",
    currentPeriodEnd: "2026-10-01",
  };

  assert.equal(isEntitled(base), true);
  /* The point of the "cancelling" state: they have asked to leave and have
     already paid for this month, so the benefits are theirs until it ends. */
  assert.equal(isEntitled({ ...base, status: "cancelling" }), true);
  assert.equal(isEntitled({ ...base, status: "past_due" }), false);
  assert.equal(isEntitled({ ...base, status: "expired" }), false);
  assert.equal(isEntitled(null), false);
});

test("no membership benefit is denominated in rupees of wallet credit", () => {
  /* The rule from the header, enforced rather than trusted to a comment. A
     benefit measured in money would either expire — forfeiting something the
     customer paid for — or pile up unspendably on a closed-loop wallet. */
  for (const m of memberships) {
    for (const item of m.includedMonthly) {
      assert.ok(
        !/₹|rupee|paise|credit|cashback/i.test(item.label),
        `"${item.label}" reads like wallet money; included benefits must be work`,
      );
    }
    assert.ok(
      !Object.keys(m).some((k) => /paise|credit/i.test(k)),
      `membership ${m.id} has a money-denominated field`,
    );
  }
});
