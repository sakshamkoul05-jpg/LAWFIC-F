import { test } from "node:test";
import assert from "node:assert/strict";
import { signatureFor, spendByCategory, ENTITIES, FINISHES } from "./wallet-card.ts";

/**
 * The card signature makes three promises, and all three are worth holding to:
 * it is the same on every device, it differs between customers, and it is
 * drawn from real filings rather than decoration.
 */

test("the same account and history always draw the same card", () => {
  const spend = { tax: 149900, identity: 10700 };
  const a = signatureFor("user-abc", spend);
  const b = signatureFor("user-abc", spend);
  assert.deepEqual(a, b, "a card must not change between renders or devices");
});

test("two accounts with identical filings still draw different cards", () => {
  const spend = { tax: 149900, identity: 10700 };
  const a = signatureFor("user-abc", spend);
  const b = signatureFor("user-xyz", spend);

  assert.notEqual(a.seedAngle, b.seedAngle);
  // Placement is what carries the difference; the ink is the category's.
  const samePlacement = a.blots.every(
    (blot, i) => blot.x === b.blots[i].x && blot.y === b.blots[i].y,
  );
  assert.equal(samePlacement, false, "placement must be seeded by the account");
});

test("a new account's card is blank", () => {
  const sig = signatureFor("user-new", {});
  assert.equal(sig.blank, true);
  assert.equal(sig.blots.length, 0);
});

test("one blot per category actually filed in", () => {
  const sig = signatureFor("user-abc", { tax: 100, identity: 200, ip: 50 });
  assert.equal(sig.blots.length, 3);
  assert.deepEqual(
    sig.blots.map((b) => b.category).sort(),
    ["identity", "ip", "tax"],
  );
});

test("a bigger share of spend draws a bigger blot", () => {
  const sig = signatureFor("user-abc", { tax: 900000, identity: 1000 });
  const tax = sig.blots.find((b) => b.category === "tax")!;
  const identity = sig.blots.find((b) => b.category === "identity")!;
  assert.ok(tax.r > identity.r, "the dominant category must read as dominant");
});

test("no blot grows large enough to swallow the card", () => {
  const sig = signatureFor("user-abc", { tax: 100000000 });
  assert.ok(sig.blots[0].r <= 0.45, `single-category radius was ${sig.blots[0].r}`);
});

test("blots stay inside the face so nothing clips at the corners", () => {
  for (const seed of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
    const sig = signatureFor(seed, { tax: 1, identity: 1, ip: 1, legal: 1 });
    for (const b of sig.blots) {
      assert.ok(b.x > 0.1 && b.x < 0.9, `x out of bounds: ${b.x}`);
      assert.ok(b.y > 0.1 && b.y < 0.9, `y out of bounds: ${b.y}`);
    }
  }
});

test("only debits count, and only those tied to a service", () => {
  const spend = spendByCategory([
    { direction: "debit", amount_paise: 1000, category: "tax" },
    { direction: "debit", amount_paise: 500, category: "tax" },
    // A top-up is not a filing.
    { direction: "credit", amount_paise: 999999, category: "tax" },
    // An adjustment with no order behind it contributes nothing.
    { direction: "debit", amount_paise: 700, category: null },
  ]);
  assert.deepEqual(spend, { tax: 1500 });
});

test("every entity carries its own statutory identifier", () => {
  const labels = ENTITIES.map((e) => e.idLabel);
  assert.equal(new Set(labels).size, labels.length, "identifiers must not repeat");
  assert.deepEqual(labels, ["PAN", "UDYAM", "LLPIN", "CIN", "REG. NO."]);
});

test("finishes differ by more than a name", () => {
  const sheens = new Set(FINISHES.map((f) => f.sheen));
  assert.equal(sheens.size, FINISHES.length, "each finish must reflect differently");
});
