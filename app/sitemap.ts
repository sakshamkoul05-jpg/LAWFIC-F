import type { MetadataRoute } from "next";
import { absolute, IS_PUBLIC_SITE } from "@/lib/seo";
import { services } from "@/lib/services";
import { documents } from "@/lib/documents";
import { legalDocs } from "@/lib/legal";

/**
 * The sitemap.
 *
 * WHAT GOES IN
 *
 * Exactly the pages that should appear in search results, and nothing else. A
 * sitemap is not an inventory of routes: listing a page that carries `noindex`
 * is a contradiction a crawler has to resolve, and it is reported as one in
 * Search Console. So the rule is a single one — a URL belongs here if, and
 * only if, the page at it is indexable.
 *
 * That leaves out three groups by design:
 *
 *   • The "coming soon" placeholders. Twenty-odd pages of the same forty
 *     words. They carry `comingSoonMetadata`, which sets noindex. When one
 *     gets real content, delete that call and add the route below.
 *   • Anything personal — wallet, cart, orders, profile, saved services.
 *   • The back office, the API and the auth callbacks, which robots.txt
 *     blocks outright.
 *
 * WHY THE LISTS ARE DERIVED AND NOT TYPED OUT
 *
 * Services, catalogue documents and legal pages are already enumerated in
 * lib/. Copying their slugs into a second list would mean every new service
 * silently missing from the sitemap until somebody remembered — which is the
 * normal fate of a hand-maintained sitemap. Mapping over the source means a
 * new service is in it the moment it exists.
 *
 * The document filter mirrors `generateStaticParams` in
 * app/document/[slug]/page.tsx exactly: a document with a full service page
 * redirects there, so listing both would submit a redirect as a canonical URL.
 *
 * `lastModified` is the build time. That is honest for this site — the content
 * is compiled into the bundle, so it genuinely did last change when the bundle
 * was built — and it is better than a hardcoded date, which goes stale and
 * teaches crawlers to ignore the field.
 */

type Entry = MetadataRoute.Sitemap[number];

export default function sitemap(): MetadataRoute.Sitemap {
  /* A preview or local build has no business publishing a sitemap of URLs on
     a hostname that is not the real one. robots.txt already tells crawlers to
     stay out; this keeps the two consistent. */
  if (!IS_PUBLIC_SITE) return [];

  const now = new Date();

  const entry = (
    path: string,
    priority: number,
    changeFrequency: Entry["changeFrequency"],
  ): Entry => ({
    url: absolute(path),
    lastModified: now,
    changeFrequency,
    priority,
  });

  /* Priority is a hint about relative importance WITHIN this site, not a
     ranking lever — it does nothing between sites. The ordering below is
     simply: the home page, then the pages that sell, then the pages that are
     required to exist. */
  const core: Entry[] = [
    entry("/", 1.0, "daily"),
    entry("/services", 0.9, "weekly"),
    entry("/document", 0.8, "weekly"),
    entry("/pricing", 0.8, "weekly"),
    entry("/about", 0.6, "monthly"),
    entry("/contact", 0.6, "monthly"),
    entry("/startup", 0.6, "monthly"),
    entry("/jobs", 0.5, "weekly"),
  ];

  /* The service pages are the ones that answer a real search — somebody types
     "udyam registration" long before they type "LAWFIC". Highest priority
     after the home page. */
  const servicePages = services.map((s) => entry(`/services/${s.slug}`, 0.9, "monthly"));

  const documentPages = documents
    .filter((d) => !d.live)
    .map((d) => entry(`/document/${d.slug}`, 0.6, "monthly"));

  const legalPages = legalDocs.map((d) => entry(`/legal/${d.slug}`, 0.3, "yearly"));

  return [...core, ...servicePages, ...documentPages, ...legalPages];
}
