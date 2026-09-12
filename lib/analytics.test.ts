import { test } from "node:test";
import assert from "node:assert/strict";
import {
  istDay,
  istMonth,
  revenueByDay,
  revenueByMonth,
  spendByCustomer,
  totals,
  type LedgerRow,
} from "./analytics.ts";

/**
 * The tests that matter here are the timezone ones.
 *
 * A revenue chart that is wrong by a day looks completely plausible — the bars
 * are the right heights, just attached to the wrong dates — so nothing about
 * looking at it reveals the bug. It has to be asserted.
 */

const debit = (created_at: string, amount_paise = 10000, user_id = "u1"): LedgerRow => ({
  user_id,
  direction: "debit",
  amount_paise,
  created_at,
});

test("a payment at 1am IST belongs to that IST day, not the UTC one before it", () => {
  /* 2026-09-13T01:00 IST is 2026-09-12T19:30Z. Bucketing on the UTC date would
     file it under the 12th — which is the bug this whole file exists to avoid,
     and it would silently move five and a half hours of every day's takings
     onto the day before. */
  assert.equal(istDay("2026-09-12T19:30:00Z"), "2026-09-13");
  assert.equal(istMonth("2026-09-12T19:30:00Z"), "2026-09");
});

test("the month rolls over on IST midnight too", () => {
  /* 2026-10-01T00:30 IST is 2026-09-30T19:00Z. September's total must not
     absorb October's first sale. */
  assert.equal(istDay("2026-09-30T19:00:00Z"), "2026-10-01");
  assert.equal(istMonth("2026-09-30T19:00:00Z"), "2026-10");
});

test("an instant just before IST midnight stays on the earlier day", () => {
  /* 2026-09-12T23:59 IST is 2026-09-12T18:29Z — the boundary from the other
     side, so the test cannot pass by shifting everything one way. */
  assert.equal(istDay("2026-09-12T18:29:00Z"), "2026-09-12");
});

test("days with no sales are still in the series", () => {
  const now = new Date("2026-09-13T12:00:00Z");
  const rows = [debit("2026-09-13T06:00:00Z"), debit("2026-09-10T06:00:00Z")];
  const series = revenueByDay(rows, 7, now);

  assert.equal(series.length, 7, "seven days asked for, seven bars back");
  /* The gaps are the point. Without them the chart shows two bars side by side
     and reads as two consecutive days of trade. */
  const empty = series.filter((b) => b.paise === 0);
  assert.equal(empty.length, 5);
});

test("the day series runs oldest to newest and ends today", () => {
  const now = new Date("2026-09-13T12:00:00Z");
  const series = revenueByDay([], 5, now);
  assert.equal(series[0].key, "2026-09-09");
  assert.equal(series[4].key, "2026-09-13");
  for (let i = 1; i < series.length; i++) {
    assert.ok(series[i].key > series[i - 1].key, "a chart read left to right runs forwards");
  }
});

test("credits are not revenue", () => {
  const now = new Date("2026-09-13T12:00:00Z");
  const rows: LedgerRow[] = [
    { user_id: "u1", direction: "credit", amount_paise: 1000000, created_at: "2026-09-13T06:00:00Z" },
    debit("2026-09-13T07:00:00Z", 50000),
  ];

  const series = revenueByDay(rows, 3, now);
  const today = series[series.length - 1];
  /* A ₹10,000 top-up is money owed back, not money earned. Counting it would
     report ten thousand rupees of income on a day that sold five hundred. */
  assert.equal(today.paise, 50000);
  assert.equal(today.count, 1);
  assert.equal(totals(rows, now).allTime, 50000);
});

test("rows older than the window are dropped, not folded into the first bar", () => {
  const now = new Date("2026-09-13T12:00:00Z");
  const rows = [debit("2026-01-01T06:00:00Z", 999999), debit("2026-09-13T06:00:00Z", 100)];
  const series = revenueByDay(rows, 7, now);
  const sum = series.reduce((n, b) => n + b.paise, 0);
  assert.equal(sum, 100, "an out-of-range row must not land anywhere");
});

test("the month series spans a year boundary correctly", () => {
  const now = new Date("2026-02-15T12:00:00Z");
  const series = revenueByMonth([], 4, now);
  assert.deepEqual(
    series.map((b) => b.key),
    ["2025-11", "2025-12", "2026-01", "2026-02"],
  );
});

test("customers rank by what they spent, not what they hold", () => {
  const rows = [
    debit("2026-09-01T06:00:00Z", 50000, "small"),
    debit("2026-09-02T06:00:00Z", 300000, "big"),
    debit("2026-09-03T06:00:00Z", 100000, "big"),
    { user_id: "hoarder", direction: "credit" as const, amount_paise: 9999999, created_at: "2026-09-04T06:00:00Z" },
  ];

  const top = spendByCustomer(rows);
  assert.equal(top[0].userId, "big");
  assert.equal(top[0].paise, 400000);
  assert.equal(top[0].orders, 2);
  assert.equal(top[1].userId, "small");
  /* Someone sitting on a large balance they have never spent is a liability,
     not a top customer, and must not appear on this list at all. */
  assert.equal(top.find((c) => c.userId === "hoarder"), undefined);
});

test("the most recent purchase date is tracked per customer", () => {
  const rows = [
    debit("2026-09-01T06:00:00Z", 100, "u1"),
    debit("2026-09-09T06:00:00Z", 100, "u1"),
    debit("2026-09-05T06:00:00Z", 100, "u1"),
  ];
  assert.equal(spendByCustomer(rows)[0].lastAt, "2026-09-09T06:00:00Z");
});

test("an empty ledger produces zeroes, never NaN", () => {
  const t = totals([], new Date("2026-09-13T12:00:00Z"));
  assert.equal(t.allTime, 0);
  assert.equal(t.orders, 0);
  assert.equal(t.payingCustomers, 0);
  /* The division guard. A dashboard printing "₹NaN" on its first day is one
     nobody trusts on its second. */
  assert.equal(t.averageOrder, 0);
  assert.ok(Number.isFinite(t.averageOrder));
});

test("today and this month are counted on IST boundaries", () => {
  /* now = 2026-09-13T02:00 IST (2026-09-12T20:30Z). The sale below is
     2026-09-13T00:30 IST — later than "now" in UTC DATE terms but the same IST
     day, which is the case a UTC bucket gets wrong. */
  const now = new Date("2026-09-12T20:30:00Z");
  const rows = [debit("2026-09-12T19:00:00Z", 70000)];
  const t = totals(rows, now);
  assert.equal(t.today, 70000);
  assert.equal(t.month, 70000);
});
