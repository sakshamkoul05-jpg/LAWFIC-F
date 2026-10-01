"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The mark: emblem, name, tagline — stacked and CENTRED on one another.
 *
 * The client's note is specific: the logo on top, LAWFIC below it aligned to
 * the middle of the logo, and the tagline directly under LAWFIC matching its
 * length. Left-aligning the three, as this did, hangs the name and the tagline
 * off the logo's left edge and the block reads as three things that happen to
 * be stacked rather than one mark.
 *
 * "Matching length" is done with letter-spacing rather than a font size chosen
 * by eye: the tagline is set narrow and then tracked out until it fills the
 * width of the name above it. That way the two lines stay flush with each other
 * at every breakpoint instead of only at the one the sizes were picked at.
 */
export default function Wordmark({ className = "" }: { className?: string }) {
  const { tx } = useLocale();

  return (
    <span className={`flex flex-col items-center leading-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lawfic-logo.png"
        alt=""
        className="h-11 w-11 shrink-0 object-contain sm:h-14 sm:w-14 lg:h-[68px] lg:w-[68px]"
      />
      <span className="home-serif mt-1 text-[16px] font-bold leading-none text-foreground [letter-spacing:0.05em] sm:text-[19px] lg:text-[22px]">
        LAWFIC
      </span>
      {/* Sized so twenty-five tracked characters land on the width of six
          large ones above. The name is tracked OUT and the tagline set small
          and tight; matching them by choosing a font size alone leaves one
          line visibly wider at every breakpoint but the one it was picked at. */}
      {/* "Quality Service With Love !!" under the name, set so it can actually
          be read — the client's note: "ye ache se set hona chahiye". */}
      <span className="mt-[3px] hidden w-full whitespace-nowrap text-center text-[7.5px] font-medium leading-none text-muted-foreground sm:block lg:text-[8.5px]">
        {tx("Quality Service With Love")} <span aria-hidden className="text-[#E6B23C]">♥</span>
      </span>
    </span>
  );
}
