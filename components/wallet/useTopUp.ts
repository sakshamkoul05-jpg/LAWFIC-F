"use client";

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { checkTopUpAmount, formatPaise, MIN_TOPUP_PAISE } from "@/lib/money";

export const PRESETS = [100, 200, 500, 1000, 2000, 5000];

export type Phase = "idle" | "creating" | "checkout" | "confirming" | "landed" | "error";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

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

/**
 * The whole top-up lifecycle in one hook: amount selection, validation,
 * Razorpay order + checkout, then polling the balance API until the webhook
 * has landed the credit. The browser never asserts the balance — it asks.
 *
 * Shared by the balance home and the /wallet/topup page so the flow cannot
 * drift between the two.
 */
export function useTopUp(initialBalancePaise: number, paymentsReady: boolean) {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [balance, setBalance] = useState(initialBalancePaise);
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [credited, setCredited] = useState(0);

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

    router.refresh();
    setTimeout(() => setPhase("idle"), 2600);
  }

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

  return {
    balance,
    amount,
    setAmount,
    custom,
    setCustom,
    phase,
    message,
    credited,
    shownText,
    check,
    busy,
    paymentsReady,
    startTopUp,
    clearMessage: () => setMessage(""),
  };
}
