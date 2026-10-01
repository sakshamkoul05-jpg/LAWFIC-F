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
      {/* The name and tagline share one box whose width is the NAME's. The
          tagline is drawn as SVG text with textLength, so it is stretched or
          squeezed to exactly that width — flush under "LAWFIC" at every size,
          never sticking out either side. The wrapper's w-0 min-w-full keeps
          the tagline from widening the box itself. */}
      <span className="mt-1 inline-flex flex-col items-stretch">
        {/* The negative right margin cancels the letter-spacing after the
            last letter, so the box ends where the C ends. */}
        <span className="home-serif mr-[-0.12em] text-[16px] font-bold leading-none text-foreground [letter-spacing:0.12em] sm:text-[19px] lg:text-[22px]">
          LAWFIC
        </span>
        <span className="mt-[3px] hidden w-0 min-w-full sm:block">
          <svg viewBox="0 0 200 18" className="block h-auto w-full overflow-visible" role="img" aria-label={tx("Quality Service With Love")}>
            <text
              x="0"
              y="13.5"
              textLength="200"
              lengthAdjust="spacingAndGlyphs"
              fontSize="15.5"
              fontWeight="500"
              fontFamily="Inter, system-ui, sans-serif"
              fill="currentColor"
              className="text-muted-foreground"
            >
              {tx("Quality Service With Love")} <tspan fill="#E6B23C">♥</tspan>
            </text>
          </svg>
        </span>
      </span>
    </span>
  );
}
