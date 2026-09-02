import { test } from "node:test";
import assert from "node:assert/strict";
import { INTAKES, getIntake } from "./intake.ts";
import { documents } from "./documents.ts";
import { services } from "./services.ts";

/**
 * The intake forms produce a quote, not a filing. That is what makes the
 * first test below a hard rule rather than a preference: asking for an
 * Aadhaar or PAN number on an unauthenticated public form would put LAWFIC in
 * possession of exactly the data the DPDP Act and UIDAI's guidance say not to
 * hold, in exchange for information that does not change the price.
 */

/** Things a request form must never ask for. */
const FORBIDDEN = [
  /aadhaar\s*(no|number|card)/i,
  /\bpan\s*(no|number|card)\b/i,
  /passport\s*(no|number)/i,
  /voter\s*id\s*(no|number)/i,
  /account\s*(no|number)/i,
  /\bifsc\b/i,
  /\botp\b/i,
  /password/i,
  /upload|attach|scan|photocopy/i,
];

test("no intake field asks for a statutory identifier or a document scan", () => {
  for (const intake of INTAKES) {
    for (const f of intake.fields) {
      const text = [f.label, f.placeholder ?? "", f.hint ?? "", f.name].join(" ");
      for (const pattern of FORBIDDEN) {
        assert.ok(
          !pattern.test(text),
          `${intake.slug}/${f.name} matches ${pattern} — "${text.trim()}"`,
        );
      }
    }
  }
});

test("every document can be requested with a form of its own", () => {
  const missing = documents.filter((d) => !getIntake(d.slug)).map((d) => d.slug);
  assert.deepEqual(missing, [], `documents with no intake form: ${missing.join(", ")}`);
});

test("forms stay short enough to finish", () => {
  for (const intake of INTAKES) {
    assert.ok(
      intake.fields.length <= 8,
      `${intake.slug} asks ${intake.fields.length} questions before a price exists`,
    );
    assert.ok(intake.fields.length >= 2, `${intake.slug} asks almost nothing`);
  }
});

test("every select offers choices, and every field is labelled", () => {
  for (const intake of INTAKES) {
    for (const f of intake.fields) {
      assert.ok(f.label.trim().length > 0, `${intake.slug}/${f.name} has no label`);
      if (f.type === "select") {
        assert.ok(
          f.options && f.options.length >= 2,
          `${intake.slug}/${f.name} is a select with nothing to select`,
        );
      }
    }
  }
});

test("field names are unique within a form", () => {
  for (const intake of INTAKES) {
    const names = intake.fields.map((f) => f.name);
    assert.equal(
      new Set(names).size,
      names.length,
      `${intake.slug} reuses a field name, so one answer would overwrite another`,
    );
  }
});

test("each form says what happens next", () => {
  for (const intake of INTAKES) {
    assert.ok(intake.intro.trim().length > 20, `${intake.slug} has no intro`);
  }
});

test("every live service resolves to its own intake form", () => {
  /* Walked from the real service list rather than a slug list written by
     hand — a hand-written list is what let /services/pan fall through to the
     generic textarea unnoticed, because the miss looks like a working form. */
  const missing = services.filter((s) => !getIntake(s.slug)).map((s) => s.slug);
  assert.deepEqual(missing, [], `services with no intake form: ${missing.join(", ")}`);
});
