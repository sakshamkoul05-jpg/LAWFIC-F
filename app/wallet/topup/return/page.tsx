import type { Metadata } from "next";
import Link from "next/link";
import { fetchOrderStatus } from "@/lib/cashfree";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcilePaidOrder } from "@/lib/reconcile";
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
 * IT SETTLES THE ORDER, IT DOES NOT DECIDE ANYTHING
 *
 * This page used to only report — and the first real payment proved that
 * inadequate: Cashfree had the money, the webhook had not arrived, and the
 * page announced "your wallet is being credited now" while nothing was
 * crediting it. Describing a credit that is not happening is worse than
 * staying quiet.
 *
 * It now reconciles. The earlier objection — that a page which credits can be
 * reloaded or its URL shared — is answered by HOW it credits rather than by
 * refusing to: reconcilePaidOrder asks Cashfree whether the order was paid,
 * takes the owner from our own records, and writes with the same idempotency
 * key the webhook uses. A reload, a shared link, a retry and a late webhook
 * all collide into the same no-op.
 *
 * The webhook is still the primary path and still the fastest. This is the
 * second of three chances a payment has to land, the third being the poll on
 * /wallet/topup.
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

  /**
   * RECONCILE, DO NOT MERELY REPORT.
   *
   * This page used to read the order status and announce "your wallet is being
   * credited now" — a sentence that was true only if the webhook had arrived.
   * When it had not, the page cheerfully described a credit that nothing was
   * performing, which is worse than saying nothing.
   *
   * It now settles the order itself. Safe on a GET, a reload or a shared URL
   * because reconcilePaidOrder is idempotent by construction: it asks Cashfree
   * whether the order was paid, reads the owner from our own records, and
   * writes with the same key the webhook uses. See lib/reconcile.ts.
   */
  const admin = createAdminClient();
  const settled = admin
    ? await reconcilePaidOrder({ admin, orderId, userId: auth.user.id })
    : null;

  const result = await fetchOrderStatus(orderId);
  const status = result.ok ? result.status : null;

  if (status === "PAID") {
    const credited = settled?.ok && (settled.credited || settled.reason === "already");
    return (
      <Shell
        title="Payment received"
        body={
          credited
            ? "Your wallet has been credited."
            : "Your wallet is being credited now. It usually lands within a few seconds."
        }
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
