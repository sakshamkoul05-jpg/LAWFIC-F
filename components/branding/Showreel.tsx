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
import { useLayoutEffect, useRef, useState } from "react";
import { SITES, type SiteProject } from "@/lib/branding";
import { SiteShot } from "./Shared";
import QuoteButton from "./QuoteButton";

/**
 * The websites as a showreel.
 *
 * The section pins to the screen and scrolling down carries the sites past
 * sideways, one large browser window each. The faster you scroll the more the
 * row leans into the motion, and each homepage slides a little inside its
 * frame for depth. A counter keeps your place. Under reduced motion it is an
 * ordinary row you can swipe or scroll sideways.
 */

function Card({ site, i, progress }: { site: SiteProject; i: number; progress: MotionValue<number> }) {
  const shift = useTransform(progress, [0, 1], ["5%", "-5%"]);
  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="Visit"
      className="group block w-[min(80vw,56rem,calc((100svh-24rem)*1.6))] shrink-0 focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-foreground"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4 text-[14px] text-muted">
        <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
        <span>{site.kind}</span>
      </div>
      <div className="overflow-hidden rounded-[clamp(12px,1.6vw,22px)] border border-border-2 bg-surface shadow-[0_50px_100px_-50px_rgba(0,0,0,0.45)]">
        <div className="flex h-9 items-center gap-3 border-b border-border px-4">
          <span className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((d) => (
              <span key={d} className="size-2.5 rounded-full bg-border-3" />
            ))}
          </span>
          <span className="mx-auto truncate rounded-full bg-surface-2 px-4 py-1 text-[12px] text-muted">{site.domain}</span>
          <span className="w-10" aria-hidden />
        </div>
        <div className="relative aspect-[16/10] overflow-hidden">
          <motion.div className="absolute inset-y-0 -left-[6%] w-[112%]" style={{ x: shift }}>
            <SiteShot site={site} bare className="size-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
          </motion.div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="text-[clamp(1.5rem,2.8vw,2.6rem)] font-medium leading-none tracking-[-0.045em] text-foreground">{site.domain}</span>
        <span className="max-w-[36ch] text-[14.5px] leading-snug text-muted">{site.line}</span>
      </div>
    </a>
  );
}

export default function Showreel() {
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
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setCurrent(Math.min(SITES.length, Math.max(1, Math.round(v * (SITES.length + 1)))));
  });

  const intro = (
    <div className="flex w-[min(78vw,26rem)] shrink-0 flex-col justify-center">
      <h2 className="text-[clamp(2.4rem,5.4vw,5rem)] font-medium leading-[0.95] tracking-[-0.055em] text-foreground">
        Websites,
        <br />
        live today
      </h2>
      <p className="mt-6 max-w-[30ch] text-[15.5px] leading-relaxed text-muted">
        {SITES.length} of the sites we have designed and built, each one running its business right now. Keep scrolling.
      </p>
    </div>
  );
  const outro = (
    <div className="flex w-[min(78vw,26rem)] shrink-0 flex-col justify-center">
      <p className="text-[clamp(2rem,4.4vw,4rem)] font-medium leading-[0.98] tracking-[-0.05em] text-foreground">And many more, delivered to customers.</p>
      <div className="mt-8">
        <QuoteButton label="Start yours" />
      </div>
    </div>
  );

  if (reduced) {
    return (
      <section className="overflow-x-auto py-24">
        <div className="flex w-max gap-12 px-5 sm:px-10">
          {intro}
          {SITES.map((s, i) => (
            <Card key={s.domain} site={s} i={i} progress={bar} />
          ))}
          {outro}
        </div>
      </section>
    );
  }

  return (
    <section ref={section} className="relative" style={{ height: `calc(100svh + ${distance}px)` }} aria-label="Websites we have built">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden pb-28 pt-32 md:pb-16">
        <motion.div ref={track} className="flex w-max items-center gap-[clamp(2rem,5vw,6rem)] px-5 will-change-transform sm:px-10" style={{ x, skewX: skew }}>
          {intro}
          {SITES.map((s, i) => (
            <Card key={s.domain} site={s} i={i} progress={scrollYProgress} />
          ))}
          {outro}
        </motion.div>
        <div className="absolute inset-x-5 bottom-24 flex items-center gap-5 text-[14px] text-muted sm:inset-x-10 md:bottom-8">
          <span className="w-16 tabular-nums text-foreground">
            {String(current).padStart(2, "0")} / {String(SITES.length).padStart(2, "0")}
          </span>
          <span className="relative h-px flex-1 bg-border-2">
            <motion.span className="absolute inset-0 origin-left bg-foreground" style={{ scaleX: bar }} />
          </span>
        </div>
      </div>
    </section>
  );
}
