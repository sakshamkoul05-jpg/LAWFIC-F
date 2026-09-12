"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { ANNOUNCEMENTS as FALLBACK_LINES } from "@/lib/announcements";

/**
 * The running strip above the header — HOM PA INS 1 in the client's blueprint.
 *
 * Their instruction, verbatim in substance: the same eleven commands, black
 * background, white text, the background stays still and the lettering moves,
 * and on the home page it sits above the logo. So the eleven lines below are
 * transcribed from the sheet, spelling included where it is theirs to choose,
 * and nothing has been reworded.
 *
 * EACH CLAIM CARRIES ITS OWN MARK
 *
 * Eleven statements in a row, all set in the same small caps, read as one long
 * undifferentiated line — the eye has nothing to catch on and no way to tell
 * where one claim ends and the next begins. A glyph in front of each one gives
 * every claim a shape as well as a sentence, which is what makes a strip like
 * this scannable at a glance instead of only readable in full.
 *
 * They are drawn here rather than pulled from an icon set: eleven line drawings
 * at one weight, one size and one stroke, so the row stays a row. An emoji
 * would have been quicker and would have put eleven different art styles, and
 * on some systems eleven different colours, into a monochrome strip.
 *
 * HOW IT MOVES, AND WHY NOT WITH `marquee`
 *
 * The strip is one row of items rendered TWICE and translated by exactly half
 * its own width. At -50% the copy has taken the position the original started
 * in, so the loop restarts on an identical frame and there is no seam — the
 * trick every seamless ticker uses. Animating `left` or a scroll offset instead
 * would run on the main thread and judder against anything else on the page;
 * a transform runs on the compositor.
 *
 * IT PAUSES ON HOVER
 *
 * Moving text that cannot be stopped is unreadable by anyone who reads slowly,
 * and this strip carries claims a customer may well want to finish reading —
 * "guaranteed money back" is not decoration. Hover, or focus anything inside
 * it, and it stops; take the pointer away and it carries on from where it was
 * rather than restarting. Reduced-motion stops it outright and lets the row
 * scroll by hand instead: a person who has asked the system for no animation
 * should not get a page element that never stops sliding.
 *
 * The duplicate is aria-hidden, so a screen reader hears the eleven claims once
 * rather than twice.
 */

/** The eleven, exactly as the blueprint lists them, each with its mark. */
type Claim = { text: string; icon: React.ReactNode | null };

/* One viewBox, one stroke weight, one cap style for all eleven. The uniformity
   is the point — these are a set, not eleven separate pictures. */
