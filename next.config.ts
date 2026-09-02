import type { NextConfig } from "next";

/**
 * The fifteen routes below used to be top-level navigation tabs, each rendering
 * a "coming soon" placeholder. They were removed from the nav (see lib/nav.ts),
 * but any link already in the wild — a shared URL, an index entry, a WhatsApp
 * forward — still has to land somewhere useful rather than on a 404.
 *
 * These are permanent (308) because the decision is permanent: a section
 * returns to the nav by being built, not by being promised. If one of them is
 * genuinely built later, delete its line here and add it back to lib/nav.ts.
 */
const retiredSections = [
  "admission",
  "blogs",
  "branding",
  "business",
  "career",
  "education",
  "entertainment",
  "gift",
  "instant-help",
  "investment",
  "lawfic",
  "new-idea",
  "our-store",
  "partner",
  "professionalism",
];

const nextConfig: NextConfig = {
  async redirects() {
    return retiredSections.map((slug) => ({
      source: `/${slug}`,
      destination: "/services",
      permanent: true,
    }));
  },
};

export default nextConfig;
