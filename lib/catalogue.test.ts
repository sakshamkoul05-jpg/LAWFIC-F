/**
 * The catalogue is what the navigation is built from, so its invariants are
 * worth asserting rather than eyeballing — especially the one that matters:
 * a `live` entry with no page behind it puts a 404 in the menu.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { allServices, catalogueIntegrity, categories, searchServices, totalServices } from "./catalogue.ts";
import { services } from "./services.ts";

test("every live entry has a real page, and every page is in the catalogue", () => {
  const problems = catalogueIntegrity(services.map((s) => s.slug));
  assert.deepEqual(problems, []);
});

test("the catalogue is big enough to need a mega-menu", () => {
  assert.ok(totalServices >= 25, `only ${totalServices} services`);
  assert.ok(categories.length >= 5);
});

test("no category is empty and no slug is duplicated", () => {
  const seen = new Set<string>();
  for (const c of categories) {
    assert.ok(c.services.length > 0, `${c.name} is empty`);
    for (const s of c.services) {
      assert.equal(seen.has(s.slug), false, `duplicate slug ${s.slug}`);
      seen.add(s.slug);
    }
  }
  assert.equal(seen.size, totalServices);
});

test("an exact name beats a partial match", () => {
  const [first] = searchServices("GST Registration");
  assert.equal(first.slug, "gst");
});

test("a live service outranks a soon one at the same relevance", () => {
  const results = searchServices("gst");
  assert.equal(results[0].slug, "gst");
  assert.equal(results[0].status, "live");
});

test("aliases find services whose name does not contain the query", () => {
  assert.equal(searchServices("food licence")[0].slug, "fssai");
  assert.equal(searchServices("udyog aadhaar")[0].slug, "msme-udyam");
  assert.equal(searchServices("pvt ltd")[0].slug, "private-limited");
});

test("on a tie the shorter, more general name wins", () => {
  assert.equal(searchServices("trademark")[0].slug, "trademark");
});

test("an empty query returns nothing rather than everything", () => {
  assert.deepEqual(searchServices(""), []);
  assert.deepEqual(searchServices("   "), []);
});

test("a query matching nothing returns nothing", () => {
  assert.deepEqual(searchServices("zzzznotathing"), []);
});

test("every entry has a blurb short enough for a menu row", () => {
  for (const s of allServices) {
    assert.ok(s.blurb.length <= 56, `"${s.name}" blurb is ${s.blurb.length} chars`);
    assert.ok(s.name.length > 0 && s.slug.length > 0);
  }
});
