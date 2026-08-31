"use client";

import { AnimatePresence, motion } from "motion/react";
import { formatPaise, MIN_TOPUP_PAISE } from "@/lib/money";
import WalletCelebration from "@/components/wallet/WalletCelebration";
import { PRESETS, useTopUp } from "@/components/wallet/useTopUp";

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
          ? "Confirming…"
          : check.ok
            ? `Add ₹${(check.paise / 100).toLocaleString("en-IN")}`
            : `Minimum ${formatPaise(MIN_TOPUP_PAISE)}`;

  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ color: "var(--wallet-fg)" }}>
      <WalletCelebration playing={phase === "landed"} />

      <AnimatePresence>
        {phase === "landed" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 mb-5 rounded-xl border border-[#34c759]/20 bg-[#34c759]/8 px-4 py-3"
          >
            <p className="text-[11px] font-medium text-[#34c759]">
              + {formatPaise(credited)} added. New balance {formatPaise(balance)}.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
        Add money
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[...PRESETS, 10000].map((p) => {
          const active = custom === "" && amount === p;
          return (
            <button
              key={p}
              type="button"
              disabled={busy}
              onClick={() => select(p)}
              aria-pressed={active}
              className="rounded-xl px-3 py-3 font-mono text-[13px] tabular-nums transition-all duration-200 disabled:opacity-30"
              style={{
                background: active ? "#5856d6" : "var(--wallet-btn-bg)",
                color: active ? "#ffffff" : "var(--wallet-fg)",
              }}
            >
              ₹{p.toLocaleString("en-IN")}
            </button>
          );
        })}
      </div>

      <div
        className="mt-3 flex items-center gap-2 rounded-xl border px-3.5 focus-within:ring-1 focus-within:ring-[#5856d6]/40"
        style={{ borderColor: "var(--wallet-input-border)", background: "var(--wallet-input-bg)" }}
      >
        <span className="font-mono text-[14px] opacity-40">₹</span>
        <input
          inputMode="numeric"
          placeholder="Or type your own amount"
          value={custom}
          disabled={busy}
          onChange={(e) => {
            setCustom(e.target.value.replace(/\D/g, "").slice(0, 7));
            clearMessage();
          }}
          className="w-full bg-transparent py-3 font-mono text-[14px] outline-none placeholder:opacity-30 tabular-nums"
          style={{ color: "var(--wallet-input-text)" }}
        />
      </div>

      {!check.ok && (custom !== "" || chosen > 0) && (
        <p className="mt-2 text-[12px]" style={{ color: "var(--wallet-fg-muted)" }}>{check.error}</p>
      )}

      <button
        type="button"
        onClick={startTopUp}
        disabled={!check.ok || busy || !paymentsReady}
        className="mt-5 w-full rounded-full bg-[#5856d6] py-3.5 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#4a49b8] disabled:cursor-not-allowed disabled:opacity-30"
      >
        {label}
      </button>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 text-[12px] leading-relaxed ${phase === "error" ? "text-[#ff3b30]" : ""}`}
            style={phase !== "error" ? { color: "var(--wallet-fg-muted)" } : undefined}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-5 flex items-center justify-center gap-4">
        {["UPI", "Card", "Net banking"].map((m) => (
          <span key={m} className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-30">
            {m}
          </span>
        ))}
      </div>

      {!paymentsReady && (
        <p className="mt-5 rounded-xl border px-4 py-3 text-[12px] leading-relaxed opacity-60"
          style={{ borderColor: "var(--wallet-input-border)", background: "var(--wallet-btn-bg)" }}
        >
          Payments are not switched on yet.
        </p>
      )}
    </div>
  );
}
