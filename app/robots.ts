import type { MetadataRoute } from "next";
import { IS_PUBLIC_SITE, SITE_URL, absolute } from "@/lib/seo";

/**
 * robots.txt.
 *
 * WHAT THIS FILE CAN AND CANNOT DO
 *
 * `Disallow` stops a crawler FETCHING a path. It does not remove that path
 * from an index — Google will still list a blocked URL it has seen linked
 * elsewhere, titleless, with "No information is available for this page".
 * Keeping something out of results is `noindex`, which is a header or a meta
 * tag on the page itself.
 *
 * The two cancel each other out. A page blocked here is a page whose `noindex`
 * is never read, because reading it would require the fetch that was just
 * forbidden. So each private area appears in exactly one of the two places:
 *
 *   • Whole trees that no crawler has any business inside — /api, /admin,
 *     /auth — are blocked HERE. There is nothing in them a search engine
 *     should spend a request on.
 *   • Pages that are merely personal — the wallet, the cart, an order — are
 *     left crawlable and carry `robots: { index: false }` in their own
 *     metadata (see PRIVATE_PAGE_ROBOTS in lib/seo.ts). A crawler gets the
 *     signed-out render, reads the noindex, and drops them properly.
 *
 * NONE OF THIS IS THE ACCESS CONTROL
 *
 * robots.txt is a public file that asks politely. It is read by well-behaved
 * crawlers and ignored by everything else, and listing a path here advertises
 * that the path exists. What actually protects customer data is Row Level
 * Security in the database and the auth checks on each page; this file only
 * stops search engines wasting their crawl budget and ours.
 */

export default function robots(): MetadataRoute.Robots {
  /* A preview or local build must never invite crawlers. Without this, the
     moment a preview deployment is linked anywhere public it competes with the
     real site for its own content — and duplicate content under a hostname
     that expires is worse than no content at all. */
  if (!IS_PUBLIC_SITE) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // endpoints, not pages
          "/admin", // the back office, including /admin/login
          "/auth/", // one-use sign-in and recovery URLs; following one burns it
        ],
      },
    ],
    sitemap: absolute("/sitemap.xml"),
    host: SITE_URL,
  };
}
