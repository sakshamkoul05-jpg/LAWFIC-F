"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { load } from "@cashfreepayments/cashfree-js";

/* Cashfree session ids are opaque; this only refuses the obviously wrong —
   empty, oversized, or carrying characters that do not belong in one. */
const SESSION_RE = /^[A-Za-z0-9_\-.=]{10,400}$/;

export default function AppCheckout() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = params.get("s") ?? "";
    const mode = params.get("m") === "production" ? "production" : "sandbox";
    if (!SESSION_RE.test(session)) {
      setError("This payment link is not valid. Go back to the LAWFIC app and try again.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cashfree = await load({ mode });
        if (cancelled) return;
        if (!cashfree) throw new Error("no_sdk");
        /* _self: Cashfree takes over this page and, when the payment is done,
           comes back to the return URL the order was created with — the
           "done" page, which hands the customer back to the app. */
        const result = await cashfree.checkout({ paymentSessionId: session, redirectTarget: "_self" });
        if (result?.error) setError(result.error.message ?? "The payment could not start.");
      } catch {
        setError("The payment page could not load. Check your connection and try again from the app.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <img src="/lawfic-logo.png" alt="LAWFIC" width={96} height={87} />
      <h1 className="type-h2 mt-8 text-foreground">{error ? "Payment not started" : "Opening secure checkout…"}</h1>
      <p className="type-body mt-3 max-w-sm text-muted">
        {error ?? "You are paying LAWFIC through Cashfree. Your card or UPI details go to Cashfree, never to LAWFIC."}
      </p>
    </main>
  );
}
