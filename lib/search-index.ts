import { categories } from "./catalogue";
import { documents } from "./documents";
import { classicTabs } from "./nav-tabs";

/**
 * What the header search can find, and how it ranks it.
 *
 * Built from the data that already exists rather than a hand-written list, so a
 * service added to the catalogue is searchable the same day instead of the day
 * someone remembers to update a second copy of it. That is the whole reason
 * this is derived: a search index maintained by hand goes stale silently, and a
 * search that cannot find a service the site sells is worse than no search.
 *
 * Aliases matter more than they look. People do not search for "MSME Udyam
 * Registration" — they type "udyog aadhaar", "tds", "pvt ltd", "49a". Those
 * live in the catalogue already and are matched but never displayed, so the
 * result still shows the name the site uses.
 */

export type SearchHit = {
  id: string;
  label: string;
  href: string;
  kind: "Service" | "Document" | "Section";
  blurb?: string;
  /** Not shown; matched against. */
  terms: string[];
  live: boolean;
};

function build(): SearchHit[] {
  const out: SearchHit[] = [];

  for (const cat of categories) {
    for (const s of cat.services) {
      out.push({
        id: `svc-${s.slug}`,
        label: s.name,
        href: `/services/${s.slug}`,
        kind: "Service",
        blurb: s.blurb,
        terms: [s.name, s.blurb, cat.name, ...(s.aliases ?? [])].map((t) => t.toLowerCase()),
        live: s.status === "live",
      });
    }
  }

  for (const d of documents) {
    out.push({
      id: `doc-${d.slug}`,
      label: d.label,
      href: d.href,
      kind: "Document",
      blurb: d.blurb,
      terms: [d.label, d.blurb ?? "", d.group].map((t) => t.toLowerCase()),
      live: d.live,
    });
  }

  for (const t of classicTabs) {
    out.push({
      id: `sec-${t.id}`,
      label: t.label,
      href: t.href,
      kind: "Section",
      blurb: t.tagline,
      terms: [t.label, t.tagline ?? ""].map((x) => x.toLowerCase()),
      live: t.live,
    });
  }

  return out;
}

export const searchIndex: SearchHit[] = build();

/**
 * Rank matches so the useful ones come first.
 *
 * A name that STARTS with what was typed beats one that merely contains it,
 * which is the difference between typing "pan" and getting "PAN Services" or
 * getting "Company Secretary Compliance" because the word appears in its blurb.
 * Live services outrank ones that are not open yet, because a result you can
 * actually buy is worth more than one you cannot.
 */
export function searchSuggest(raw: string, limit = 8): SearchHit[] {
  const q = raw.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored: { hit: SearchHit; score: number }[] = [];

  for (const hit of searchIndex) {
    let best = 0;
    for (const term of hit.terms) {
      if (!term) continue;
      if (term.startsWith(q)) best = Math.max(best, 100);
      else if (term.includes(` ${q}`)) best = Math.max(best, 70);
      else if (term.includes(q)) best = Math.max(best, 40);
    }
    if (best === 0) continue;
    if (hit.live) best += 12;
    if (hit.kind === "Service") best += 6;
    scored.push({ hit, score: best });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.hit.label.length - b.hit.label.length)
    .slice(0, limit)
    .map((s) => s.hit);
}
