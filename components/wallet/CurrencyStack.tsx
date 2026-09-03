"use client";

import { AnimatePresence, motion } from "motion/react";
import { widthPct } from "@/lib/denominations";
import Banknote from "./Banknote";

/**
 * The notes in the bill compartment.
 *
 * Paper behaves like paper: it does not fly. Opening the wallet lets the stack
 * relax — each slip rises a little, rotates a little, and settles — with a
 * stagger down the stack so the top note moves first and the ones under it
 * follow. Nothing travels far, and nothing spins.
 *
 * TWO THINGS THAT LOOK LIKE STYLE AND ARE NOT
 *
 * z-index runs backwards down the stack, so the LOWEST note paints in FRONT.
 * In plain DOM order each note covers the one behind it, and since every note
 * but the topmost sits lower — and everything lower is behind the fold — a
 * stack of six renders as one cream slab. Ordering front-to-back is the
 * difference between a stack you can count and a rectangle.
 *
 * The offsets are derived from the stack size rather than fixed. A deposit can
 * put a dozen notes in on top of whatever is resting, and at a fixed per-note
 * offset that stack climbs straight off the top of the leather.
 */

export type CurrencyStackProps = {
  /** Largest first. Values must be real denominations. */
  notes: number[];
  /** Notes arriving from a confirmed credit, drawn after `notes`. */
  landing?: number[];
  open: boolean;
  still: boolean;
  className?: string;
};

export default function CurrencyStack({
  notes,
  landing = [],
  open,
  still,
  className = "",
}: CurrencyStackProps) {
  const all = [...notes, ...landing];
  const n = all.length;

  /* The stack always rises the same distance however many slips are in it. */
  const step = Math.min(5, 22 / Math.max(1, n - 1));
  const fan = (i: number) => (i % 2 ? 1 : -1) * (0.5 + Math.min(i, 6) * 0.34);
  const drift = (i: number) => ((i % 3) - 1) * 2.6;

  return (
    <div className={`pointer-events-none absolute ${className}`}>
      <AnimatePresence initial={false}>
        {all.map((value, i) => {
          const isLanding = i >= notes.length;
          /* Opening lets the stack breathe: a few px of rise and a touch more
             fan, largest at the top of the stack. */
          const relax = open ? 1 : 0;

          return (
            <motion.div
              key={`${i}-${value}`}
              className="absolute bottom-0 left-1/2"
              style={{ width: `${widthPct(value)}%`, zIndex: n - i }}
              initial={
                still
                  ? false
                  : isLanding
                    ? { x: "-50%", y: -210, rotate: (i % 2 ? 1 : -1) * 20, opacity: 0, scale: 0.94 }
                    : false
              }
              animate={{
                x: `calc(-50% + ${drift(i) + relax * (i % 2 ? 1.5 : -1.5)}px)`,
                y: -i * step - relax * (2 + i * 0.9),
                rotate: fan(i) * (1 + relax * 0.5),
                opacity: 1,
                scale: 1,
              }}
              transition={
                still
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: isLanding ? 190 : 150,
                      damping: isLanding ? 17 : 19,
                      mass: 0.7,
                      // Down the stack, so the top note moves first.
                      delay: isLanding ? 0 : (n - 1 - i) * 0.035,
                    }
              }
            >
              <Banknote
                value={value}
                className="block h-auto w-full"
                style={{ filter: "drop-shadow(0 0.25cqw 0.35cqw rgba(0,0,0,0.5))" }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
