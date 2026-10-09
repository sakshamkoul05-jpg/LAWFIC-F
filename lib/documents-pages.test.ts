import assert from "node:assert/strict";
import { test } from "node:test";
import { daysFromT, tFromDays, tierFor, MAX_DAYS } from "./birth-registration.ts";
import { STREAMS, docsFor, nextSessionYear, plan, needByDate } from "./admission.ts";

test("birth tiers switch exactly at the statutory lines", () => {
  assert.equal(tierFor(21).id, "on-time");
  assert.equal(tierFor(22).id, "late");
  assert.equal(tierFor(30).id, "late");
  assert.equal(tierFor(31).id, "permission");
  assert.equal(tierFor(365).id, "permission");
  assert.equal(tierFor(366).id, "order");
  assert.equal(tierFor(731).id, "order-long");
});

test("dial scale round-trips and is monotonic", () => {
  let prev = -1;
  for (let i = 0; i <= 1000; i++) {
    const d = daysFromT(i / 1000);
    assert.ok(d >= prev, `not monotonic at ${i}`);
    prev = d;
  }
  for (const d of [0, 5, 21, 30, 100, 365, 730, 2000, MAX_DAYS]) {
    assert.ok(Math.abs(daysFromT(tFromDays(d)) - d) <= 1, `round-trip ${d}`);
  }
  // a keyboard step (0.002) must move the day at the start of the dial
  assert.notEqual(daysFromT(tFromDays(12) + 0.01), 12);
});

test("admission: need-by dates and next session", () => {
  const eng = STREAMS.find((s) => s.id === "engineering")!;
  const law = STREAMS.find((s) => s.id === "law")!;
  assert.equal(needByDate(eng, 2027).toISOString().slice(0, 10), "2027-06-01");
  assert.equal(needByDate(law, 2027).toISOString().slice(0, 10), "2026-12-15");
  const oct9 = new Date(Date.UTC(2026, 9, 9));
  assert.equal(nextSessionYear(eng, oct9), 2027);
  assert.equal(nextSessionYear(law, oct9), 2027); // Dec 2026 is still ahead
  assert.equal(nextSessionYear(law, new Date(Date.UTC(2026, 11, 20))), 2028);
});

test("admission: EWS for central counselling never starts before 1 April", () => {
  const eng = STREAMS.find((s) => s.id === "engineering")!;
  const docs = docsFor("ews", { stateQuota: false, gapYear: false, scholarship: false, dobMismatch: false });
  const { items, needBy } = plan(eng, 2027, docs);
  const ews = items[0];
  assert.ok(ews.startBy >= new Date(Date.UTC(2027, 3, 1)));
  assert.ok(ews.startBy < needBy);
  // MBA has no April rule, so the plain lead time applies
  const mba = STREAMS.find((s) => s.id === "management")!;
  assert.equal(plan(mba, 2027, docs).items[0].opensOn, undefined);
});

test("admission: general category with nothing ticked needs nothing extra", () => {
  assert.equal(docsFor("general", { stateQuota: false, gapYear: false, scholarship: false, dobMismatch: false }).length, 0);
  assert.equal(docsFor("scst", { stateQuota: true, gapYear: true, scholarship: true, dobMismatch: true }).length, 5);
});
