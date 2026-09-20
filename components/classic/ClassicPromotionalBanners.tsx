"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { bannerColours } from "@/lib/banner-colours";
import { promotionalBanners, TONES, type Banner } from "@/lib/promotional";
import { useLocale } from "@/components/i18n/LocaleProvider";

const DWELL_MS = 6500;

/**
 * The promotional carousel.
 *
 * Big, as asked — a full-bleed band rather than the row of 260px tiles that
 * scrolled past too fast to read. One banner at a time gets the whole width,
 * which is what lets the headline be set at a size worth reading.
 *
 * It is built on scroll-snap rather than a transform track, so swipe on a
 * phone is the browser's own gesture — momentum, rubber-banding and all —
 * instead of a hand-rolled approximation of it. Auto-advance simply scrolls
 * the same container, so a person mid-swipe is never fighting a timer.
 *
 * Rules it keeps:
 *   - hovering, focusing or touching it stops the timer, so nothing slides
 *     out from under someone who is reading or reaching for the link;
 *   - `prefers-reduced-motion` disables auto-advance entirely and makes the
 *     remaining moves instant — the banners become a plain swipeable row;
 *   - every slide is a real link, and the dots and arrows are real buttons,
 *     so this is operable by keyboard and legible to a screen reader;
 *   - the pause button is a decision that outlives the pointer — see the note
 *     on `stopped` below.
 */
/**
 * `banners` comes from the database via the server, because the back office
 * runs this carousel now. It defaults to the compiled list so a caller that
 * does not have the rows — or a build with no database — still renders eleven
 * banners instead of an empty band where the hero should be.
 *
 * Threaded as a PROP rather than fetched on mount, deliberately. This is the
 * first thing on the page; a fetch here means the hero is blank for as long as
 * the round trip takes, on every visit, which is the one place on the site
 * that can least afford it.
 */
