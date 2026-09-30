import type { Metadata } from "next";
import { Suspense } from "react";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo";
import AppCheckout from "./AppCheckout";

export const metadata: Metadata = {
  title: "Secure checkout",
  robots: PRIVATE_PAGE_ROBOTS,
};

/**
 * Where the LAWFIC app sends a customer to pay.
 *
 * The app asks /api/wallet/topup for an order (authenticated with the
 * customer's own token), receives Cashfree's single-use payment session id,
 * and opens this page in an in-app browser. This page does one thing: start
 * Cashfree's checkout for that session. It holds no keys, reads no account and
 * credits nothing — the webhook and /api/wallet/reconcile do that, exactly as
 * for a website top-up.
 */
export default function AppCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <AppCheckout />
    </Suspense>
  );
}
