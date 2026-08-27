import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkTopUpAmount,
  formatEntry,
  formatPaise,
  MAX_TOPUP_PAISE,
  MIN_TOPUP_PAISE,
  toPaise,
} from "./money.ts";

test("rupees convert to paise as integers", () => {
  assert.equal(toPaise(1), 100);
  assert.equal(toPaise(1499), 149900);
  // The classic float trap: 19.99 * 100 is 1998.9999... in binary.
  assert.equal(toPaise(19.99), 1999);
  assert.equal(Number.isInteger(toPaise(0.07)), true);
});

test("amounts format with Indian digit grouping", () => {
  assert.match(formatPaise(200000), /2,000/);
  assert.match(formatPaise(10000000), /1,00,000/);
});

test("whole rupees show no decimals, part rupees show two", () => {
  assert.equal(formatPaise(200000).includes("."), false);
  assert.match(formatPaise(149950), /\.50/);
});

test("a statement line is signed by direction", () => {
  assert.match(formatEntry("credit", 200000), /^\+/);
  assert.match(formatEntry("debit", 149900), /^−/);
});

test("a top-up below the minimum is refused", () => {
  const r = checkTopUpAmount(MIN_TOPUP_PAISE / 100 - 1);
  assert.equal(r.ok, false);
});

test("a top-up above the ceiling is refused", () => {
  const r = checkTopUpAmount(MAX_TOPUP_PAISE / 100 + 1);
  assert.equal(r.ok, false);
});

test("the minimum itself is accepted", () => {
  const r = checkTopUpAmount(MIN_TOPUP_PAISE / 100);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.paise, MIN_TOPUP_PAISE);
});

test("fractional, negative, NaN and junk amounts are refused", () => {
  for (const bad of [100.5, -500, NaN, Infinity, "abc", null, undefined, {}]) {
    assert.equal(checkTopUpAmount(bad as never).ok, false, `accepted ${String(bad)}`);
  }
});

test("a numeric string is accepted, since that is what a form field gives", () => {
  const r = checkTopUpAmount("2000" as never);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.paise, 200000);
});
