"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { formatPaise } from "@/lib/money";
import { getFlair, getSkin, type WalletPrefs } from "@/lib/wallet-custom";

export type CardPhase = "idle" | "forming" | "settled";

/**
 * The LAWFIC collector card — skeuomorphic physical card with gold chip,
 * layered depth, and material texture. Reveals itself like a card pulled
 * from a wallet, and morphs through top-up states (idle → forming → settled).
 *
 * Theme-aware: adapts shadows, text colors, and glow to light/dark via CSS
 * variables and skin definitions. All motion honours prefers-reduced-motion.
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
  const skin = getSkin(prefs.skin) ?? getSkin("gilded")!;
  const flairs = prefs.flairs.map(getFlair).filter(Boolean);

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

  const isLight = prefs.skin === "ivory";

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
        style={{ background: skin.bg }}
        animate={
          phase === "forming"
            ? { boxShadow: "0 30px 90px -28px rgba(212,175,55,0.55), inset 0 0 0 2px rgba(212,175,55,0.6)" }
            : phase === "settled"
              ? { scale: 1.015, boxShadow: "0 34px 90px -28px rgba(212,175,55,0.6), inset 0 1px 0 rgba(255,255,255,0.12)" }
              : { scale: 1, boxShadow: isLight
                  ? "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px -4px rgba(0,0,0,0.12), 0 24px 56px -12px rgba(0,0,0,0.18)"
                  : "0 30px 70px -30px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.08)"
              }
        }
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Material vein — subtle texture overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(120% 90% at 85% 0%, ${skin.vein}, transparent 60%)` }}
          aria-hidden
        />

        {/* Inner edge shadow for depth */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[1.25rem]"
          style={{
            boxShadow: isLight
              ? "inset 0 1px 3px rgba(0,0,0,0.06), inset 0 -1px 2px rgba(255,255,255,0.8)"
              : "inset 0 1px 3px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(255,255,255,0.05)",
          }}
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
          {/* Top row: chip + brand */}
          <div className="flex items-start justify-between">
            {/* Gold chip — raised, embossed */}
            <div className="relative">
              <div
                className="h-8 w-11 rounded-[6px]"
                style={{
                  background: "linear-gradient(135deg, #f0d678 0%, #d4af37 35%, #b8860b 70%, #8d6407 100%)",
                  boxShadow: isLight
                    ? "0 1px 3px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.5)"
                    : "0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)",
                }}
                aria-hidden
              >
                {/* Chip contacts — horizontal lines */}
                <div className="flex h-full flex-col justify-center gap-[3px] px-1.5">
                  <div className="h-px rounded-full" style={{ background: isLight ? "rgba(139,101,8,0.35)" : "rgba(139,101,8,0.6)" }} />
                  <div className="h-px rounded-full" style={{ background: isLight ? "rgba(139,101,8,0.35)" : "rgba(139,101,8,0.6)" }} />
                  <div className="h-px rounded-full" style={{ background: isLight ? "rgba(139,101,8,0.35)" : "rgba(139,101,8,0.6)" }} />
                </div>
              </div>
            </div>

            <span
              className="font-display text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: skin.accent }}
            >
              Wallet
            </span>
          </div>

          {/* Center: brand name */}
          <div className="flex-1 flex items-center">
            <span
              className="font-display text-[15px] font-semibold tracking-tight"
              style={{ color: skin.accent }}
            >
              LAWFiC
            </span>
          </div>

          {/* Bottom: balance + flairs */}
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: skin.accent }}
            >
              Total Balance
            </p>
            <p
              className="mt-1 font-display text-[clamp(26px,6vw,38px)] font-semibold leading-none tabular-nums"
              style={{
                color: isLight ? "#1c1a16" : "transparent",
                backgroundImage: isLight
                  ? undefined
                  : "linear-gradient(120deg,#e8c86a,#d4af37 45%,#f4e3a8 70%,#c79b2c)",
                WebkitBackgroundClip: isLight ? undefined : "text",
                backgroundClip: isLight ? undefined : "text",
              }}
            >
              {balanceLabel}
            </p>

            {/* Flairs row */}
            {flairs.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                {flairs.map((f, i) => (
                  <motion.span
                    key={f!.id}
                    initial={reduced ? false : { opacity: 0, y: 6, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.35 + i * 0.08 }}
                    title={f!.label}
                    aria-label={f!.label}
                    className="flex size-7 items-center justify-center rounded-full"
                    style={{
                      background: skin.accent,
                      color: isLight ? "#1c1a16" : "#17140c",
                      boxShadow: isLight
                        ? "0 1px 3px rgba(0,0,0,0.12)"
                        : "0 4px 12px -4px rgba(0,0,0,0.5)",
                    }}
                  >
                    <span className="h-3.5 w-3.5">{f!.glyph}</span>
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
