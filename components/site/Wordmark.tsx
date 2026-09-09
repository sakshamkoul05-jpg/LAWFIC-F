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
  return (
    <span className={`flex flex-col items-center leading-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lawfic-logo.png"
        alt=""
        className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12 lg:h-14 lg:w-14"
      />
      <span className="mt-1 font-display text-[15px] font-bold leading-none text-foreground [letter-spacing:0.06em] sm:text-[17px] lg:text-[19px]">
        LAWFIC
      </span>
      {/* Sized so twenty-five tracked characters land on the width of six
          large ones above. The name is tracked OUT and the tagline set small
          and tight; matching them by choosing a font size alone leaves one
          line visibly wider at every breakpoint but the one it was picked at. */}
      <span className="mt-[3px] hidden w-full text-center text-[5.5px] font-medium uppercase leading-none text-muted-foreground sm:block sm:text-[6px] lg:text-[6.6px] [letter-spacing:0.02em]">
        Quality service with love
      </span>
    </span>
  );
}
