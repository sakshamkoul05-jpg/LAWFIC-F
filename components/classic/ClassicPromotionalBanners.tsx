"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { promotionalBanners, TONES } from "@/lib/promotional";

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
 *   - every slide is a real link, and the dots are real buttons, so this is
 *     operable by keyboard and legible to a screen reader.
 */
export default function ClassicPromotionalBanners() {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = promotionalBanners.length;

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
    if (reduced || paused) return;
    const t = setInterval(() => goTo(index + 1), DWELL_MS);
    return () => clearInterval(t);
  }, [index, paused, reduced, goTo]);

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
      aria-label="LAWFIC highlights"
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
        {promotionalBanners.map((banner, i) => {
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
              <div
                className="relative overflow-hidden"
                style={{
                  background: `linear-gradient(115deg, ${tone.from} 0%, ${tone.to} 72%)`,
                }}
              >
                {/* The photograph, then a scrim over it.
                    A headline set straight on a photo is a coin toss — it is
                    legible over the dark parts and vanishes over the bright
                    ones. The gradient is opaque where the text sits and clears
                    towards the right, so the picture is visible, the words are
                    always readable, and neither is left to chance. */}
                <Image
                  src={banner.photo}
                  alt={banner.photoAlt}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(100deg, ${tone.to} 0%, ${tone.to}F0 34%, ${tone.from}B8 62%, ${tone.from}66 100%)`,
                  }}
                />

                {/* A single soft light source, keyed to the slide's accent. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-24 -top-32 size-[420px] rounded-full opacity-[0.14] blur-3xl"
                  style={{ background: tone.accent }}
                />

                <div className="relative mx-auto flex min-h-[300px] max-w-6xl flex-col justify-center gap-5 px-6 py-14 sm:min-h-[360px] sm:px-10 sm:py-20">
                  <p
                    className="type-label"
                    style={{ color: tone.accent }}
                  >
                    {banner.eyebrow}
                  </p>

                  <h2
                    className="max-w-[19ch] text-[clamp(1.9rem,4.4vw,3.1rem)] font-semibold leading-[1.05] tracking-[-0.035em]"
                    style={{ color: "#F5F1EA" }}
                  >
                    {banner.title}
                  </h2>

                  <p
                    className="max-w-[52ch] text-[15px] leading-relaxed sm:text-[16px]"
                    style={{ color: "rgba(245,241,234,0.68)" }}
                  >
                    {banner.label}
                  </p>

                  <div className="pt-2">
                    <Link
                      href={banner.href}
                      tabIndex={i === index ? 0 : -1}
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-medium transition-transform duration-200 hover:translate-x-0.5"
                      style={{ background: tone.accent, color: tone.to }}
                    >
                      {banner.cta}
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

      {/* Position + control. The active bar fills over the dwell time, so the
          indicator says how long is left rather than only where you are. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 pb-5 sm:px-10 sm:pb-7">
          {promotionalBanners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${banner.title}`}
              aria-current={i === index}
              className="pointer-events-auto h-1 flex-1 max-w-[68px] overflow-hidden rounded-full bg-white/20 transition-colors hover:bg-white/35"
            >
              <span
                aria-hidden
                className="block h-full rounded-full bg-white/85"
                style={{
                  width: i === index ? "100%" : "0%",
                  transition:
                    i === index && !reduced && !paused
                      ? `width ${DWELL_MS}ms linear`
                      : "width 200ms ease",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
