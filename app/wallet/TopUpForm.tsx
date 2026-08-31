"use client";

import { AnimatePresence, motion } from "motion/react";
import { formatPaise, MIN_TOPUP_PAISE } from "@/lib/money";
import WalletCelebration from "@/components/wallet/WalletCelebration";
import { PRESETS, useTopUp } from "@/components/wallet/useTopUp";

/**
 * The amount + complete UI for a top-up, in CRED-style dark glass. Driving the
 * whole lifecycle through `useTopUp` keeps this and the balance home consistent.
 */
export default function TopUpForm({
  initialBalancePaise,
  paymentsReady,
}: {
  initialBalancePaise: number;
  paymentsReady: boolean;
}) {
  const {
    amount,
    setAmount,
    custom,
    setCustom,
    phase,
    message,
    credited,
    balance,
    check,
    busy,
    startTopUp,
    clearMessage,
  } = useTopUp(initialBalancePaise, paymentsReady);

  const chosen = custom === "" ? amount : Number(custom);

  const select = (p: number) => {
    setAmount(p);
    setCustom("");
    clearMessage();
  };

  const label =
    phase === "creating"
      ? "Starting…"
      : phase === "checkout"
        ? "Complete the payment"
        : phase === "confirming"
          ? "Confirming your payment…"
          : check.ok
            ? `Add ₹${(check.paise / 100).toLocaleString("en-IN")}`
            : `Minimum ${formatPaise(MIN_TOPUP_PAISE)}`;

  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <WalletCelebration playing={phase === "landed"} />

      <AnimatePresence>
        {phase === "landed" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 mb-5 rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-5 py-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f4e3a8]">
              Top-up complete
            </p>
            <p className="mt-1 text-[14px] text-[#f4f4ee]">
              <span className="font-mono text-[#f4e3a8]">+ {formatPaise(credited)}</span> added.
              New balance{" "}
              <span className="font-mono text-[#f4f4ee]">{formatPaise(balance)}</span>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
        Add money
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {[...PRESETS, 10000].map((p) => {
          const active = custom === "" && amount === p;
          return (
            <button
              key={p}
              type="button"
              disabled={busy}
              onClick={() => select(p)}
              aria-pressed={active}
              className={`rounded-xl border px-3 py-3.5 font-mono text-[14px] tabular-nums transition-all disabled:opacity-40 ${
                active
                  ? "border-[#d4af37] bg-[#d4af37]/15 text-[#f4e3a8]"
                  : "border-white/10 bg-white/5 text-[#f4f4ee]/75 hover:border-[#d4af37]/50 hover:bg-white/10"
              }`}
            >
              ₹{p.toLocaleString("en-IN")}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 focus-within:border-[#d4af37]/70">
        <span className="font-mono text-[15px] text-[#f4e3a8]">₹</span>
        <input
          inputMode="numeric"
          placeholder="Or type your own amount"
          value={custom}
          disabled={busy}
          onChange={(e) => {
            setCustom(e.target.value.replace(/\D/g, "").slice(0, 7));
            clearMessage();
          }}
          className="w-full bg-transparent py-3.5 font-mono text-[15px] text-[#f4f4ee] outline-none placeholder:text-[#f4f4ee]/35 tabular-nums"
        />
      </div>

      {!check.ok && (custom !== "" || chosen > 0) && (
        <p className="mt-3 text-[12.5px] text-[#f4f4ee]/55">{check.error}</p>
      )}

      <button
        type="button"
        onClick={startTopUp}
        disabled={!check.ok || busy || !paymentsReady}
        className="mt-6 w-full rounded-full bg-[#d4af37] py-4 text-sm font-semibold text-[#0b0b0b] transition-all hover:bg-[#e8c86a] hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#f4f4ee]/40 disabled:shadow-none"
      >
        {label}
      </button>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-4 text-[13px] leading-relaxed ${
              phase === "error" ? "text-[#f2665f]" : "text-[#f4f4ee]/60"
            }`}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-center gap-4">
        {["UPI", "Card", "Net banking"].map((m) => (
          <span
            key={m}
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f4f4ee]/45"
          >
            {m}
          </span>
        ))}
      </div>

      {!paymentsReady && (
        <p className="mt-6 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-4 py-3 text-[12px] leading-relaxed text-[#f4f4ee]/70">
          Payments are not switched on yet. Add the Razorpay keys and top-ups go live — nothing
          else changes.
        </p>
      )}
    </div>
  );
}
