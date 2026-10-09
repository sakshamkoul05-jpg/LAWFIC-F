import { services } from "../services.ts";

/**
 * Where "File it with LAWFIC" goes for a catalogue slug: the full service page
 * when one is written, otherwise the generic request page, which takes a
 * request for anything in the catalogue and quotes it like any other order.
 */
export function fileWithLawficHref(slug: string | undefined): string {
  if (!slug) return "/instant-help";
  return services.some((s) => s.slug === slug) ? `/services/${slug}` : `/request/${slug}`;
}
