"use client";

import { motion, useReducedMotion } from "motion/react";
import { HIDES } from "@/lib/wallet-leather";
import type { HideId, ThreadId } from "@/lib/wallet-leather";
import LeatherPanel from "./leather/LeatherPanel";

/**
 * Choosing the leather.
 *
 * Each swatch is the same component the wallet is built from, at swatch size —
 * a real piece of that hide, lit and grained, rather than a circle of its
 * average colour. That matters more here than it looks: the whole claim of this
 * feature is that the five skins are five materials, and a row of flat dots
 * says the opposite before anyone has clicked anything.
 *
 * Laid out as a low strip under the wallet rather than a grid of tiles. They
 * are a control, not a second gallery; the object above is the subject and
 * these should not compete with it for size.
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
        className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.26em]"
        style={{ color: "var(--wallet-fg-muted)" }}
      >
        The leather
      </p>
      <div
        role="radiogroup"
        aria-label="Wallet leather"
        className="flex flex-wrap items-stretch justify-center gap-2 sm:gap-3"
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
              className="group flex w-[104px] flex-col gap-2 rounded-xl p-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:w-[124px]"
              style={{
                background: on ? "var(--wallet-btn-bg)" : "transparent",
                boxShadow: on ? "inset 0 0 0 1px var(--wallet-icon-fg)" : "none",
              }}
              whileHover={reduced ? undefined : { y: -2 }}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <span
                className="relative block w-full overflow-hidden rounded-[7px]"
                style={{ aspectRatio: "16 / 9", boxShadow: "0 2px 7px rgba(0,0,0,0.45)" }}
              >
                <LeatherPanel
                  hide={h}
                  thread={thread}
                  w={160}
                  h={90}
                  radius={7}
                  seed={5}
                  className="absolute inset-0 h-full w-full"
                />
              </span>
              <span
                className="px-0.5 text-[10.5px] leading-tight"
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
