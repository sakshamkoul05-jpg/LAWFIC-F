"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Does IntersectionObserver actually deliver callbacks here?
 *
 * Run once per page, lazily, and shared by every Reveal on it. The API being
 * present is not the same as it working: it can be stubbed, throttled to
 * nothing, or simply never fire in some embedded and automated contexts. A
 * plain feature check (`"IntersectionObserver" in window`) would pass in all
 * of those cases and still leave the page blank.
 *
 * So this observes a real, attached, on-screen element and waits to be called.
 * Resolves true if the callback arrives, false if it does not.
 */
let observerProbe: Promise<boolean> | null = null;

function probeObserver(): Promise<boolean> {
  if (observerProbe) return observerProbe;

  observerProbe = new Promise<boolean>((resolve) => {
    if (typeof IntersectionObserver !== "function") return resolve(false);

    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(probe);

    let settled = false;
    const finish = (works: boolean) => {
      if (settled) return;
      settled = true;
      io.disconnect();
      probe.remove();
      resolve(works);
    };

    const io = new IntersectionObserver(() => finish(true));
    io.observe(probe);
    setTimeout(() => finish(false), 900);
  });

  return observerProbe;
}

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
 * Two escape hatches, and neither of them weakens the effect where it works:
 * `prefers-reduced-motion` renders plainly, and so does an environment where
 * the observer has been shown not to fire.
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
  const [observerBroken, setObserverBroken] = useState(false);

  useEffect(() => {
    let alive = true;
    probeObserver().then((works) => {
      if (alive && !works) setObserverBroken(true);
    });
    return () => {
      alive = false;
    };
  }, []);

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
