"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * The post-top-up celebration: rupee coins arcing up into the balance, a soft
 * gold confetti scatter, and a shine sweep across the card.
 *
 * Plays only AFTER the money is confirmed in the ledger — never while the user
 * is choosing an amount or paying. Under `prefers-reduced-motion` it renders
 * nothing; the balance still updates and the statement still gains a row, so no
 * information is carried only by the movement.
 */
export default function WalletCelebration({ playing }: { playing: boolean }) {
  const reduced = useReducedMotion();
  if (reduced || !playing) return null;

  const coins = [
    { x: -86, delay: 0.0, size: 26, spin: -180 },
    { x: -52, delay: 0.06, size: 20, spin: 140 },
    { x: -22, delay: 0.13, size: 30, spin: -220 },
    { x: 8, delay: 0.03, size: 22, spin: 200 },
    { x: 38, delay: 0.1, size: 28, spin: -160 },
    { x: 70, delay: 0.17, size: 19, spin: 240 },
    { x: 96, delay: 0.08, size: 24, spin: -200 },
  ];

  // Deterministic confetti spread, so it reads as designed rather than random.
  const confetti = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const dist = 130 + (i % 5) * 26;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.7 - 20,
      delay: 0.15 + (i % 6) * 0.05,
      rotate: (i % 2 === 0 ? 1 : -1) * (160 + i * 7),
      size: 5 + (i % 3) * 2,
    };
  });

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden
    >
      {/* Rupee coins */}
      {coins.map((c, i) => (
        <motion.div
          key={`coin-${i}`}
          className="absolute bottom-6 left-1/2"
          initial={{ x: c.x, y: 40, opacity: 0, scale: 0.4, rotate: 0 }}
          animate={{
            x: [c.x, c.x * 0.55, 0],
            y: [40, -80, -150],
            opacity: [0, 1, 1, 0],
            scale: [0.4, 1, 0.7],
            rotate: c.spin,
          }}
          transition={{
            duration: 1.05,
            delay: c.delay,
            ease: [0.22, 0.8, 0.3, 1],
            opacity: { duration: 1.05, delay: c.delay, times: [0, 0.15, 0.7, 1] },
          }}
        >
          <svg width={c.size} height={c.size} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="#6b5612" />
            <circle cx="16" cy="16" r="15" stroke="#d4af37" strokeWidth="1.4" />
            <circle cx="16" cy="16" r="11" stroke="#c79b2c" strokeWidth="0.9" />
            <text
              x="16"
              y="21.5"
              textAnchor="middle"
              fill="#f4e3a8"
              fontSize="15"
              fontFamily="var(--font-display)"
            >
              ₹
            </text>
          </svg>
        </motion.div>
      ))}

      {/* Gold confetti */}
      {confetti.map((p, i) => (
        <motion.span
          key={`conf-${i}`}
          className="absolute left-1/2 top-1/2 rounded-[2px] bg-[#e8c86a]"
          style={{ width: p.size, height: p.size * 2.2 }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [0, 1, 1, 0],
            rotate: p.rotate,
            scale: [0.6, 1, 0.8],
          }}
          transition={{ duration: 1.3, delay: p.delay, ease: "easeOut" }}
        />
      ))}

      {/* Shine sweep across the card */}
      <motion.div
        className="absolute inset-y-0 left-0 w-1/3"
        style={{
          background:
            "linear-gradient(100deg, transparent, rgba(255,255,255,0.28), transparent)",
        }}
        initial={{ x: "-120%" }}
        animate={{ x: "420%" }}
        transition={{ duration: 1.1, delay: 0.2, ease: [0.25, 0.6, 0.4, 1] }}
      />
    </div>
  );
}