export default function ClassicPromotionalBanners({
  banners = promotionalBanners,
}: {
  banners?: Banner[];
} = {}) {
  const { tx } = useLocale();
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  /* TWO KINDS OF PAUSE, AND THEY MUST NOT SHARE A FLAG.
     `paused` is transient — it is on while a pointer is over the band, a
     finger is down, or something inside has focus, and it clears by itself.
     `stopped` is a decision somebody made by pressing the button, and the one
     thing it must survive is the mouse leaving the band. Folding them into one
     boolean means the pause button un-presses itself the moment you move the
     pointer away from it, which is exactly when you would. */
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);

  const count = banners.length;

  /* THE NAVIGATION BARS TAKE THEIR COLOUR FROM THE SLIDE ON SCREEN.
     The client asked for it: a red flyer should give red bars.

     It is published as custom properties on <html> rather than passed down as
     props, because the two bars that consume it — the header and the section
     strip — are neither children nor siblings of this carousel, and threading
     a colour from the middle of the home page up through ThemeShell and back
     down into both would couple three components to a detail of one.

     The colours are read out of the photographs at build time; see
     lib/banner-colours.ts and the script that writes it. A photograph with no
     hue worth borrowing, and any slide with no photograph, clears the
     properties so the bars fall back to the site's own navy rather than
     holding the previous slide's colour.

     Cleared on unmount too: the carousel only exists on the home page, and a
     stale red header on /contact would be this component leaking. */
  useEffect(() => {
    const root = document.documentElement;
    const photo = banners[index]?.photo;
    const colour = photo ? bannerColours[photo] : null;

    const apply = (key: string, value: string | null) => {
      if (value) root.style.setProperty(key, value);
      else root.style.removeProperty(key);
    };

    apply("--bar-bg", colour?.bar ?? null);
    apply("--bar-lift", colour?.lift ?? null);
    apply("--bar-accent", colour?.accent ?? null);
    apply("--bar-wash", colour?.wash ?? null);

    return () => {
      apply("--bar-bg", null);
      apply("--bar-lift", null);
      apply("--bar-accent", null);
      apply("--bar-wash", null);
    };
  }, [index, banners]);

  /* Scroll the track under our own control.
     `scrollTo({ behavior: "smooth" })` cannot be relied on inside a
     scroll-snap-mandatory container: in some engines the snap algorithm
     cancels the in-flight smooth scroll and the carousel simply never moves,
     silently and only at runtime. Assigning scrollLeft always works, so the
     tween is driven here — which also means reduced motion, interruption and
     easing are all decided in one place rather than by the engine. */
  const animation = useRef<number | null>(null);

  const stopAnimation = useCallback(() => {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
    // An interrupted tween must not leave snapping disabled.
    const el = trackRef.current;
    if (el) el.style.scrollSnapType = "";
  }, []);

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const el = trackRef.current;
      if (!el || el.clientWidth === 0) return;

      const next = ((i % count) + count) % count;
      const to = next * el.clientWidth;
      stopAnimation();

      /* A hidden tab gets no animation frames at all — the browser suspends
         rAF for backgrounded documents. Tweening there would start, never
         advance, and strand the track mid-scroll with snapping switched off.
         There is also nobody watching, so jump. */
      if (!smooth || reduced || document.hidden) {
        el.scrollLeft = to;
        setIndex(next);
        return;
      }

      const from = el.scrollLeft;
      if (Math.abs(to - from) < 1) return;

      /* Snapping has to be off for the duration of the tween. With
         `scroll-snap-type: x mandatory` the engine re-snaps after every
         scrollLeft assignment, and intermediate frames are never snap points,
         so each frame is yanked straight back to where it started and the
         carousel sits still. It goes back on at the end, where it belongs —
         it is what makes a finger-swipe land cleanly on a slide. */
      const restoreSnap = el.style.scrollSnapType;
      el.style.scrollSnapType = "none";

      const DURATION = 520;
      const start = performance.now();
      // easeInOutCubic
      const ease = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(watchdog);
        el.scrollLeft = to;
        el.style.scrollSnapType = restoreSnap;
        animation.current = null;
        setIndex(next);
      };

      /* If frames stop arriving mid-tween — the tab is hidden partway
         through, the page is throttled — land on the target rather than
         leaving the track stranded with snapping off. */
      const watchdog = setTimeout(finish, DURATION + 250);

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        el.scrollLeft = from + (to - from) * ease(t);
        if (t < 1) animation.current = requestAnimationFrame(step);
        else finish();
      };
      animation.current = requestAnimationFrame(step);
    },
    [count, reduced, stopAnimation],
  );

  /* Any real input wins over an animation in progress. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("wheel", stopAnimation, { passive: true });
    el.addEventListener("pointerdown", stopAnimation, { passive: true });
    return () => {
      el.removeEventListener("wheel", stopAnimation);
      el.removeEventListener("pointerdown", stopAnimation);
      stopAnimation();
    };
  }, [stopAnimation]);

  /* Derive the index from the scroll position, so a manual swipe and an
     automatic advance stay in agreement about where we are. */
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(Math.max(0, Math.min(count - 1, i)));
  }, [count]);

  useEffect(() => {
    if (reduced || paused || stopped) return;
    const t = setInterval(() => goTo(index + 1), DWELL_MS);
    return () => clearInterval(t);
  }, [index, paused, stopped, reduced, goTo]);

  /* Keep the current slide aligned when the viewport changes width. */
  useEffect(() => {
    const onResize = () => goTo(index, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [index, goTo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    }
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={tx("LAWFIC highlights")}
      className="relative border-b border-border bg-surface-2/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      /* Touch pauses while the finger is down and resumes when it lifts. An
         earlier version paused on touchstart with nothing to undo it, which
         on a phone meant the carousel stopped for good after the first
         swipe — the one device where it matters most. */
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="classic-tabs-nav flex snap-x snap-mandatory overflow-x-auto"
      >
        {banners.map((banner, i) => {
          const tone = TONES[banner.tone];
          return (
            <div
              key={banner.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
              className="w-full shrink-0 snap-center"
            >
              {/* A BLOCK HAS TO CARRY THE COLOUR THE PHOTOGRAPH USED TO.

                  The tones were mixed to sit UNDER a picture, so `from` is a
                  very dark brown or green and the panel is nearly black by
                  itself. That was right when an image supplied all the light,
                  and wrong the moment the image went away: eleven of them in a
                  row read as eleven empty dark rectangles.

                  So a slide with no photograph is lit from its own accent —
                  the leading corner is mixed a third of the way towards it,
                  which lifts the hue without leaving the family, and it falls
                  back to the original dark by the far edge so the type still
                  has something to sit on. A slide WITH a photograph keeps the
                  old, deliberately dark mix. */}
              <div
                className="relative overflow-hidden"
                style={{
                  /* A photo covers the frame, so what is under it only shows
                     for the instant before it decodes. Neutral there too: a
                     toned block flashing its colour and then being replaced by
                     a photograph of a different colour reads as a glitch. */
                  background: banner.photo
                    ? "#12100E"
                    : `linear-gradient(115deg, color-mix(in oklab, ${tone.from} 66%, ${tone.accent}) 0%, ${tone.from} 46%, ${tone.to} 100%)`,
                }}
              >
                {/* A PHOTOGRAPH IF THERE IS ONE, THE COLOUR BLOCK IF NOT.

                    The slides are colour blocks at the moment by request, with
                    photographs to be dropped in later. So the picture and the
                    gradient that goes with it render only when `photo` is set,
                    and adding one back is a single field on the banner — no
                    change here.

                    The gradient covers the LEFT COLUMN ONLY, not the frame.
                    It used to be a full-frame scrim, around ninety per cent
                    opaque a third of the way across and still forty at the far
                    edge, which made the picture a texture rather than a
                    photograph. What replaces it is a shadow: dense where the
                    words are, thinning fast, gone by two thirds across. The
                    text carries its own shadow as the backstop for a frame that
                    happens to be pale exactly where the headline sits. */}
                {banner.photo && (
                  <>
                    {/* WHERE THE CROP FALLS, AND WHY IT IS NOT CENTRED.

                        The frame is about 2.75:1 on a desktop and the pictures
                        are 16:9, so object-cover throws away roughly a third of
                        the image height — measured at 1366px wide: 159 source
                        pixels off the top and the same off the bottom. Centred,
                        that lands exactly on the band where heads and headroom
                        are, and it was slicing the top off people's skulls.

                        Narrow screens crop the OTHER axis: the frame is taller
                        than the picture there, so the sides go instead — and
                        every subject is composed on the right, which a centred
                        crop would cut away.

                        One value answers both, because each axis only bites on
                        the screen where that axis is the one being cropped.
                        70% keeps the right-hand subject on a phone; 25% keeps
                        the faces on a desktop. */}
                    <Image
                      src={banner.photo}
                      alt={banner.photoAlt ? tx(banner.photoAlt) : ""}
                      fill
                      priority={i === 0}
                      sizes="100vw"
                      className="object-cover"
                      style={{ objectPosition: "70% 25%" }}
                    />
                    {/* NEUTRAL, NOT TINTED.
                        This used to be a wash in the slide's own tone, which
                        coloured the photograph — a warm office came out plum,
                        a blue one came out green. The client asked for the
                        picture to be itself.

                        What is left is black at low opacity over the left
                        third only, and it is not decoration: white type on an
                        unknown photograph is unreadable wherever the picture
                        happens to be pale, and a headline nobody can read is
                        worse than a slightly darkened corner. It carries no
                        hue, so the photo's own colour is untouched — which is
                        also what lets the navigation bars borrow that colour
                        honestly. */}
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(96deg, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.58) 24%, rgba(0,0,0,0.24) 46%, transparent 66%)",
                      }}
                    />
                  </>
                )}

                {/* What keeps a bare block from reading as an empty div: a
                    band of the tone's own accent down the leading edge, and a
                    very faint diagonal ruling across the right half where the
                    photograph will go. Both are built from the slide's colours,
                    so eleven blocks are eleven different panels rather than
                    eleven rectangles of slightly different brown. */}
                {!banner.photo && (
                  <>
                    <div
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ background: tone.accent, opacity: 0.85 }}
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
                      style={{
                        backgroundImage: `repeating-linear-gradient(115deg, ${tone.accent}0F 0px, ${tone.accent}0F 1px, transparent 1px, transparent 13px)`,
                        maskImage: "linear-gradient(to right, transparent, #000 60%)",
                        WebkitMaskImage: "linear-gradient(to right, transparent, #000 60%)",
                      }}
                    />
                  </>
                )}

                {/* A single soft light source, keyed to the slide's accent.
                    Colour blocks only: over a photograph it is one more tint,
                    and the picture is supposed to be untinted. */}
                {!banner.photo && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-24 -top-32 size-[420px] rounded-full opacity-[0.14] blur-3xl"
                    style={{ background: tone.accent }}
                  />
                )}

                {/* pb-28 leaves the control bar somewhere to live.
                    The bars this replaced were 1px tall and let clicks through,
                    so content could run to the bottom edge. A 44px pill that
                    takes its own clicks cannot: at 375px it landed on top of
                    the banner's CTA and ate the taps along its lower edge —
                    measured, not guessed. The extra room is only at the
                    bottom, so nothing about the headline moves. */}
                <div className="relative mx-auto flex min-h-[300px] max-w-6xl flex-col justify-center gap-5 px-6 pb-28 pt-14 sm:min-h-[360px] sm:px-10 sm:pb-32 sm:pt-20">
                  <p
                    className="type-label"
                    style={{ color: tone.accent, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
                  >
                    {tx(banner.eyebrow)}
                  </p>

                  <h2
                    className="max-w-[19ch] text-[clamp(1.9rem,4.4vw,3.1rem)] font-semibold leading-[1.05] tracking-[-0.035em]"
                    style={{ color: "#F5F1EA", textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}
                  >
                    {tx(banner.title)}
                  </h2>

                  <p
                    className="max-w-[52ch] text-[15px] leading-relaxed sm:text-[16px]"
                    style={{
                      color: "rgba(245,241,234,0.82)",
                      textShadow: "0 1px 6px rgba(0,0,0,0.5)",
                    }}
                  >
                    {tx(banner.label)}
                  </p>

                  <div className="pt-2">
                    <Link
                      href={banner.href}
                      tabIndex={i === index ? 0 : -1}
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-medium transition-transform duration-200 hover:translate-x-0.5"
                      style={{ background: tone.accent, color: tone.to }}
                    >
                      {tx(banner.cta)}
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path
                          d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/*
        THE CONTROLS — back, dots, forward, pause. Centred, in one pill.

        WHY THEY ARE TOGETHER AND NOT IN THE CORNERS

        Arrows pinned to the left and right edges of a full-bleed band are two
        controls a metre apart on a desktop screen, and on a phone they sit
        exactly where a thumb rests while scrolling the page. Collected in the
        middle they are one object: you look in one place, and everything that
        changes the slide is there.

        THE ACTIVE DOT IS A PILL THAT FILLS

        The bars this replaces did one thing well — the fill said how long was
        left, not only where you were. Plain dots throw that away. So the
        current dot stretches into a short pill and fills across the dwell,
        which keeps the countdown while the other ten stay dots.

        THE PILL IS OPAQUE ENOUGH TO SURVIVE ANY BANNER

        Eleven banners in eleven tones pass underneath. White controls on a
        dark translucent ground read on all of them; controls tinted per
        banner would need eleven judgements and would be wrong on at least
        one.
      */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className="pointer-events-auto mb-5 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1.5 backdrop-blur-md sm:mb-7"
          /* Not a <nav>: these are controls for the region, and the region is
             already labelled as a carousel. */
        >
          <ControlButton onClick={() => goTo(index - 1)} label={tx("Previous banner")}>
            <path d="M11 3.5 6.5 8l4.5 4.5" />
          </ControlButton>

          <div className="flex items-center gap-1.5 px-1.5">
            {banners.map((banner, i) => {
              const current = i === index;
              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${tx("Show")} ${tx(banner.title)}`}
                  aria-current={current}
                  /* The hit target is 20px tall even though the dot is 7 —
                     a 7px tap target fails every guideline there is. The
                     padding is transparent and does the work. */
                  className="group grid h-5 place-items-center"
                >
                  <span
                    aria-hidden
                    className={`block h-[7px] overflow-hidden rounded-full transition-all duration-300 ${
                      current
                        ? "w-7 bg-white/25"
                        : "w-[7px] bg-white/40 group-hover:bg-white/70"
                    }`}
                  >
                    {/* The countdown, drawn only on the dot it belongs to. */}
                    {current && (
                      <span
                        className="block h-full rounded-full bg-white"
                        style={{
                          width: reduced || paused || stopped ? "100%" : "0%",
                          transition:
                            reduced || paused || stopped
                              ? "width 200ms ease"
                              : `width ${DWELL_MS}ms linear`,
                        }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <ControlButton onClick={() => goTo(index + 1)} label={tx("Next banner")}>
            <path d="M5 3.5 9.5 8 5 12.5" />
          </ControlButton>

          <span aria-hidden className="mx-0.5 h-4 w-px bg-white/20" />

          <ControlButton
            onClick={() => setStopped((v) => !v)}
            label={stopped ? tx("Resume the banners") : tx("Pause the banners")}
            pressed={stopped}
          >
            {stopped ? (
              <path d="M5 3.2v9.6L12.5 8z" fill="currentColor" stroke="none" />
            ) : (
              <path d="M6 3.5v9M10 3.5v9" />
            )}
          </ControlButton>
        </div>
      </div>
    </section>
  );
}

/**
 * One shape for every control, so back, forward and pause are the same object
 * three times rather than three buttons that happen to sit together.
 *
 * `aria-pressed` only for the pause toggle — it is the only one of the three
 * with a state. Back and forward do a thing and are done.
 */
function ControlButton({
  onClick,
  label,
  pressed,
  children,
}: {
  onClick: () => void;
  label: string;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className="grid size-8 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/70"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  );
}
