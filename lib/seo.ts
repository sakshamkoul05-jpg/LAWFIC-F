import type { Metadata } from "next";
/* The .ts extension is here so `node --test` can resolve this file: lib/seo.ts
   is imported by lib/seo.test.ts, and Node's ESM resolver does not guess
   extensions. The rest of lib/ omits it because nothing else in lib/ is
   reached from a test through another lib module. */
import { company, reviewProfiles } from "./company.ts";

/**
 * Everything a search engine is told about this site, in one place.
 *
 * WHY ONE FILE
 *
 * The same handful of facts — the site's address, its name, its one-line
 * description, where the logo lives — are needed by the page metadata, the
 * sitemap, robots.txt, the web manifest and the structured data. Five copies
 * of a URL is four chances for one of them to be wrong, and a wrong one in
 * structured data is the kind of mistake that shows up as a Search Console
 * error months later rather than as a broken page anybody would notice.
 *
 * NOTHING HERE IS INVENTED
 *
 * The structured data below is a set of machine-readable CLAIMS about a real
 * company, published under its own name. So it is built from `lib/company.ts`
 * with the same rule that file already holds itself to: a fact that is `null`
 * is omitted, never filled with something plausible. An Organization record
 * carrying a made-up address or phone number is a false statement about a
 * business, and it is one Google may well surface verbatim next to its name.
 */

export const SITE_NAME = "LAWFIC";

/**
 * The site's own address, and the one thing here that MUST be right.
 *
 * Every absolute URL in the metadata, the sitemap, robots.txt and the
 * structured data is built from this. Get it wrong and canonical tags point a
 * search engine at someone else's domain, which is the one SEO mistake that
 * can remove a site from an index rather than merely fail to help it.
 *
 * The order is deliberate:
 *
 *   1. NEXT_PUBLIC_SITE_URL — set this in production. It is the only source
 *      that is correct on every request regardless of which host served it,
 *      and it is already the variable the sign-in emails use.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — the production domain of the project,
 *      not the per-deployment URL. So a preview build still emits canonicals
 *      pointing at the real site instead of at a preview host that expires and
 *      would, if indexed, compete with it.
 *   3. localhost, for development.
 *
 * Note what is NOT in the list: `VERCEL_URL`. That is the unique URL of one
 * deployment. Using it would mail every preview into the index under its own
 * throwaway hostname.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

/** True once the site knows its own public address. Preview and local builds
    are deliberately kept out of search indexes; see `app/robots.ts`. */
export const IS_PUBLIC_SITE = !SITE_URL.includes("localhost");

/**
 * The sentence that appears under the title in a search result.
 *
 * Written for the person reading the results page, not for a crawler. It says
 * what LAWFIC does, names the filings someone would actually be searching for,
 * and states the one thing that distinguishes it — fees in the open. Google
 * shows roughly 155 characters on desktop and less on a phone, so the load is
 * carried by the first half and nothing important waits until the end.
 *
 * Meta descriptions are not a ranking signal. They are the advert, and what
 * they change is whether somebody clicks.
 */
export const SITE_DESCRIPTION =
  "Indian business registrations and licences handled end to end — Udyam, GST, PAN and FSSAI. Government fees shown separately from ours, and a prepaid wallet for every filing.";

/** The default title. Short enough to survive Google's truncation, and it
    leads with the brand because most early traffic to a new site is people who
    already know the name. */
export const SITE_TITLE = "LAWFIC — Business registrations and licences in India";

/* The logo, as the square badge on a plain ground. Not the source PNG: that
   one is 525×475 with a transparent background, and a logo shown on whatever
   colour the surface happens to be is a logo that will eventually be shown
   gold-on-gold. */
export const LOGO_PATH = "/lawfic-logo-square.png";
export const LOGO_SIZE = 600;

/** An absolute URL for a path on this site. Structured data and Open Graph
    both require absolute URLs — a relative one is silently ignored. */
