"use client";

import { motion, useReducedMotion } from "motion/react";
import { useObserverBroken } from "@/lib/use-in-view-safe";

/**
 * A restrained scroll reveal. Used for structure, not for decoration.
 *
 * These wrappers carry real content — headings, fees, document lists — not
 * ornament, so the animation is never allowed to decide whether the text
 * exists. `whileInView` holds its children at opacity 0 until an observer
 * callback fires, which means anything that stops that callback leaves a
 * permanently blank page rather than an unanimated one. Content degrades to
 * visible, never to absent.
 *
 * Two escape hatches, and neither weakens the effect where it works:
 * `prefers-reduced-motion` renders plainly, and so does an environment where
 * the observer has been shown not to fire. The probe behind that second one
 * is shared with the signature animations — see lib/use-in-view-safe.ts.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 16,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const observerBroken = useObserverBroken();

  if (reduced || observerBroken) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
