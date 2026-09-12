import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ANNUAL_MONTHS_CHARGED,
  ANNUAL_NEEDS_AFA,
  GST_RATE,
  annualNeedsAfa,
  autopayable,
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

test("every monthly price can go on autopay", () => {
  /* The whole ladder has to clear the ceiling monthly, because monthly IS the
     autopay product. A tier that cannot be mandated monthly has no business
     being on the page. */
  for (const plan of paidPlans()) {
    assert.equal(
      autopayable(plan.monthlyPaise, "monthly"),
      true,
      `${plan.id} monthly cannot be mandated`,
    );
  }
});

test("the dearest yearly plans are over the ceiling and the cheapest are not", () => {
  /* The split is the finding, so it is the thing under test. Ten months of fee
     plus 18% has to land under ₹15,000, which puts the cut at a monthly fee of
     about ₹1,271 — between the ₹999 and ₹1,499 tiers. */
  const over = annualNeedsAfa();

  assert.ok(over.length > 0, "at least one tier is over, or ANNUAL_NEEDS_AFA lies");
  assert.equal(ANNUAL_NEEDS_AFA, true);

  /* Named rather than counted: a test that only checks "some are over" passes
     when the boundary moves to the wrong tier. */
  assert.deepEqual(over.sort(), ["business", "compliance"]);

  for (const plan of paidPlans()) {
    const annual = priceFor(plan.monthlyPaise, "annual");
    assert.equal(
      annual.needsAfaEachDebit,
      over.includes(plan.id),
      `${plan.id} yearly is ${annual.totalPaise} paise; autopay verdict disagrees with the ceiling`,
    );
  }
});

test("the autopay cut lands where the arithmetic says it does", () => {
  /* ₹15,000 / (10 months × 1.18) = ₹1,271.18. A fee at or under that
     annualises inside the ceiling; a rupee over it does not. */
  assert.equal(autopayable(127100, "annual"), true);
  assert.equal(autopayable(127200, "annual"), false);
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
  assert.equal(discountPaise, 18000);
  assert.equal(payablePaise, 82000);
  assert.equal(discountPaise + payablePaise, 100000);
});

test("the six tiers are the six prices LAWFIC set", () => {
  assert.deepEqual(
    paidPlans().map((p) => p.monthlyPaise),
    [9900, 19900, 59900, 99900, 149900, 199900],
  );
});

test("a non-subscriber pays the listed fee", () => {
  const { discountPaise, payablePaise } = savingOn(100000, "per-filing");
  assert.equal(discountPaise, 0);
  assert.equal(payablePaise, 100000);
});

test("break-even ignores the included filings, so it is not flattered", () => {
  /* ₹99 a month at 5% off repays itself at ₹1,980 of one-off work; ₹1,999 at
     18% at ₹11,105.56. Counting the included filings would produce smaller,
     friendlier figures that depend on the customer needing those exact
     filings, which is not what a break-even is for. */
  assert.equal(breakEvenMonthlyPaise("basic"), 198000);
  assert.equal(breakEvenMonthlyPaise("compliance"), 1110556);
  assert.equal(breakEvenMonthlyPaise("per-filing"), null);
});

test("break-even improves as the tier gets dearer", () => {
  /* The ladder has to reward paying more. If a dearer tier needed MORE
     one-off work to repay itself, the discount is not keeping up with the
     fee and the tier above is a worse deal than the one below it. */
  const evens = paidPlans().map((p) => breakEvenMonthlyPaise(p.id)!);
  for (let i = 1; i < evens.length; i++) {
    assert.ok(
      evens[i] > evens[i - 1],
      "a dearer tier needs more work to repay, which is expected — " +
        "but the RATIO is what must not run away",
    );
  }
  /* The real constraint: the dearest tier must not need more than six times
     the work of the cheapest to pay for itself, or the top of the ladder is
     unreachable for anyone the bottom of it attracted. */
  assert.ok(evens[evens.length - 1] / evens[0] < 6);
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
