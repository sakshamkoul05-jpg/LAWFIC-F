"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { checkTopUpAmount, formatPaise, MIN_TOPUP_PAISE } from "@/lib/money";
import CoinBurst from "./CoinBurst";

const PRESETS = [500, 1000, 2000, 5000];

type Phase = "idle" | "creating" | "checkout" | "confirming" | "landed" | "error";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/** Loads Checkout once, on first use rather than on every page view. */
function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export default function WalletPanel({
  initialBalancePaise,
  paymentsReady,
}: {
  initialBalancePaise: number;
  paymentsReady: boolean;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [balance, setBalance] = useState(initialBalancePaise);
  const [amount, setAmount] = useState(2000);
  const [custom, setCustom] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [credited, setCredited] = useState(0);

  // The displayed figure is a motion value so it can count rather than jump.
  const shown = useMotionValue(initialBalancePaise);
  const [shownText, setShownText] = useState(formatPaise(initialBalancePaise));
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = shown.on("change", (v) => setShownText(formatPaise(Math.round(v))));
    return () => unsub();
  }, [shown]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const chosen = custom === "" ? amount : Number(custom);
  const check = checkTopUpAmount(chosen);
  const busy = phase === "creating" || phase === "checkout" || phase === "confirming";

  /** Counts the figure up, fires the burst, and refreshes the statement. */
  function land(newBalance: number) {
    const gained = newBalance - balance;
    setBalance(newBalance);
    setCredited(gained);
    setPhase("landed");

    if (reduced) {
      shown.set(newBalance);
    } else {
      animate(shown, newBalance, { duration: 1.1, ease: [0.22, 0.8, 0.3, 1] });
    }

    // Bring the new ledger row into the statement below.
    router.refresh();
    setTimeout(() => setPhase("idle"), 2600);
  }

  /** Waits for the webhook. The browser never asserts the balance — it asks. */
  function waitForCredit(before: number) {
    setPhase("confirming");
    let tries = 0;

    pollTimer.current = setInterval(async () => {
      tries += 1;
      try {
        const res = await fetch("/api/wallet/balance", { cache: "no-store" });
        if (res.ok) {
          const { balancePaise } = (await res.json()) as { balancePaise: number };
          if (balancePaise > before) {
            if (pollTimer.current) clearInterval(pollTimer.current);
            land(balancePaise);
            return;
          }
        }
      } catch {
        // A dropped poll is not a failure; the next one will do.
      }

      if (tries >= 20) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setPhase("error");
        setMessage(
          "Your payment went through, but the balance has not updated yet. It usually lands within a minute — refresh this page shortly."
        );
      }
    }, 1500);
  }

  async function startTopUp() {
    if (!check.ok || busy) return;
    setMessage("");
    setPhase("creating");

    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rupees: chosen }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPhase("error");
        setMessage(
          data.message ??
            (data.error === "payments_not_configured"
              ? "Payments are not switched on yet."
              : "Could not start the payment. Try again.")
        );
        return;
      }

      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        setPhase("error");
        setMessage("Could not load the payment window. Check your connection and try again.");
        return;
      }

      const before = balance;
      setPhase("checkout");

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amountPaise,
        currency: data.currency,
        name: "LAWFIC",
        description: "Wallet top-up",
        theme: { color: "#b8860b", backdrop_color: "#f8f9fa" },
        prefill: { email: data.email, contact: data.phone },
        handler: () => waitForCredit(before),
        modal: {
          ondismiss: () => {
            setPhase("idle");
            setMessage("");
          },
        },
      });

      rzp.open();
    } catch {
      setPhase("error");
      setMessage("Something went wrong starting the payment. Try again.");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
      <CoinBurst playing={phase === "landed"} />

      {/* balance */}
      <div className="relative border-b border-border px-6 py-6">
        {/* primary sweep when money lands */}
        <AnimatePresence>
          {phase === "landed" && !reduced && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, times: [0, 0.3, 1] }}
              style={{
                background:
                  "radial-gradient(120% 90% at 50% 100%, rgba(184,134,11,0.16), transparent 70%)",
              }}
              aria-hidden
            />
          )}
        </AnimatePresence>

        <div className="relative z-2 flex items-start justify-between gap-4">
          <div>
            <p className="label text-muted">Available balance</p>
            <p className="mt-2 font-display text-[42px] leading-none text-foreground tabular-nums">{shownText}</p>
          </div>

          <AnimatePresence>
            {phase === "landed" && credited > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="rounded-full border border-success/30 bg-success-light px-3 py-1 font-mono text-[13px] text-success tabular-nums"
              >
                + {formatPaise(credited)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* This is a live region so the outcome reaches a screen reader too. */}
        <p className="sr-only" role="status" aria-live="polite">
          {phase === "landed"
            ? `Top-up complete. ${formatPaise(credited)} added. New balance ${formatPaise(balance)}.`
            : phase === "confirming"
              ? "Payment received, confirming your balance."
              : ""}
        </p>
      </div>

      {/* top-up */}
      <div className="relative z-2 p-6">
        <p className="label mb-3 text-muted">Add money</p>

        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={busy}
              onClick={() => { setAmount(p); setCustom(""); setMessage(""); }}
              className={`rounded border py-3 font-mono text-[14px] transition-colors tabular-nums disabled:opacity-50 ${
                custom === "" && amount === p
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border bg-surface-2 text-muted hover:border-border-2"
              }`}
            >
              ₹{p.toLocaleString("en-IN")}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded border border-border bg-surface-2 px-3 focus-within:border-primary">
          <span className="font-mono text-[14px] text-muted">₹</span>
          <input
            inputMode="numeric"
            placeholder="Other amount"
            value={custom}
            disabled={busy}
            onChange={(e) => { setCustom(e.target.value.replace(/\D/g, "").slice(0, 7)); setMessage(""); }}
            className="w-full bg-transparent py-3 font-mono text-[14px] text-foreground outline-none placeholder:text-subtle tabular-nums"
          />
        </div>

        {!check.ok && (custom !== "" || chosen > 0) && (
          <p className="mt-3 text-[12.5px] text-subtle">{check.error}</p>
        )}

        <button
          type="button"
          onClick={startTopUp}
          disabled={!check.ok || busy || !paymentsReady}
          className="mt-5 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle"
        >
          {phase === "creating" && "Starting…"}
          {phase === "checkout" && "Complete the payment"}
          {phase === "confirming" && "Confirming your payment…"}
          {(phase === "idle" || phase === "landed" || phase === "error") &&
            (check.ok ? `Add ₹${(check.paise / 100).toLocaleString("en-IN")}` : `Minimum ${formatPaise(MIN_TOPUP_PAISE)}`)}
        </button>

        {message && (
          <p className={`mt-4 text-[13px] leading-relaxed ${phase === "error" ? "text-destructive" : "text-muted"}`}>
            {message}
          </p>
        )}

        <div className="mt-5 flex items-center justify-center gap-3">
          {["UPI", "Card", "Net banking"].map((m) => (
            <span key={m} className="label text-subtle">{m}</span>
          ))}
        </div>
      </div>

      {!paymentsReady && (
        <p className="border-t border-border bg-surface-2 px-6 py-3.5 text-[11.5px] leading-relaxed text-subtle">
          Payments are not switched on yet. Add the Razorpay keys and top-ups go live —
          nothing else changes.
        </p>
      )}
    </div>
  );
}
