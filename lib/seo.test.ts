import { test } from "node:test";
import assert from "node:assert/strict";
import {
  META_DESCRIPTION_LIMIT,
  SITE_DESCRIPTION,
  SITE_TITLE,
  absolute,
  breadcrumbJsonLd,
  metaDescription,
  organizationJsonLd,
} from "./seo.ts";
import { services } from "./services.ts";
import { company } from "./company.ts";

/**
 * What is actually worth asserting about SEO.
 *
 * Almost none of it is testable — whether a page ranks is not a property of
 * this codebase. What IS testable is the handful of things that are silently
 * wrong rather than visibly broken: a description cut mid-word, a URL that is
 * relative where it has to be absolute, a structured-data record that states
 * something about the company which is not known to be true.
 *
 * Every one of those renders a perfectly normal-looking page. Nothing about
 * opening the site reveals them, which is exactly why they belong here.
 */

/* ------------------------------------------------------ descriptions -- */

test("a description that fits is returned whole, with the added sentence", () => {
  const out = metaDescription("Short lead.", "And a short follow-up. Then more text after it.");
  assert.equal(out, "Short lead. And a short follow-up.");
});

test("a follow-up sentence that would overflow is dropped, not truncated", () => {
  const lead = "A GSTIN in your name, and someone who understands what it means.";
  const long = "x".repeat(300) + ".";
  /* The whole point: the answer is the lead unchanged. No ellipsis, no cut
     word — the sentence simply does not appear. */
  assert.equal(metaDescription(lead, long), lead);
});

test("no summary at all is fine", () => {
  assert.equal(metaDescription("  Just the lead.  "), "Just the lead.");
});

test("a summary with no sentence-ending punctuation is dropped rather than joined", () => {
  assert.equal(metaDescription("Lead.", "an unterminated fragment"), "Lead.");
});

test("every service page description survives a results page uncut", () => {
  for (const s of services) {
    const d = metaDescription(s.tagline, s.summary);
    assert.ok(
      d.length <= META_DESCRIPTION_LIMIT,
      `${s.slug}: ${d.length} chars, over the ${META_DESCRIPTION_LIMIT} limit`,
    );
    /* A description ending in an ellipsis means something upstream truncated
       it, which is the failure this helper exists to prevent. */
    assert.ok(!d.endsWith("…"), `${s.slug} ends in an ellipsis`);
    assert.ok(d.length > 20, `${s.slug} has a description too short to be useful`);
  }
});

test("the site description is long enough to use the space and short enough to be read", () => {
  /* Deliberately loose. It is one sentence of marketing copy, and the only
     real failure modes are "empty" and "an essay". */
  assert.ok(SITE_DESCRIPTION.length > 80);
  assert.ok(SITE_DESCRIPTION.length < 200);
  assert.ok(SITE_TITLE.length < 70, "the title is cut off in a search result");
});

/* --------------------------------------------------------------- urls -- */

test("absolute() builds a full URL from a path, with or without the slash", () => {
  assert.equal(absolute("/sitemap.xml"), absolute("sitemap.xml"));
  assert.ok(absolute("/about").endsWith("/about"));
  assert.ok(/^https?:\/\//.test(absolute("/about")));
});

test("breadcrumb items are absolute — a relative one is silently ignored by crawlers", () => {
  const node = breadcrumbJsonLd([
    { name: "LAWFIC", path: "/" },
    { name: "Services", path: "/services" },
  ]) as { itemListElement: { position: number; item: string }[] };

  assert.equal(node.itemListElement.length, 2);
  assert.deepEqual(
    node.itemListElement.map((i) => i.position),
    [1, 2],
    "positions must start at 1 and be consecutive",
  );
  for (const item of node.itemListElement) {
    assert.ok(/^https?:\/\//.test(item.item), `${item.item} is not absolute`);
  }
});

/* ------------------------------------------------------- the company -- */

test("the organization record claims nothing lib/company.ts does not know", () => {
  const org = organizationJsonLd() as Record<string, unknown>;

  /* This is the test that matters most in the file. The record is published
     under a real company's name and Google may surface it verbatim, so a
     placeholder address or an invented phone number here is a false statement
     about a business — not a cosmetic bug. The rule from lib/company.ts holds:
     a fact that is null is absent, never filled in. */
  if (!company.legalName) assert.ok(!("legalName" in org));
  if (!company.registeredAddress) assert.ok(!("address" in org));
  if (!company.foundedYear) assert.ok(!("foundingDate" in org));
  if (!company.supportEmail && !company.supportPhone) {
    assert.ok(!("contactPoint" in org));
  }
  /* An empty sameAs is worse than no sameAs: it asserts the company has no
     profiles anywhere, rather than staying silent. */
  assert.ok(!("sameAs" in org) || (org.sameAs as unknown[]).length > 0);
});

test("the logo is an absolute URL, which is the whole point of publishing it", () => {
  const org = organizationJsonLd() as { logo: { url: string; width: number } };
  assert.ok(/^https?:\/\/.+\.png$/.test(org.logo.url), org.logo.url);
  /* Google requires at least 112px; this is the size the file is generated at
     by the script in the README. If one changes, so must the other. */
  assert.ok(org.logo.width >= 112);
});
