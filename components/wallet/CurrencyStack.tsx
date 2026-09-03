"use client";

import { AnimatePresence, motion } from "motion/react";
import { widthPct } from "@/lib/denominations";
import Banknote from "./Banknote";

/**
 * The notes in the bill compartment.
 *
 * They are FANNED, not stacked flush. A flush stack shows one note and a set of
 * coloured edges behind it, which is why the earlier version read as strips of
 * card: you could see that there was something there, but not what. Splaying
 * them into a staircase — each one a step lower and a shade in front of the one
 * behind — puts every denomination panel in view at once, so the wallet reads
 * as holding ₹500, ₹200, ₹100 and ₹50 rather than holding some paper.
 *
 * Largest at the back and highest, smallest at the front and lowest, which is
 * how a hand of notes actually sits when you thumb it open.
 *
 * Paper behaves like paper: it does not fly. Opening the wallet lets the fan
 * relax and settle a little deeper into the pocket, with a stagger down the
 * stack so the top note moves first. Nothing travels far and nothing spins.
 *
 * The transform origin is the BOTTOM of each note, because that is the end that
 * is held in the compartment. Rotating about the centre makes the whole fan
 * pivot in the air instead of splaying from a fixed point.
 */

export type CurrencyStackProps = {
  /** Largest first. Values must be real denominations. */
  notes: number[];
  /** Notes arriving from a confirmed credit, drawn after `notes`. */
  landing?: number[];
  open: boolean;
  still: boolean;
  className?: string;
  /** Lets the wallet fade the money in as it opens. */
  style?: React.CSSProperties;
};

export default function CurrencyStack({
  notes,
  landing = [],
  open,
  still,
  className = "",
  style,
}: CurrencyStackProps) {
  const all = [...notes, ...landing];
  const n = all.length;
  if (n === 0) return null;

  const mid = (n - 1) / 2;

  return (
    <div className={`pointer-events-none absolute ${className}`} style={style}>
      <AnimatePresence initial={false}>
        {all.map((value, i) => {
          const isLanding = i >= notes.length;
          /* Step down the staircase. Open, the fan closes up and drops into the
             pocket; shut, it is splayed and every denomination is legible. */
          const spread = open ? 0.45 : 1;
          const rise = (n - 1 - i) * 15 * spread;
          const tilt = (i - mid) * 2.4 * spread;
          const slide = (i - mid) * 1.6 * spread;

          return (
            <motion.div
              key={`${i}-${value}`}
              className="absolute bottom-0 left-1/2"
              style={{
                width: `${widthPct(value)}%`,
                zIndex: i + 1,
                transformOrigin: "50% 100%",
              }}
              initial={
                still
                  ? false
                  : isLanding
                    ? { x: "-50%", y: -190, rotate: 18, opacity: 0, scale: 0.94 }
                    : false
              }
              animate={{
                x: `calc(-50% + ${slide}%)`,
                y: `${-rise}%`,
                rotate: tilt,
                opacity: 1,
                scale: 1,
              }}
              transition={
                still
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: isLanding ? 180 : 130,
                      damping: isLanding ? 17 : 18,
                      mass: 0.8,
                      delay: isLanding ? 0 : i * 0.045,
                    }
              }
            >
              <Banknote
                value={value}
                className="block h-auto w-full"
                style={{
                  filter:
                    "drop-shadow(0 0.35cqw 0.5cqw rgba(0,0,0,0.55)) drop-shadow(0 0.1cqw 0.15cqw rgba(0,0,0,0.4))",
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
