/**
 * Which services have a bespoke application form.
 *
 * WHY THIS IS NOT IN ApplySlot.tsx, WHERE IT WOULD READ BETTER
 *
 * That file is "use client", and a server component cannot CALL a function out
 * of a client module — only render one as a component. The service page is a
 * server component and needs to know, before it renders anything, whether to
 * draw the generic enquiry box. So the fact lives here, in a plain module both
 * sides can read, and ApplySlot keeps the map of slug to component.
 *
 * The two lists have to agree. They are checked against each other at module
 * load in development rather than trusted: a slug listed here with no form
 * behind it hides the enquiry box and puts nothing in its place, which is a
 * service page with no way to contact anybody.
 */

export const APPLY_FORM_SLUGS = ["msme-udyam", "aadhaar"] as const;

export type ApplyFormSlug = (typeof APPLY_FORM_SLUGS)[number];

export function hasApplyForm(slug: string): boolean {
  return (APPLY_FORM_SLUGS as readonly string[]).includes(slug);
}
