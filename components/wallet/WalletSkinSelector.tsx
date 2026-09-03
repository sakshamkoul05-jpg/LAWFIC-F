"use client";

import { motion, useReducedMotion } from "motion/react";
import { HIDES } from "@/lib/wallet-leather";
import type { HideId, ThreadId } from "@/lib/wallet-leather";
import LeatherPanel from "./leather/LeatherPanel";

/**
 * Choosing the leather.
 *
 * The swatches are the same component the wallet is built from, at swatch size
 * — so each one is a real piece of that hide, lit and grained, rather than a
 * circle of its average colour. That matters here more than it looks: the whole
 * claim of this feature is that the five skins are five materials, and a row of
 * flat dots quietly says the opposite.
 */

export default function WalletSkinSelector({
  value,
  thread,
  onChange,
  className = "",
}: {
  value: HideId;
  thread: ThreadId;
  onChange: (id: HideId) => void;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div className={className}>
      <p
        className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.24em]"
        style={{ color: "var(--wallet-fg-muted)" }}
      >
        The leather
      </p>
      <div
        role="radiogroup"
        aria-label="Wallet leather"
        className="flex flex-wrap items-start justify-center gap-2.5 sm:gap-3"
      >
        {HIDES.map((h) => {
          const on = value === h.id;
          return (
            <motion.button
              key={h.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(h.id)}
              title={h.desc}
              className="group flex w-[58px] flex-col items-center gap-1.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:w-[66px]"
              whileHover={reduced ? undefined : { y: -3 }}
              whileTap={reduced ? undefined : { scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <span
                className="relative block w-full overflow-hidden rounded-[9px]"
                style={{
                  aspectRatio: "1 / 1",
                  boxShadow: on
                    ? `0 0 0 2px var(--wallet-icon-fg), 0 6px 14px rgba(0,0,0,0.45)`
                    : `0 3px 9px rgba(0,0,0,0.4)`,
                }}
              >
                <LeatherPanel
                  hide={h}
                  thread={thread}
                  w={90}
                  h={90}
                  radius={9}
                  seed={5}
                  className="absolute inset-0 h-full w-full"
                />
              </span>
              <span
                className="text-center text-[10.5px] leading-tight"
                style={{
                  color: on ? "var(--wallet-fg)" : "var(--wallet-fg-muted)",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {h.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