export function absolute(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Google shows roughly this many characters of a description on a desktop
 * results page, and fewer on a phone. It is a pixel width really, not a
 * character count, so treat it as the point past which text starts being cut
 * rather than as a hard rule.
 */
export const META_DESCRIPTION_LIMIT = 155;

/**
 * A description that is never truncated mid-word.
 *
 * The problem this solves: the service records carry a one-line `tagline`
 * (around 75 characters) and a `summary` that is a full paragraph (200-300).
 * The summary is the better text and it is far too long — pasted in whole it
 * reaches a results page cut at "...need to claim input cred". The tagline
 * fits perfectly but leaves half the available width unused.
 *
 * So: lead with the line that always fits, and add the next sentence ONLY if
 * the pair still fits whole. Some pages therefore get a two-sentence
 * description and some get one, and not one of them gets an ellipsis.
 *
 * Worth noting the tagline works here for the same reason it works on the
 * page: in a search result the title sits directly above it, naming the
 * service, exactly as the heading does.
 */
export function metaDescription(lead: string, more?: string): string {
  const head = lead.trim();
  if (!more) return head;

  const sentence = more.trim().match(/^[^.?!]+[.?!]/)?.[0]?.trim();
  if (!sentence) return head;

  const both = `${head} ${sentence}`;
  return both.length <= META_DESCRIPTION_LIMIT ? both : head;
}

/* ------------------------------------------------------------ structured -- */

type JsonLd = Record<string, unknown>;

/** Stable ids, so the graph can refer to a node rather than repeat it. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const SITE_ID = `${SITE_URL}/#website`;

/**
 * The Organization record — this is what puts the logo in search.
 *
 * A favicon is what Google shows beside an ordinary blue link, and that comes
 * from `app/icon.png`. This is the other one: the `logo` property is what
 * Google reads for the brand image in a knowledge panel, and it is the only
 * documented way to tell a search engine which of the many images on a site is
 * the company's mark. Neither is a guarantee — Google decides — but without
 * this there is nothing to decide from.
 *
 * `sameAs` is where social and directory profiles go once they exist. It is
 * the strongest signal available for tying a website to a company entity, so
 * it is worth filling in; it stays out of the output while the list is empty
 * rather than shipping as `[]`.
 */
export function organizationJsonLd(): JsonLd {
  const node: JsonLd = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: absolute(LOGO_PATH),
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      caption: `${SITE_NAME} logo`,
    },
    image: absolute(LOGO_PATH),
  };

  /* Everything below is a fact about a real company. Present only when known.
     See the header of lib/company.ts for why that rule is absolute here. */
  if (company.legalName) node.legalName = company.legalName;
  if (company.foundedYear) node.foundingDate = String(company.foundedYear);

  if (company.registeredAddress) {
    const a = company.registeredAddress;
    node.address = {
      "@type": "PostalAddress",
      streetAddress: [a.line1, a.line2].filter(Boolean).join(", "),
      addressLocality: a.city,
      addressRegion: a.state,
      postalCode: a.pincode,
      addressCountry: "IN",
    };
  }

  if (company.supportEmail || company.supportPhone) {
    node.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      ...(company.supportEmail ? { email: company.supportEmail } : {}),
      ...(company.supportPhone ? { telephone: company.supportPhone } : {}),
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    };
  }

  const sameAs = reviewProfiles.map((p) => p.url).filter(Boolean);
  if (sameAs.length) node.sameAs = sameAs;

  return node;
}

/** The site itself, tied to the organization that publishes it. */
export function websiteJsonLd(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "en-IN",
    publisher: { "@id": ORG_ID },
  };
}

/**
 * A breadcrumb trail.
 *
 * One of the few structured-data types that still changes what a result LOOKS
 * like: Google replaces the raw URL under the title with the trail. Worth
 * emitting on any page that sits below the top level.
 *
 * Paths are site-relative in, absolute out.
 */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: absolute(step.path),
    })),
  };
}

/**
 * Wrap nodes into one graph.
 *
 * A single `@graph` rather than several separate `<script>` tags, so nodes can
 * point at one another by `@id` — the Service on a service page names the
 * Organization as its provider without restating the whole organization.
 */
export function graph(...nodes: JsonLd[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
}

/* -------------------------------------------------------------- helpers -- */

/**
 * Metadata for a page that is not finished yet.
 *
 * `index: false, follow: true` — keep it out of the index, keep following the
 * links on it. Twenty-odd placeholder pages carrying the same forty words is
 * thin, near-duplicate content, and a search engine judging this site on the
 * average of its pages should not be shown twenty copies of "coming soon".
 *
 * WHEN A PAGE GETS REAL CONTENT, DELETE THIS CALL. Replace it with a normal
 * `metadata` object carrying a real description, and add the route to
 * `app/sitemap.ts`. That is the whole checklist.
 */
export function comingSoonMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: { index: false, follow: true },
  };
}

/**
 * Metadata for a page behind a sign-in.
 *
 * These are reachable — a crawler that finds one gets the signed-out render —
 * but there is nothing on them worth indexing and their titles ("Your cart",
 * "Wallet") would compete with the pages that matter. Kept out by name rather
 * than by robots.txt, because a path blocked in robots.txt is a path whose
 * `noindex` is never read; the two directives cancel each other out.
 */
export const PRIVATE_PAGE_ROBOTS = { index: false, follow: false } as const;
