"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { APPS, SITES } from "@/lib/branding";
import { AppIcon, IndiaTime, Magnetic, SiteShot } from "./Shared";
import QuoteButton from "./QuoteButton";
import { useIntroDone } from "./Stage";

/**
 * The opening of /branding.
 *
 * One orchestrated moment: the three lines of the headline rise out of their
 * own masks, then the work slots into the sentence — a window cycling through
 * live sites after "websites", an icon cycling through the Play Store apps
 * after "apps". Everything else on the page stays still until you touch it.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

function Cycle<T>({ items, every, render }: { items: T[]; every: number; render: (item: T) => ReactNode }) {
  const reduced = !!useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced || items.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % items.length), every);
    return () => clearInterval(id);
  }, [reduced, items.length, every]);
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={i}
        className="absolute inset-0 block"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-100%" }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {render(items[i])}
      </motion.span>
    </AnimatePresence>
  );
}

function Slot({ delay, className, children }: { delay: number; className: string; children: ReactNode }) {
  const reduced = !!useReducedMotion();
  const done = useIntroDone();
  return (
    <motion.span
      className={`relative mx-[0.12em] inline-block overflow-hidden align-[-0.08em] ${className}`}
      initial={reduced ? false : { scale: 0, opacity: 0 }}
      animate={done || reduced ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={{ delay, duration: 0.6, ease: EASE }}
      aria-hidden
    >
      {children}
    </motion.span>
  );
}

function Line({ i, children }: { i: number; children: ReactNode }) {
  const reduced = !!useReducedMotion();
  const done = useIntroDone();
  return (
    <span className="block overflow-hidden pb-[0.06em]">
      <motion.span
        className="block"
        initial={reduced ? false : { y: "110%" }}
        animate={{ y: done || reduced ? "0%" : "110%" }}
        transition={{ delay: 0.15 + i * 0.09, duration: 1, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const reduced = !!useReducedMotion();
  const done = useIntroDone();
  const after = (d: number) => ({
    initial: reduced ? false : ({ opacity: 0, y: 12 } as const),
    animate: done || reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
    transition: { delay: d, duration: 0.7, ease: EASE },
  });

  /* as the page moves on, the headline drifts up and lets go */
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);

  return (
    <section ref={ref} className="mx-auto flex min-h-[calc(100svh-7rem)] max-w-[1440px] flex-col justify-between gap-16 px-5 pb-12 pt-10 sm:px-10 sm:pt-14">
      <motion.div {...after(0.05)} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[14px] text-muted">
        <p className="font-medium text-foreground">LAWFIC Studio</p>
        <div className="flex items-center gap-6">
          <p className="flex items-center gap-2">
            <span className="relative flex size-2">
              {!reduced && <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" />}
              <span className="relative size-2 rounded-full bg-success" />
            </span>
            Open for new projects
          </p>
          <p className="hidden sm:block">
            India <IndiaTime />
          </p>
        </div>
      </motion.div>

      <motion.h1
        style={reduced ? undefined : { y: drift, opacity: fade }}
        aria-label="We design and build websites, apps and brands."
        className="text-[clamp(2.15rem,8.4vw,8.75rem)] font-medium leading-[0.98] tracking-[-0.06em] text-foreground"
      >
        <span aria-hidden>
          <Line i={0}>We design and</Line>
          <Line i={1}>
            build
            <Slot delay={1.05} className="h-[0.74em] w-[1.75em] rounded-[0.16em]">
              <Cycle items={SITES} every={2600} render={(s) => <SiteShot site={s} eager className="size-full" />} />
            </Slot>
            websites,
          </Line>
          <Line i={2}>
            apps
            <Slot delay={1.2} className="size-[0.74em] rounded-[22%]">
              <Cycle items={APPS} every={2200} render={(a) => <AppIcon app={a} className="size-full text-[0.3em]" />} />
            </Slot>
            and brands.
          </Line>
        </span>
      </motion.h1>

      <motion.div {...after(0.9)} className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <p className="max-w-[46ch] text-[16px] leading-relaxed text-muted">
          Websites, Android and iOS apps, marketing, photography and custom software, by the team that built lawfic.pro.{" "}
          {APPS.length} apps are live on Google Play, and the {SITES.length} websites below are a few of the many we have delivered.
        </p>
        <div className="flex items-center gap-6">
          <a href="#work" className="text-[15px] font-medium text-foreground underline decoration-border-3 underline-offset-[6px] hover:decoration-foreground">
            See the work
          </a>
          <Magnetic>
            <QuoteButton
              label="Start a project"
              className="flex size-32 items-center justify-center rounded-full bg-foreground p-4 text-center text-[15px] font-medium text-background transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:size-36"
            />
          </Magnetic>
        </div>
      </motion.div>
    </section>
  );
}
