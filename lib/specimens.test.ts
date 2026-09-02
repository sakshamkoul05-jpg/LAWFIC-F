import { test } from "node:test";
import assert from "node:assert/strict";
import { SPECIMENS, getSpecimen, specimenNumber } from "./specimens.ts";
import { documents } from "./documents.ts";

/**
 * These specimens depict Indian statutory documents, so the rules below are
 * legal guardrails rather than style preferences. Checking them here means a
 * future addition cannot quietly break one: the failure shows up as a red
 * test rather than as a convincing fake government document on a live site.
 */

/** Drawn by hand instead of generated — see components/motion/ServiceVisual. */
const BESPOKE = new Set(["pan-application", "pan-correction", "aadhaar", "gst", "udyam-msme"]);

test("every document is illustrated, either by hand or by a specimen", () => {
  const missing = documents
    .filter((d) => !BESPOKE.has(d.slug) && !getSpecimen(d.slug))
    .map((d) => d.slug);
  assert.deepEqual(missing, [], `documents with no illustration: ${missing.join(", ")}`);
});

test("no specimen carries anything shaped like a live Aadhaar number", () => {
  for (const s of SPECIMENS) {
    const digits = (s.segments ?? []).map((seg) => seg.chars).join("").replace(/\D/g, "");
    assert.ok(
      digits.length !== 12,
      `${s.slug} has a 12-digit run, which reads as an Aadhaar number`,
    );
  }
});

test("anything marked sensitive is masked, never shown in full", () => {
  for (const s of SPECIMENS.filter((x) => x.sensitive)) {
    const full = (s.segments ?? []).map((seg) => seg.chars).join("");
    const shown = specimenNumber(s);
    assert.notEqual(shown, full, `${s.slug} renders its identifier unmasked`);
    assert.ok(shown.startsWith("X"), `${s.slug} does not mask its leading characters`);
    assert.equal(shown.length, full.length, `${s.slug} changed length when masked`);
  }
});

test("every specimen teaches something, because that is the point", () => {
  for (const s of SPECIMENS) {
    assert.ok(
      s.teaches && s.teaches.trim().length > 40,
      `${s.slug} has no meaningful explanation`,
    );
  }
});

test("coded specimens explain every segment they show", () => {
  for (const s of SPECIMENS.filter((x) => x.form === "coded")) {
    assert.ok(s.segments && s.segments.length > 1, `${s.slug} has nothing to decode`);
    for (const seg of s.segments!) {
      assert.ok(seg.chars.length > 0, `${s.slug} has an empty segment`);
      assert.ok(seg.label.trim().length > 0, `${s.slug} has an unlabelled segment`);
      assert.ok(seg.meaning.trim().length > 10, `${s.slug}/${seg.label} explains nothing`);
    }
  }
});

test("certificates and agreements show fields", () => {
  for (const s of SPECIMENS.filter((x) => x.form !== "coded")) {
    assert.ok(s.fields && s.fields.length >= 2, `${s.slug} has too little on its face`);
  }
});

test("specimen slugs are unique", () => {
  const slugs = SPECIMENS.map((s) => s.slug);
  assert.equal(new Set(slugs).size, slugs.length, "two specimens share a slug");
});

test("aliases resolve to a specimen that exists", () => {
  assert.ok(getSpecimen("passport-reissue"), "passport-reissue should reuse the passport specimen");
  assert.equal(getSpecimen("passport-reissue")?.slug, "passport-application");
});
