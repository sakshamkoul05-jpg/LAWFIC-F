"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

/**
 * The confirmation that money landed: a tick, then the amount.
 *
 * ORDER MATTERS, AND IT IS THE TICK FIRST
 *
 * The tick answers "did it work?" and the figure answers "how much?", and
 * nobody asks the second question until the first is settled. Showing them
 * together makes the viewer read two things at once and trust neither; drawing
 * the tick and then bringing the amount up under it answers them in the order
 * they are asked. The tick is STROKED rather than faded in for the same
 * reason — a line being drawn reads as something completing, where an opacity
 * ramp reads as something appearing.
 *
 * IT ONLY EVER SHOWS A FACT
 *
 * This is mounted from the credit that the server confirmed, never from the
 * amount the customer typed. A payment can fail after checkout closes, and a
 * green tick over a figure that never reached the ledger is the worst thing
 * this component could do. Its caller waits for the balance to move.
 *
 * The overlay is dismissible by click, by Escape and by a timer, because a
 * modal that owns the screen on a money page must always have three ways out.
 */

const HOLD_MS = 2400;

export default function AddedCelebration({
  paise,
  onDone,
}: {
  /** The credit, in paise. Null when nothing is being announced. */
  paise: number | null;
  onDone: () => void;
}) {
  const reduced = useReducedMotion();
  const open = paise !== null;

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onDone, HOLD_MS);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onDone();
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [open, onDone]);

  const rupees = ((paise ?? 0) / 100).toLocaleString("en-IN", {
    maximumFractionDigits: (paise ?? 0) % 100 === 0 ? 0 : 2,
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          onClick={onDone}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[120] grid place-items-center px-6"
          style={{
            background: "color-mix(in oklab, var(--color-background) 74%, transparent)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <div className="flex flex-col items-center text-center">
            {/* THE TICK */}
            <motion.svg
              width="164"
              height="164"
              viewBox="0 0 132 132"
              fill="none"
              aria-hidden
              initial={reduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.04 }}
            >
              <circle cx="66" cy="66" r="58" fill="var(--color-success, #2f9e63)" opacity="0.12" />
              <motion.circle
                cx="66"
                cy="66"
                r="58"
                stroke="var(--color-success, #2f9e63)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
                style={{ rotate: -90, transformOrigin: "66px 66px" }}
              />
              <motion.path
                d="M43 68 L59 84 L90 50"
                stroke="var(--color-success, #2f9e63)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.34, ease: [0.65, 0, 0.35, 1], delay: 0.3 }}
              />
            </motion.svg>

            {/* THE AMOUNT */}
            <motion.p
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.52 }}
              className="mt-8 font-mono text-[clamp(44px,10vw,76px)] font-semibold leading-none tabular-nums"
              style={{ color: "var(--wallet-fg, var(--color-foreground))" }}
            >
              <span aria-hidden>₹</span>
              <span className="sr-only">Rupees </span>
              {rupees}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.68, duration: 0.3 }}
              className="mt-5 font-mono text-[11px] uppercase tracking-[0.3em]"
              style={{ color: "var(--wallet-fg-muted, var(--color-muted))" }}
            >
              Added to your wallet
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
