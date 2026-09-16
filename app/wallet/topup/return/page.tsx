import type { Metadata } from "next";
import Link from "next/link";
import { fetchOrderStatus } from "@/lib/cashfree";
import { createClient } from "@/lib/supabase/server";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Payment",
  robots: PRIVATE_PAGE_ROBOTS,
};

export const dynamic = "force-dynamic";

/**
 * Where a redirect-based payment comes back to.
 *
 * Most top-ups never touch this page — card and netbanking finish inside the
 * modal on /wallet/topup and the balance updates there. But a UPI intent on a
 * phone leaves the browser entirely, and some 3DS flows navigate away, so
 * Cashfree needs a `return_url` and this is it.
 *
 * WHAT THIS PAGE DOES NOT DO
 *
 * Credit anything. It reads the order's status to decide what to SAY; the
 * webhook decides what the balance IS. Those are deliberately different jobs
 * with different sources of truth:
 *
 *   - if this page credited, a customer could reload it and be credited twice,
 *     or hand the URL to a friend;
 *   - if only this page credited, a customer who closed the tab after paying
 *     would never be credited at all.
 *
 * So the webhook is the only writer, and this page is a receipt.
 *
 * WHOSE ORDER IS IT
 *
 * The order id arrives in a query string, which anybody can edit. Before
 * asking Cashfree anything, the order is matched against payment_intents FOR
 * THE SIGNED-IN USER — so a guessed id returns "we do not recognise this"
 * rather than leaking whether somebody else's payment succeeded.
 */
export default async function TopUpReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;

  const supabase = await createClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!supabase || !auth.user) {
    return <Shell title="Sign in to see this payment" body="Your session has expired." />;
  }

  if (!orderId) {
    return (
      <Shell
        title="No payment to show"
        body="This page is where a payment comes back to. There is nothing to report without one."
      />
    );
  }

  /* RLS already restricts payment_intents to the owner; the explicit user_id
     filter is here as well so the query says out loud what it depends on. A
     policy is easy to change without reading every query that relied on it. */
  const { data: intent } = await supabase
    .from("payment_intents")
    .select("order_id, amount_paise, status")
    .eq("order_id", orderId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!intent) {
    return (
      <Shell
        title="We do not recognise this payment"
        body="If money has left your account, it will still reach your wallet — our records are updated by the payment provider, not by this page. Check your balance in a minute, and contact us if it has not landed."
      />
    );
  }

  const result = await fetchOrderStatus(orderId);
  const status = result.ok ? result.status : null;

  if (status === "PAID") {
    return (
      <Shell
        title="Payment received"
        body="Your wallet is being credited now. It usually lands within a few seconds."
        cta="Go to my wallet"
      />
    );
  }

  if (status === "EXPIRED" || status === "TERMINATED") {
    return (
      <Shell
        title="That payment did not go through"
        body="Nothing has been charged. You can start again whenever you are ready."
        cta="Back to top up"
        href="/wallet/topup"
      />
    );
  }

  /* ACTIVE means the order is still open — the customer may have come back
     without finishing, or the bank has not confirmed yet. Both are ordinary,
     and neither is a failure to announce. */
  return (
    <Shell
      title="Still waiting on your bank"
      body="This can take a minute. If the money has left your account it will reach your wallet automatically — you do not need to pay again."
      cta="Go to my wallet"
    />
  );
}

function Shell({
  title,
  body,
  cta = "Go to my wallet",
  href = "/wallet",
}: {
  title: string;
  body: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div
      className="glass-panel mx-auto max-w-lg rounded-2xl p-8 text-center"
      style={{ color: "var(--wallet-fg)" }}
    >
      <h1 className="text-[18px] font-semibold">{title}</h1>
      <p className="mt-3 text-[14px] leading-relaxed opacity-60">{body}</p>
      <Link
        href={href}
        className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background"
      >
        {cta}
      </Link>
    </div>
  );
}
