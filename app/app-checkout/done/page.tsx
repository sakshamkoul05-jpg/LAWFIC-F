import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo";
import BackToApp from "./BackToApp";

export const metadata: Metadata = {
  title: "Back to LAWFIC",
  robots: PRIVATE_PAGE_ROBOTS,
};

export const dynamic = "force-dynamic";

/**
 * Where Cashfree returns a payment started from the LAWFIC app.
 *
 * It does not claim the payment succeeded — this browser is not signed in and
 * cannot know. It hands the customer back to the app, which asks
 * /api/wallet/reconcile with their own token and shows the real result.
 */
export default async function AppCheckoutDone({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id: orderId } = await searchParams;
  return <BackToApp orderId={orderId && /^[A-Za-z0-9_\-]{3,45}$/.test(orderId) ? orderId : null} />;
}
