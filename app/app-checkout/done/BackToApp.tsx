"use client";

import { useEffect } from "react";

/** Hands the customer back to the app through its lawfic:// link. */
export default function BackToApp({ orderId }: { orderId: string | null }) {
  const href = `lawfic://wallet${orderId ? `?topup=${encodeURIComponent(orderId)}` : ""}`;

  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = href;
    }, 400);
    return () => clearTimeout(t);
  }, [href]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <img src="/lawfic-logo.png" alt="LAWFIC" width={96} height={87} />
      <h1 className="type-h2 mt-8 text-foreground">Back to the LAWFIC app</h1>
      <p className="type-body mt-3 max-w-sm text-muted">
        The app is checking your payment with Cashfree. If it does not open by itself, tap below — or simply close this window.
      </p>
      <a href={href} className="mt-8 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-background">
        Open the app
      </a>
    </main>
  );
}
