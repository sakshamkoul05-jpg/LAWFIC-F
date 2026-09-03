import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DENOMINATIONS,
  breakdown,
  noteCount,
  animationPlan,
  describeBreakdown,
  MAX_ANIMATED_NOTES,
  devanagari,
} from "./denominations.ts";

/**
 * The breakdown decides what a customer sees land in the wallet, so it has to
 * agree with the amount exactly. A note animation that adds up to something
 * other than what was paid would be worse than no animation at all.
 */

test("a breakdown adds back up to the amount", () => {
  for (const rupees of [10, 60, 500, 2700, 4990, 12345, 99999]) {
    const runs = breakdown(rupees * 100);
    const sum = runs.reduce((t, r) => t + r.value * r.count, 0);
    // Anything under ₹10 cannot be a note, so that remainder is expected.
    assert.ok(
      rupees - sum >= 0 && rupees - sum < 10,
      `₹${rupees} broke into ₹${sum}, remainder ${rupees - sum}`,
    );
  }
});

test("it counts down from the largest note, as a cashier would", () => {
  assert.deepEqual(breakdown(270000), [
    { value: 500, count: 5 },
    { value: 200, count: 1 },
  ]);
  assert.deepEqual(breakdown(50000), [{ value: 500, count: 1 }]);
  assert.deepEqual(breakdown(19000), [
    { value: 100, count: 1 },
    { value: 50, count: 1 },
    { value: 20, count: 2 },
  ]);
});

test("nothing, and less than a note, produce nothing", () => {
  assert.deepEqual(breakdown(0), []);
  assert.deepEqual(breakdown(-5000), []);
  assert.deepEqual(breakdown(900), [], "₹9 cannot be shown as notes");
});

test("a large amount never animates more than a dozen notes", () => {
  const runs = breakdown(5000000); // ₹50,000 — a hundred ₹500 notes
  const plan = animationPlan(runs);
  assert.equal(plan.total, 100);
  assert.ok(
    plan.flying.length <= MAX_ANIMATED_NOTES,
    `${plan.flying.length} notes would fly one by one`,
  );
  assert.equal(plan.flying.length + plan.grouped, plan.total, "notes went missing");
});

test("a small amount animates every note it has", () => {
  const runs = breakdown(270000);
  const plan = animationPlan(runs);
  assert.equal(plan.total, 6);
  assert.equal(plan.flying.length, 6);
  assert.equal(plan.grouped, 0);
});

test("the biggest notes fly first", () => {
  const plan = animationPlan(breakdown(270000));
  assert.deepEqual(plan.flying, [500, 500, 500, 500, 500, 200]);
});

test("denominations are the ones actually in circulation, largest first", () => {
  assert.deepEqual(
    DENOMINATIONS.map((d) => d.value),
    [500, 200, 100, 50, 20, 10],
  );
});

test("a denomination carries nothing that would make it a facsimile", () => {
  /* The no-facsimile rule, held as an allowlist so a future edit cannot quietly
     add a portrait, an emblem or a serial to the note model. Colour, real size,
     ink and the bleed-line count are what a note is allowed to know about
     itself. See the header of denominations.ts for why the line sits here. */
  const ALLOWED = ["bleedLines", "heightMm", "ink", "paper", "paperEdge", "value", "widthMm"];
  for (const d of DENOMINATIONS) {
    assert.deepEqual(
      Object.keys(d).sort(),
      ALLOWED,
      `₹${d.value} has fields beyond colour, size and ink`,
    );
    for (const key of ["paper", "paperEdge", "ink"] as const) {
      assert.match(d[key], /^#[0-9A-Fa-f]{6}$/, `₹${d.value}.${key} is not a plain colour`);
    }
  }
});

test("notes are drawn at the sizes the RBI actually mills them", () => {
  /* Indian notes step in length by denomination and in height at ₹50. Drawing
     every note at one ratio was the loudest tell that the money was invented,
     so these are checked rather than left to drift. */
  const REAL: Record<number, [number, number]> = {
    500: [150, 66],
    200: [146, 66],
    100: [142, 66],
    50: [135, 66],
    20: [129, 63],
    10: [123, 63],
  };
  for (const d of DENOMINATIONS) {
    assert.deepEqual([d.widthMm, d.heightMm], REAL[d.value], `₹${d.value} is the wrong size`);
  }

  // Bigger denomination, bigger note — true of the whole series.
  const byValue = [...DENOMINATIONS].sort((a, b) => a.value - b.value);
  for (let i = 1; i < byValue.length; i++) {
    assert.ok(
      byValue[i].widthMm > byValue[i - 1].widthMm,
      `₹${byValue[i].value} is not longer than ₹${byValue[i - 1].value}`,
    );
  }
});

test("denominations render their numerals in Devanagari", () => {
  assert.equal(devanagari(500), "५००");
  assert.equal(devanagari(200), "२००");
  assert.equal(devanagari(10), "१०");
});

test("the summary reads the way a person would say it", () => {
  assert.equal(describeBreakdown(breakdown(270000)), "5 × ₹500 · 1 × ₹200");
  assert.equal(noteCount(breakdown(270000)), 6);
});
