"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Rupee tokens arcing up into the balance when a top-up lands.
 *
 * This plays only AFTER the money is confirmed in the ledger — never while the
 * user is choosing an amount or paying. Stillness belongs to the decision;
 * this is the receipt.
 *
 * Under `prefers-reduced-motion` it renders nothing at all. The balance still
 * updates and the statement still gains a row, so no information is carried
 * only by the movement.
 */
export default function CoinBurst({ playing }: { playing: boolean }) {
  const reduced = useReducedMotion();
  if (reduced || !playing) return null;

  // Deterministic spread, so the burst reads as designed rather than random.
  const coins = [
    { x: -86, delay: 0.00, size: 26, spin: -180 },
    { x: -52, delay: 0.06, size: 20, spin: 140 },
    { x: -22, delay: 0.13, size: 30, spin: -220 },
    { x: 8, delay: 0.03, size: 22, spin: 200 },
    { x: 38, delay: 0.10, size: 28, spin: -160 },
    { x: 70, delay: 0.17, size: 19, spin: 240 },
    { x: 96, delay: 0.08, size: 24, spin: -200 },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-3 h-56 overflow-hidden" aria-hidden>
      {coins.map((c, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 bottom-4"
          initial={{ x: c.x, y: 40, opacity: 0, scale: 0.4, rotate: 0 }}
          animate={{
            x: [c.x, c.x * 0.55, 0],
            y: [40, -70, -136],
            opacity: [0, 1, 1, 0],
            scale: [0.4, 1, 0.75],
            rotate: c.spin,
          }}
          transition={{
            duration: 1.05,
            delay: c.delay,
            ease: [0.22, 0.8, 0.3, 1],
            opacity: { duration: 1.05, delay: c.delay, times: [0, 0.15, 0.72, 1] },
          }}
        >
          <svg width={c.size} height={c.size} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="var(--color-brass-dim)" />
            <circle cx="16" cy="16" r="15" stroke="var(--color-brass)" strokeWidth="1.4" />
            <circle cx="16" cy="16" r="11" stroke="var(--color-brass-lo)" strokeWidth="0.9" />
            <text
              x="16"
              y="21.5"
              textAnchor="middle"
              fill="var(--color-brass-hi)"
              fontSize="15"
              fontFamily="var(--font-display)"
            >
              ₹
            </text>
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
