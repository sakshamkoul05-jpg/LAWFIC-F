"use client";

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { checkTopUpAmount, formatPaise, MIN_TOPUP_PAISE } from "@/lib/money";
import { load, type Cashfree } from "@cashfreepayments/cashfree-js";

export const PRESETS = [100, 200, 500, 1000, 2000, 5000];

export type Phase = "idle" | "creating" | "checkout" | "confirming" | "landed" | "error";

/**
 * The whole top-up lifecycle in one hook: amount selection, validation, the
 * Cashfree order and checkout, then polling the balance API until the WEBHOOK
 * has landed the credit. The browser never asserts the balance — it asks.
 *
 * Shared by the balance home and the /wallet/topup page so the flow cannot
 * drift between the two.
 *
 * WHY THE BALANCE IS STILL POLLED AND NOT READ FROM THE CHECKOUT RESULT
 *
 * `checkout()` resolves with a result that says the payment succeeded, and
 * believing it would be a mistake. That result is produced in the customer's
 * browser; the money is confirmed by a signed server-to-server webhook. Those
 * are different claims from different sources, and only one of them is the
 * reason a balance may move. So the browser waits to be TOLD the balance
 * changed rather than deciding it has.
 *
 * It also means the flow is correct when the two disagree: a customer who
 * closes the tab mid-payment is still credited, because the webhook does not
 * care whether anyone is watching.
 *
 * WHY `_modal` AND NOT `_self`
 *
 * `_self` navigates away to Cashfree's hosted page, which means leaving this
 * page — losing the amount, the animation, and the polling that makes the
 * credit land visibly. `_modal` keeps the customer here for card and netbanking
 * and hands off only for the methods that genuinely require a redirect (UPI
 * intent on a phone, some 3DS flows). Those come back through
 * /wallet/topup/return, which exists for exactly that path.
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
  /* Set only when the route says Cashfree needs a number this account does
     not have. The form renders a field; nothing else changes. */
  const [needsPhone, setNeedsPhone] = useState(false);

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

  async function startTopUp(phoneOverride?: string) {
    if (!check.ok || busy) return;
    setMessage("");
    setNeedsPhone(false);
    setPhase("creating");

    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rupees: chosen,
          ...(phoneOverride ? { phone: phoneOverride } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        /* Cashfree will not open an order without a mobile number, and some
           accounts have none — the profile has never required one. This is the
           route asking for it rather than failing, so the form can show one
           extra field instead of a dead end. */
        if (res.status === 422 && data.error === "phone_required") {
          setNeedsPhone(true);
          setPhase("idle");
          setMessage(data.message ?? "We need a mobile number for the payment receipt.");
          return;
        }

        setPhase("error");
        setMessage(
          data.message ??
            (data.error === "payments_not_configured"
              ? "Payments are not switched on yet."
              : "Could not start the payment. Try again.")
        );
        return;
      }

      let cashfree: Cashfree | null = null;
      try {
        cashfree = await load({ mode: data.mode === "production" ? "production" : "sandbox" });
      } catch {
        cashfree = null;
      }

      if (!cashfree) {
        setPhase("error");
        setMessage("Could not load the payment window. Check your connection and try again.");
        return;
      }

      const before = balance;
      setPhase("checkout");

      const result = await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal",
      });

      /* Handed off to a redirect. The customer is on their UPI app or their
         bank's page and will come back through /wallet/topup/return, so this
         tab must do nothing — least of all show an error. */
      if (result?.redirect) return;

      if (result?.error) {
        /* Closing the window resolves here too, with no payment attempted.
           Treated as "nothing happened" rather than as a failure, because
           telling somebody their payment failed when they simply changed their
           mind is how a wallet loses trust. */
        setPhase("idle");
        setMessage("");
        return;
      }

      /* Checkout says it is done. That is the cue to start ASKING the server,
         not to believe it. */
      waitForCredit(before);
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
    needsPhone,
    startTopUp,
    clearMessage: () => setMessage(""),
  };
}
