"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { formatPaise, MIN_TOPUP_PAISE } from "@/lib/money";
import PhysicalWallet from "@/components/wallet/PhysicalWallet";
import type { WalletPrefs } from "@/lib/wallet-custom";
import { PRESETS, useTopUp } from "@/components/wallet/useTopUp";
import { useWalletConfig } from "@/components/wallet/useWalletConfig";
import AddedCelebration from "@/components/wallet/AddedCelebration";
import WalletStage from "@/components/wallet3d/WalletStage";
import { breakIntoNotes } from "@/lib/wallet3d/banknote";

export default function TopUpForm({
  initialBalancePaise,
  paymentsReady,
  look,
}: {
  initialBalancePaise: number;
  paymentsReady: boolean;
  look: WalletPrefs;
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

  const { config } = useWalletConfig(look.nameplate);

  /* The flight and the tick are driven by `credited`, which is the amount the
     SERVER confirmed, never the amount that was typed. A payment can fail
     after the checkout window closes, and a green tick over money that never
     reached the ledger is the worst thing this screen could do. */
  const [arriving, setArriving] = useState(0);
  const [celebrate, setCelebrate] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== "landed" || credited <= 0) return;
    /* A token, not a flag: two top-ups in a row would both set a boolean true
       and the second would land in silence. */
    setArriving((n) => n + 1);
    setCelebrate(credited);
  }, [phase, credited]);

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
      {/* The wallet, above the form, and the SAME object as the wallet page —
          same stored configuration, same model. A wallet that changed material
          when you went to add money would be two wallets.

          It is perfectly still while an amount is being entered and paid: the
          standing rule that nothing animates on a screen where money is being
          committed. Notes fly only once `landed` says the credit is in the
          ledger, so what you watch is a fact rather than a hope. */}
      <div className="relative z-10 mb-8">
        <WalletStage
          config={config}
          open={0}
          arriving={arriving}
          notes={breakIntoNotes(balance)}
          fallback={
            <PhysicalWallet
              hide={look.hide}
              plate={look.plate}
              thread={look.thread}
              nameplate={look.nameplate}
              balancePaise={balance}
            />
          }
        />
      </div>

      <AddedCelebration paise={celebrate} onDone={() => setCelebrate(null)} />

      <AnimatePresence>
        {phase === "landed" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 mb-5 rounded-xl border border-success/20 bg-success/10 px-4 py-3"
          >
            <p className="text-[11px] font-medium text-success">
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
                background: active ? "var(--brand)" : "var(--wallet-btn-bg)",
                color: active ? "#ffffff" : "var(--wallet-fg)",
              }}
            >
              ₹{p.toLocaleString("en-IN")}
            </button>
          );
        })}
      </div>

      <div
        className="mt-3 flex items-center gap-2 rounded-xl border px-3.5 focus-within:ring-1 focus-within:ring-primary/40"
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
        className="mt-5 w-full rounded-full bg-primary py-3.5 text-[13px] font-medium text-background transition-all duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-30"
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
