"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

const deck = [
  { slug: "aadhaar", label: "Aadhaar", line: "XXXX XXXX 1234", meta: "Identity" },
  { slug: "pan", label: "PAN", line: "AAPFU 0939 F", meta: "Identity" },
  { slug: "gst", label: "GSTIN", line: "27AAPFU0939F1ZV", meta: "Tax" },
  { slug: "msme-udyam", label: "Udyam", line: "UDYAM-MH-26-0114592", meta: "Business" },
];

/** The four documents, fanned. Hovering one brings it forward. */
export default function HeroStack() {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[440px] sm:h-[340px]">
      {deck.map((d, i) => {
        const isUp = hover === i;
        const base = (i - 1.5) * 9;

        return (
          <motion.div
            key={d.slug}
            className="absolute inset-x-0 top-0 origin-bottom"
            style={{ zIndex: isUp ? 10 : i }}
            initial={reduced ? false : { opacity: 0, y: 60, rotate: 0 }}
            animate={{
              opacity: 1,
              y: i * 34 + (isUp ? -14 : 0),
              rotate: reduced ? 0 : base,
              scale: isUp ? 1.03 : 1,
            }}
            transition={{
              opacity: { duration: 0.5, delay: reduced ? 0 : 0.15 + i * 0.11 },
              y: { type: "spring", stiffness: 220, damping: 26, delay: reduced ? 0 : 0.15 + i * 0.11 },
              rotate: { duration: 0.6, delay: reduced ? 0 : 0.15 + i * 0.11 },
              scale: { duration: 0.3 },
            }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <Link
              href={`/services/${d.slug}`}
              className="group relative block overflow-hidden rounded-xl border border-border-2 bg-gradient-to-br from-surface-2 via-surface to-surface px-5 py-4 shadow-2xl shadow-black/70 transition-colors hover:border-primary/50"
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="label text-primary">{d.meta}</p>
                  <p className="mt-1 font-display text-[17px] tracking-[0.1em] text-foreground">
                    {d.label}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-[11.5px] tracking-[0.12em] text-muted tnum">
                  {d.line}
                </p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
