"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { formatPaise } from "@/lib/money";
import { getCardType, type WalletPrefs } from "@/lib/wallet-custom";
import DiceBearAvatar from "./DiceBearAvatar";

export type CardPhase = "idle" | "forming" | "settled";

/**
 * The LAWFIC collector card — physical card with layered depth, material
 * texture, and a DiceBear avatar. Each card type has its own gradient,
 * accent, and chip style. Reveals itself like a card pulled from a wallet
 * and morphs through top-up states.
 *
 * All motion honours prefers-reduced-motion.
 */
export default function WalletCard({
  prefs,
  balancePaise,
  phase = "idle",
  animateBalance = false,
  className = "",
}: {
  prefs: WalletPrefs;
  balancePaise: number;
  phase?: CardPhase;
  animateBalance?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ct = getCardType(prefs.cardType) ?? getCardType("standard")!;

  const shown = useMotionValue(balancePaise);
  const [shownText, setShownText] = useState(formatPaise(balancePaise));
  useEffect(() => {
    const unsub = shown.on("change", (v) => setShownText(formatPaise(Math.round(v))));
    return () => unsub();
  }, [shown]);
  useEffect(() => {
    if (!animateBalance || reduced) { shown.set(balancePaise); return; }
    shown.set(0);
    const c = animate(shown, balancePaise, { duration: 1.1, ease: [0.22, 0.8, 0.3, 1], delay: 0.45 });
    return () => c.stop();
  }, [balancePaise, animateBalance, reduced, shown]);
  const balanceLabel = animateBalance ? shownText : formatPaise(balancePaise);

  return (
    <motion.div
      className={`relative aspect-[1.586] w-full max-w-md select-none ${className}`}
      style={{ perspective: 1600 }}
      initial={reduced ? false : { opacity: 0, y: 60, rotateX: -24, rotateY: -6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 18, mass: 1 }}
    >
      {/* Card body */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-[1.25rem]"
        style={{ background: ct.gradient }}
        animate={
          phase === "forming"
            ? { boxShadow: `0 30px 90px -28px ${ct.accent}55, inset 0 0 0 2px ${ct.accent}60` }
            : phase === "settled"
              ? { scale: 1.015, boxShadow: `0 34px 90px -28px ${ct.accent}60, inset 0 1px 0 ${ct.accent}18` }
              : { scale: 1, boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px -4px rgba(0,0,0,0.12), 0 24px 56px -12px rgba(0,0,0,0.18)" }
        }
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Material vein — subtle texture overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(120% 90% at 85% 0%, ${ct.accent}12, transparent 60%)` }}
          aria-hidden
        />

        {/* Inner edge shadow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[1.25rem]"
          style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12), inset 0 -1px 2px rgba(255,255,255,0.08)" }}
          aria-hidden
        />

        {/* Shine sweep on settle */}
        <AnimatePresence>
          {phase === "settled" && !reduced && (
            <motion.div
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
              style={{ background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.22), transparent)" }}
              initial={{ x: "-120%" }}
              animate={{ x: "420%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
              aria-hidden
            />
          )}
        </AnimatePresence>

        {/* Card content */}
        <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
          {/* Top row: chip + card type label */}
          <div className="flex items-start justify-between">
            {/* Chip */}
            <div
              className="h-8 w-11 rounded-[6px]"
              style={{
                background: ct.chipGradient,
                boxShadow: "0 2px 6px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.2)",
              }}
              aria-hidden
            >
              <div className="flex h-full flex-col justify-center gap-[3px] px-1.5">
                <div className="h-px rounded-full" style={{ background: "rgba(0,0,0,0.25)" }} />
                <div className="h-px rounded-full" style={{ background: "rgba(0,0,0,0.25)" }} />
                <div className="h-px rounded-full" style={{ background: "rgba(0,0,0,0.25)" }} />
              </div>
            </div>
            <span
              className="font-display text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: ct.accent }}
            >
              {ct.name}
            </span>
          </div>

          {/* Center: avatar + brand */}
          <div className="flex flex-1 items-center gap-4">
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.2 }}
              className="rounded-full"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
            >
              <DiceBearAvatar seed={prefs.avatarSeed} size={56} />
            </motion.div>
            <div>
              <span
                className="font-display text-[15px] font-semibold tracking-tight"
                style={{ color: ct.accent }}
              >
                LAWFiC
              </span>
              <p className="text-[10px]" style={{ color: ct.accentSub }}>
                {prefs.cardType === "advocate" ? "Advocate" : prefs.cardType === "business" ? "Business" : prefs.cardType === "student" ? "Student" : "Member"}
              </p>
            </div>
          </div>

          {/* Bottom: balance */}
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: ct.accentSub }}
            >
              Total Balance
            </p>
            <p
              className="mt-1 font-display text-[clamp(26px,6vw,38px)] font-semibold leading-none tabular-nums"
              style={{ color: ct.accent }}
            >
              {balanceLabel}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
