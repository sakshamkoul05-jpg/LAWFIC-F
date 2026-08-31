"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPaise } from "@/lib/money";

/**
 * The centrepiece of the wallet home: a CRED-style dark glass card whose
 * balance counts up the moment the page loads. The count is decorative — the
 * real figure is the server-rendered value beneath it.
 */
export default function BalanceCard({
  balancePaise,
  entryCount,
}: {
  balancePaise: number;
  entryCount: number;
}) {
  const reduced = useReducedMotion();
  const shown = useMotionValue(balancePaise);
  const [shownText, setShownText] = useState(formatPaise(balancePaise));

  useEffect(() => {
    const unsub = shown.on("change", (v) => setShownText(formatPaise(Math.round(v))));
    return () => unsub();
  }, [shown]);

  useEffect(() => {
    if (reduced) {
      shown.set(balancePaise);
      return;
    }
    shown.set(0);
    const controls = animate(shown, balancePaise, {
      duration: 1.1,
      ease: [0.22, 0.8, 0.3, 1],
      delay: 0.2,
    });
    return () => controls.stop();
  }, [balancePaise, reduced, shown]);

  return (
    <div className="glass-panel wallet-card-glow relative overflow-hidden rounded-3xl p-7 sm:p-9">
      {/* soft gold glow behind the number */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(120% 100% at 50% 120%, rgba(212,175,55,0.18), transparent 70%)",
        }}
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f4f4ee]/50">
          Available balance
        </p>
        <p className="mt-3 font-display text-[54px] leading-none tabular-nums sm:text-[64px]">
          <span className="wallet-gold-text">{shownText}</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/wallet/topup"
            className="rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#0b0b0b] transition-all hover:bg-[#e8c86a] hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)]"
          >
            Add money
          </Link>
          <Link
            href="/wallet/transactions"
            className="rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-medium text-[#f4f4ee] transition-colors hover:bg-white/10"
          >
            {entryCount === 0 ? "View statement" : `Statement · ${entryCount}`}
          </Link>
        </div>
      </motion.div>

      <div className="wallet-hairline absolute inset-x-6 bottom-0 h-px" aria-hidden />
    </div>
  );
}
