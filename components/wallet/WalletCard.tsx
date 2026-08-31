"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { formatPaise } from "@/lib/money";
import { getFlair, getSkin, type WalletPrefs } from "@/lib/wallet-custom";

export type CardPhase = "idle" | "forming" | "settled";

/**
 * The LAWFIC collector card: an ISO-proportioned card whose face is the
 * chosen skin (material), carrying the gold chip, the brand, the balance in
 * gilded figures, and up to three pinned flairs.
 *
 * It reveals itself like a card pulled from a wallet — rising and 3D
 * flip-setting into place — and it responds to the top-up state machine
 * (idle / forming / settled) so the money landing feels physical. All motion
 * honours prefers-reduced-motion.
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

  // Optional count-up for the balance figure (used on the wallet home).
  const shown = useMotionValue(balancePaise);
  const [shownText, setShownText] = useState(formatPaise(balancePaise));
  useEffect(() => {
    const unsub = shown.on("change", (v) => setShownText(formatPaise(Math.round(v))));
    return () => unsub();
  }, [shown]);
  useEffect(() => {
    if (!animateBalance) {
      shown.set(balancePaise);
      return;
    }
    if (reduced) {
      shown.set(balancePaise);
      return;
    }
    shown.set(0);
    const controls = animate(shown, balancePaise, {
      duration: 1.1,
      ease: [0.22, 0.8, 0.3, 1],
      delay: 0.45,
    });
    return () => controls.stop();
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
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-[22px]"
        style={{
          background: skin.bg,
          boxShadow:
            "0 30px 70px -30px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
        // State morph: a golden ring and pulse while a payment is forming, and
        // a gentle luminous lift once the money has settled in.
        animate={
          phase === "forming"
            ? { boxShadow: "0 30px 90px -28px rgba(212,175,55,0.55), inset 0 0 0 2px rgba(212,175,55,0.6)" }
            : phase === "settled"
              ? { scale: 1.015, boxShadow: "0 34px 90px -28px rgba(212,175,55,0.6), inset 0 1px 0 rgba(255,255,255,0.12)" }
              : { scale: 1, boxShadow: "0 30px 70px -30px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.08)" }
        }
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* soft material vein */}
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(120% 90% at 85% 0%, ${skin.vein}, transparent 60%)` }} aria-hidden />

        {/* shine that sweeps once on settle */}
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

        {/* card content */}
        <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <span className="font-display text-[15px] font-semibold tracking-tight" style={{ color: skin.accent }}>
              LAWFiC
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: skin.accent }}>
              Wallet
            </span>
          </div>

          {/* Gold chip */}
          <div className="h-7 w-10 rounded-md" style={{ background: "linear-gradient(135deg,#e8c86a,#b8860b 60%,#8d6407)" }} aria-hidden>
            <div className="m-0.5 h-[calc(100%-4px)] w-[calc(100%-4px)] rounded-[3px] border border-[#6b5612]/50" />
          </div>

          {/* Balance — gilded figures on dark skins, ink on ivory */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: skin.accent }}>
              Available balance
            </p>
            <p
              className="mt-1 font-display text-[clamp(26px,6vw,38px)] font-semibold leading-none tabular-nums"
              style={{
                color:
                  prefs.skin === "ivory"
                    ? "#1c1a16"
                    : "transparent",
                backgroundImage:
                  prefs.skin === "ivory"
                    ? undefined
                    : "linear-gradient(120deg,#e8c86a,#d4af37 45%,#f4e3a8 70%,#c79b2c)",
                WebkitBackgroundClip: prefs.skin === "ivory" ? undefined : "text",
                backgroundClip: prefs.skin === "ivory" ? undefined : "text",
              }}
            >
              {balanceLabel}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Flairs — pinned along the bottom edge of the card face */}
      <AnimatePresence>
        {flairs.length > 0 && (
          <div className="absolute -bottom-3 left-5 right-5 flex items-center gap-2">
            {flairs.map((f, i) => (
              <motion.span
                key={f!.id}
                initial={reduced ? false : { opacity: 0, y: 8, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.35 + i * 0.08 }}
                title={f!.label}
                aria-label={f!.label}
                className="flex size-8 items-center justify-center rounded-full text-[#17140c]"
                style={{ background: skin.accent, boxShadow: "0 8px 20px -8px rgba(0,0,0,0.6)" }}
              >
                <span className="h-4 w-4">{f!.glyph}</span>
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
