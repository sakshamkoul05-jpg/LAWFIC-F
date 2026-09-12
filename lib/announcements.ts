/**
 * The eleven claims on the running strip, as plain text.
 *
 * Split out of the ticker component so SERVER code can read them. The
 * component is `"use client"`, and importing it from a server module to reach
 * one array would pull a React component and its whole import graph into the
 * server bundle to get at eleven strings.
 *
 * This is the FALLBACK, not the source. The strip is editable from the back
 * office now — `ticker.lines` in site_settings — and these are what renders
 * when that row is missing or malformed, which is also what shipped.
 *
 * ORDER IS LOAD-BEARING
 *
 * The ticker matches an icon to each line by position, so reordering this
 * array reorders the icons with it. Editing a line's WORDS from the back
 * office keeps its icon; inserting a line in the middle does not, and the
 * admin form says so.
 */
export const ANNOUNCEMENTS = [
  "Pan India Service",
  "24*7 Customer Service",
  "Easy, Fast & Reasonable Price",
  "Guranteed Money Back",
  "21000+ Proffessional Expert*",
  "1000+ Conecting Store*",
  "51000+ Service*",
  "100 % Safe & Secure Data",
  "Your All information In One Place",
  "Attractive Dashboard",
  "Partner With Us & Fixed Earn",
];
