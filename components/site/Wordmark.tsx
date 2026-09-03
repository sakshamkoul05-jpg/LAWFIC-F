/**
 * The mark: emblem, name, tagline — stacked, in that order, hard left.
 *
 * It was a small icon with the name beside it, which is a sensible way to spend
 * as little header height as possible and the wrong call for a firm whose whole
 * pitch is that it is a known name doing careful work. The emblem now leads at
 * roughly twice the size, with the name under it and the promise under that, so
 * the first thing on every page is who this is rather than a favicon and some
 * text.
 */
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex flex-col items-start leading-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lawfic-logo.png"
        alt=""
        className="h-11 w-11 shrink-0 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16"
      />
      <span className="mt-1 font-display text-[15px] font-bold leading-none tracking-[-0.01em] text-foreground sm:text-[19px] lg:text-[22px]">
        LAWFIC
      </span>
      <span className="mt-1 hidden text-[8.5px] font-medium uppercase leading-none tracking-[0.16em] text-muted-foreground sm:block sm:text-[9.5px]">
        Quality service with love
      </span>
    </span>
  );
}
