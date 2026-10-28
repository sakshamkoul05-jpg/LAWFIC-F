"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * A pinned sideways reel.
 *
 * The section holds to the screen and scrolling down carries a row of large
 * cards past sideways. The row leans with scroll speed, a counter keeps your
 * place and a line fills underneath. Used for the websites and for the other
 * services, so both read as one showreel. Under reduced motion it is an
 * ordinary row you can scroll sideways.
 */
export default function Reel({
  label,
  count,
  intro,
  outro,
  cards,
}: {
  label: string;
  count: number;
  intro: ReactNode;
  outro: ReactNode;
  /** The cards, given the reel's progress (0–1) for any parallax inside them. */
  cards: (progress: MotionValue<number>) => ReactNode;
}) {
  const reduced = !!useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [current, setCurrent] = useState(1);

  /* how far the row has to travel: its width less one screen */
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress, scrollY } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (v) => -v * distance);
  const velocity = useSpring(useVelocity(scrollY), { stiffness: 300, damping: 50 });
  const skew = useTransform(velocity, [-2500, 0, 2500], [4, 0, -4], { clamp: true });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setCurrent(Math.min(count, Math.max(1, Math.round(v * (count + 1)))));
  });

  if (reduced) {
    return (
      <section className="overflow-x-auto py-24" aria-label={label}>
        <div className="flex w-max gap-12 px-5 sm:px-10">
          {intro}
          {cards(scrollYProgress)}
          {outro}
        </div>
      </section>
    );
  }

  return (
    <section ref={section} className="relative" style={{ height: `calc(100svh + ${distance}px)` }} aria-label={label}>
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden pb-28 pt-24 md:pb-16">
        <motion.div
          ref={track}
          className="flex w-max items-center gap-[clamp(2rem,5vw,6rem)] px-5 will-change-transform sm:px-10"
          style={{ x, skewX: skew }}
        >
          {intro}
          {cards(scrollYProgress)}
          {outro}
        </motion.div>
        <div className="absolute inset-x-5 bottom-24 flex items-center gap-5 text-[14px] text-muted sm:inset-x-10 md:bottom-8">
          <span className="w-16 tabular-nums text-foreground">
            {String(current).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
          <span className="relative h-px flex-1 bg-border-2">
            <motion.span className="absolute inset-0 origin-left bg-foreground" style={{ scaleX: scrollYProgress }} />
          </span>
        </div>
      </div>
    </section>
  );
}

/** The width every reel card shares: as large as the screen allows. */
export const REEL_CARD_W = "w-[min(80vw,56rem,calc((100svh-22rem)*1.6))]";

/** The intro and outro panels either side of the cards. */
export function ReelSide({ children }: { children: ReactNode }) {
  return <div className="flex w-[min(78vw,26rem)] shrink-0 flex-col justify-center">{children}</div>;
}
