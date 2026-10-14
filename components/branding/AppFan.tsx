"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import { APPS, type AppProject } from "@/lib/branding";

/**
 * The apps as a hand of phones.
 *
 * On a wide screen they start stacked in the middle and fan out as the
 * section scrolls into view — each phone a real app, its icon on the home
 * screen, tapping it opens the Play Store page. Hovering one lifts it out of
 * the hand. On a phone the fan becomes a swipeable row.
 */

function AppIcon({ app, size }: { app: AppProject; size: string }) {
  const [broken, setBroken] = useState(!app.icon);
  return broken ? (
    <span className={`flex ${size} items-center justify-center rounded-[22%] bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] font-bold tracking-[-0.04em] text-background`}>
      {app.mono}
    </span>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={app.icon} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={`${size} rounded-[22%] object-cover shadow-lg`} />
  );
}

function Phone({ app }: { app: AppProject }) {
  return (
    <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[30px] border-[5px] border-foreground/90 bg-[linear-gradient(170deg,var(--color-surface),var(--color-background))] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)]">
      <div className="mx-auto mt-2 h-[10px] w-[34%] rounded-full bg-foreground/90" />
      <div className="flex flex-col items-center px-3 pt-[22%] text-center">
        <AppIcon app={app} size="size-[46%] text-[22px]" />
        <p className="mt-4 line-clamp-2 text-[13px] font-semibold leading-tight tracking-[-0.01em] text-foreground">{app.name}</p>
        <p className="mt-1 text-[11px] text-subtle">{app.category}</p>
      </div>
      <div className="absolute inset-x-3 bottom-4 rounded-full bg-primary py-1.5 text-center text-[11px] font-medium text-background">Open on Play</div>
    </div>
  );
}

function FanPhone({ app, i, n, progress }: { app: AppProject; i: number; n: number; progress: MotionValue<number> }) {
  const offset = i - (n - 1) / 2;
  const x = useTransform(progress, [0, 1], [offset * 6, offset * 132]);
  const y = useTransform(progress, [0, 1], [0, Math.abs(offset) * 26]);
  const rotate = useTransform(progress, [0, 1], [offset * 1.5, offset * 9]);
  return (
    <motion.a
      href={`https://play.google.com/store/apps/details?id=${app.playId}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${app.name} on Google Play`}
      className="absolute left-1/2 top-0 w-[170px] -ml-[85px] origin-bottom focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      style={{ x, y, rotate, zIndex: 10 - Math.abs(Math.round(offset)) }}
      whileHover={{ y: -36, scale: 1.06, zIndex: 30, transition: { type: "spring", stiffness: 300, damping: 20 } }}
    >
      <Phone app={app} />
    </motion.a>
  );
}

export default function AppFan() {
  const reduced = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });
  const open = useTransform(progress, (v) => (reduced ? 1 : v));

  return (
    <>
      {/* wide screens: the fan */}
      <div ref={ref} className="relative hidden h-[480px] lg:block">
        {APPS.map((a, i) => (
          <FanPhone key={a.playId} app={a} i={i} n={APPS.length} progress={open} />
        ))}
      </div>
      {/* phones: a swipeable row */}
      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 lg:hidden">
        {APPS.map((a) => (
          <a
            key={a.playId}
            href={`https://play.google.com/store/apps/details?id=${a.playId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-[150px] shrink-0 snap-center"
          >
            <Phone app={a} />
          </a>
        ))}
      </div>
    </>
  );
}
