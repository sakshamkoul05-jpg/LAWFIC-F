/**
 * The global navigation — five doors, every one of them live.
 *
 * This replaces a 21-tab strip in which 15 tabs led to a "coming soon"
 * placeholder. Breadth did not go anywhere: the 39 services still exist and
 * are reachable, they are just reached through `/services` (which is built to
 * hold them, grouped by category) rather than through the chrome.
 *
 * The rule this file exists to enforce: **no nav item without a destination.**
 * If a section is not built, it does not appear here. Adding an entry to this
 * array is a claim that the page behind it is finished.
 */

export type NavItem = {
  label: string;
  href: string;
  /** Shown to screen readers and as the mobile sheet's second line. */
  blurb: string;
};

export const primaryNav: NavItem[] = [
  {
    label: "Services",
    href: "/services",
    blurb: "Registrations, licences and filings",
  },
  {
    label: "Pricing",
    href: "/pricing",
    blurb: "Our fee, and the government's, separately",
  },
  {
    label: "Jobs",
    href: "/jobs",
    blurb: "Openings matched to your city and trade",
  },
  {
    label: "Wallet",
    href: "/wallet",
    blurb: "Prepaid balance for LAWFIC filings",
  },
];

/**
 * Secondary destinations. These live in the footer, which is where Apple keeps
 * its equivalents too — real pages, just not competing for the top bar.
 */
export const secondaryNav: NavItem[] = [
  { label: "About", href: "/about", blurb: "Who we are and what we are not" },
  { label: "Contact", href: "/contact", blurb: "Support and grievances" },
];
