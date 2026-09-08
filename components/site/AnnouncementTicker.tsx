"use client";

/**
 * The running strip above the header — HOM PA INS 1 in the client's blueprint.
 *
 * Their instruction, verbatim in substance: the same eleven commands, black
 * background, white text, the background stays still and the lettering moves,
 * and on the home page it sits above the logo. So the eleven lines below are
 * transcribed from the sheet, spelling included where it is theirs to choose,
 * and nothing has been reworded.
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
 * it, and it stops. Reduced-motion stops it outright and lets the row scroll by
 * hand instead: a person who has asked the system for no animation should not
 * get a page element that never stops sliding.
 *
 * The duplicate is aria-hidden, so a screen reader hears the eleven claims once
 * rather than twice.
 */

/** The eleven, exactly as the blueprint lists them. */
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

function Run({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
      role={hidden ? undefined : "list"}
    >
      {ANNOUNCEMENTS.map((line) => (
        <li key={line} className="flex items-center whitespace-nowrap">
          <span className="px-6 text-[11.5px] tracking-[0.14em] text-white/90">{line}</span>
          <span aria-hidden className="text-white/25">
            ·
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function AnnouncementTicker() {
  return (
    <div
      className="ticker group relative w-full overflow-hidden bg-black"
      aria-label="LAWFIC service highlights"
    >
      <div className="ticker-track flex w-max">
        <Run />
        <Run hidden />
      </div>
    </div>
  );
}