const ANNOUNCEMENT_CLAIMS: Claim[] = [
  {
    // Pan India — a pin over a globe's meridians.
    text: "Pan India Service",
    icon: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="M3 10h14M10 3c1.9 2 2.9 4.4 2.9 7s-1 5-2.9 7c-1.9-2-2.9-4.4-2.9-7S8.1 5 10 3Z" />
      </>
    ),
  },
  {
    // Round the clock — a dial with its hands at an angle you can read small.
    text: "24*7 Customer Service",
    icon: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="M10 5.8V10l3 1.8" />
      </>
    ),
  },
  {
    // Fast and cheap — a bolt.
    text: "Easy, Fast & Reasonable Price",
    icon: <path d="M11 2.6 4.8 11.2H9.4l-.4 6.2 6.2-8.6h-4.6z" />,
  },
  {
    // Money back — a rupee inside a returning arrow.
    text: "Guranteed Money Back",
    icon: (
      <>
        <path d="M16.6 10a6.6 6.6 0 1 1-2-4.7" />
        <path d="M16.8 2.8v3h-3" />
        <path d="M8 7.4h4M8 9.6h4M11.4 7.4c1 0 1.6.5 1.6 1.1s-.6 1.1-1.6 1.1H8l3.4 3.3" />
      </>
    ),
  },
  {
    // Experts — a person with a badge shoulder line.
    text: "21000+ Proffessional Expert*",
    icon: (
      <>
        <circle cx="10" cy="7" r="3" />
        <path d="M4.4 16.6a5.6 5.6 0 0 1 11.2 0" />
      </>
    ),
  },
  {
    // Connecting stores — an awning over a shopfront.
    text: "1000+ Conecting Store*",
    icon: (
      <>
        <path d="M3.4 7.2 4.6 3.8h10.8l1.2 3.4z" />
        <path d="M4.6 7.2v9h10.8v-9" />
        <path d="M8.4 16.2v-4.4h3.2v4.4" />
      </>
    ),
  },
  {
    // The catalogue — a grid, because the claim is about count.
    text: "51000+ Service*",
    icon: (
      <>
        <rect x="3.2" y="3.2" width="5.6" height="5.6" rx="1.2" />
        <rect x="11.2" y="3.2" width="5.6" height="5.6" rx="1.2" />
        <rect x="3.2" y="11.2" width="5.6" height="5.6" rx="1.2" />
        <rect x="11.2" y="11.2" width="5.6" height="5.6" rx="1.2" />
      </>
    ),
  },
  {
    // Safe data — a shield with a tick, not a padlock: the claim is about
    // what is kept safe, and a padlock reads as "sign in required".
    text: "100 % Safe & Secure Data",
    icon: (
      <>
        <path d="M10 2.8 4.4 5v4.6c0 3.4 2.3 6.5 5.6 7.6 3.3-1.1 5.6-4.2 5.6-7.6V5z" />
        <path d="M7.6 9.8 9.4 11.6 12.8 8.2" />
      </>
    ),
  },
  {
    // Everything in one place — a folder.
    text: "Your All information In One Place",
    icon: (
      <>
        <path d="M2.8 5.6a1.4 1.4 0 0 1 1.4-1.4h3.2l1.8 2h6.6a1.4 1.4 0 0 1 1.4 1.4v7.2a1.4 1.4 0 0 1-1.4 1.4H4.2a1.4 1.4 0 0 1-1.4-1.4z" />
      </>
    ),
  },
  {
    // The dashboard — bars in a frame.
    text: "Attractive Dashboard",
    icon: (
      <>
        <rect x="2.8" y="3.6" width="14.4" height="12.8" rx="1.6" />
        <path d="M6.2 13V9.4M10 13V6.8M13.8 13v-2.4" />
      </>
    ),
  },
  {
    // Partnership — two links of a chain, which is a handshake that survives
    // being drawn at fourteen pixels.
    text: "Partner With Us & Fixed Earn",
    icon: (
      <>
        <path d="M8.4 11.6 11.6 8.4" />
        <path d="M7.4 8.2 6 9.6a2.9 2.9 0 0 0 4.1 4.1l1.4-1.4" />
        <path d="M12.6 11.8 14 10.4a2.9 2.9 0 0 0-4.1-4.1L8.5 7.7" />
      </>
    ),
  },
];

/** Kept as plain text for anything that only wants the words. */
export const ANNOUNCEMENTS = FALLBACK_LINES;

function ClaimIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-white/55"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/**
 * Pair each line of copy with an icon BY POSITION.
 *
 * The icons are drawn here and the words come from the back office, so the two
 * lists have to be married up somehow. Position is the only honest join: the
 * copy is free text and cannot be matched on, and an id per line would mean a
 * marketing edit that renames a claim also has to remember not to break an
 * invisible key.
 *
 * A line past the end of the icon list gets no icon rather than an undefined
 * one. Adding a twelfth claim from the back office is allowed and renders as
 * text — which is a reasonable outcome, and better than the row collapsing
 * because a component was handed `undefined` to render.
 */
function claimsFor(lines: string[]): Claim[] {
  return lines.map((text, i) => ({
    text,
    icon: ANNOUNCEMENT_CLAIMS[i]?.icon ?? null,
  }));
}

function Run({ claims, hidden = false }: { claims: Claim[]; hidden?: boolean }) {
  const { tx } = useLocale();

  return (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
      role={hidden ? undefined : "list"}
    >
      {claims.map((claim) => (
        <li key={claim.text} className="flex items-center whitespace-nowrap">
          <span className="flex items-center gap-2 px-6">
            {claim.icon && <ClaimIcon>{claim.icon}</ClaimIcon>}
            {/* 13px against the 11.5 it was. The strip is the first thing on
                the page and it was small enough to scan past; a point and a
                half is the difference between decoration and a line someone
                actually reads. The tracking comes down as the size goes up —
                letter-spacing that suits 11.5px looks sparse at 13. */}
            <span className="text-[13px] tracking-[0.08em] text-white/90">{tx(claim.text)}</span>
          </span>
          <span aria-hidden className="text-white/25">
            ·
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * `lines` comes from site_settings via the server. It defaults to the eleven
 * that shipped, so a build with no database — or a malformed setting — still
 * renders a strip rather than an empty black band.
 */
export default function AnnouncementTicker({
  lines = FALLBACK_LINES,
}: {
  lines?: string[];
} = {}) {
  const { tx } = useLocale();
  const claims = claimsFor(lines);

  return (
    <div
      className="ticker group relative w-full overflow-hidden bg-black py-1.5"
      aria-label={tx("LAWFIC service highlights")}
    >
      <div className="ticker-track flex w-max">
        <Run claims={claims} />
        <Run claims={claims} hidden />
      </div>
    </div>
  );
}
