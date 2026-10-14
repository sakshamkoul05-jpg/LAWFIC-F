"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * Small motion pieces shared by the Branding page. Every one of them goes
 * still under prefers-reduced-motion.
 */

/* ── the headline ──────────────────────────────────────────────────────── */

const LINE = ["Brands,", "built", "and", "shipped."];

export function KineticHeadline() {
  const reduced = !!useReducedMotion();
  let n = 0;
  return (
    <h1
      aria-label="Brands, built and shipped."
      className="relative max-w-5xl text-[clamp(2.6rem,7vw,5.6rem)] font-bold leading-[0.96] tracking-[-0.055em] text-foreground"
    >
      {LINE.map((word, w) => (
        <span key={word} className="relative mr-[0.22em] inline-block whitespace-nowrap" aria-hidden>
          {word.split("").map((ch) => {
            const i = n++;
            return (
              <motion.span
                key={`${word}-${i}`}
                className="inline-block"
                initial={reduced ? false : { y: "0.9em", opacity: 0, rotate: 8 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ delay: 0.15 + i * 0.035, type: "spring", stiffness: 420, damping: 24 }}
              >
                {ch}
              </motion.span>
            );
          })}

          {/* "built": a blueprint underline with tick marks, drawn after the word lands */}
          {w === 1 && (
            <svg className="absolute -bottom-[0.12em] left-0 h-[0.28em] w-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
              <motion.path
                d="M2 10 H98"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeDasharray="6 4"
                fill="none"
                initial={reduced ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.9, duration: 0.7, ease: "easeInOut" }}
              />
              {[2, 50, 98].map((x, k) => (
                <motion.path
                  key={x}
                  d={`M${x} 2 V18`}
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  initial={reduced ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.2 + k * 0.12, duration: 0.25 }}
                />
              ))}
            </svg>
          )}

          {/* "shipped.": a paper plane that takes off from the full stop */}
          {w === 3 && !reduced && (
            <motion.svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute -right-[0.15em] bottom-[0.1em] size-[0.42em] text-primary"
              initial={{ x: 0, y: 0, opacity: 0, rotate: -10 }}
              animate={{ x: [0, 40, 140, 260], y: [0, -30, -110, -200], opacity: [0, 1, 1, 0], rotate: [-10, -20, -28, -34] }}
              transition={{ delay: 1.6, duration: 2.2, ease: "easeIn", repeat: Infinity, repeatDelay: 5 }}
              aria-hidden
            >
              <path fill="currentColor" d="M2 11.5 21.5 3l-6.8 18.5-3.4-7.3L2 11.5Zm9.6 2.2 1.9 4 3.7-10-5.6 6Z" />
            </motion.svg>
          )}
        </span>
      ))}
    </h1>
  );
}

/* ── a soft spotlight that follows the cursor ─────────────────────────── */

export function Spotlight({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = !!useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const bg = useMotionTemplate`radial-gradient(520px circle at ${x}px ${y}px, var(--color-primary-light), transparent 65%)`;
  return (
    <div
      className={`relative ${className}`}
      onMouseMove={(e) => {
        if (reduced) return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
    >
      {!reduced && <motion.div className="pointer-events-none absolute inset-0" style={{ background: bg }} aria-hidden />}
      <div className="relative">{children}</div>
    </div>
  );
}

/* ── tilt toward the cursor ───────────────────────────────────────────── */

export function Tilt({ children, max = 6, className = "" }: { children: ReactNode; max?: number; className?: string }) {
  const reduced = !!useReducedMotion();
  const rx = useSpring(0, { stiffness: 160, damping: 18 });
  const ry = useSpring(0, { stiffness: 160, damping: 18 });
  return (
    <div
      className={`[perspective:1400px] ${className}`}
      onMouseMove={(e) => {
        if (reduced) return;
        const r = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 2 * max);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}>{children}</motion.div>
    </div>
  );
}

/* ── a button that leans toward the cursor ────────────────────────────── */

export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const reduced = !!useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, { stiffness: 260, damping: 16 });
  const y = useSpring(0, { stiffness: 260, damping: 16 });
  return (
    <motion.span
      ref={ref}
      className="inline-block"
      style={{ x, y }}
      onMouseMove={(e) => {
        if (reduced || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/* ── reading progress ─────────────────────────────────────────────────── */

export function ScrollProgress() {
  const reduced = !!useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  if (reduced) return null;
  return <motion.div className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-primary" style={{ scaleX }} aria-hidden />;
}

/* ── domains drifting across in outline type ──────────────────────────── */

export function DomainMarquee({ rows }: { rows: string[][] }) {
  const reduced = !!useReducedMotion();
  return (
    <div className="relative -mx-5 overflow-hidden py-4 sm:-mx-8 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]" aria-hidden>
      {rows.map((items, r) => (
        <div key={r} className="group flex w-max py-1">
          {[0, 1].map((copy) => (
            <motion.div
              key={copy}
              className="flex shrink-0 gap-12 pr-12"
              animate={reduced ? undefined : { x: r % 2 === 0 ? ["0%", "-100%"] : ["-100%", "0%"] }}
              transition={{ duration: 38 + r * 6, ease: "linear", repeat: Infinity }}
            >
              {items.map((d, i) => (
                <span
                  key={`${d}-${i}`}
                  className={`whitespace-nowrap text-[clamp(2.4rem,7vw,5.5rem)] font-bold leading-none tracking-[-0.05em] ${
                    i % 3 === 1 ? "text-primary" : "text-transparent [-webkit-text-stroke:1.5px_var(--color-foreground)] opacity-60"
                  }`}
                >
                  {d}
                </span>
              ))}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}
