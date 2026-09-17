import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchOrderPayments, fetchOrderStatus, isCashfreeConfigured } from "@/lib/cashfree";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ orderId: z.string().min(3).max(45) });

/**
 * The safety net for a payment whose webhook never arrived.
 *
 * WHY THIS EXISTS
 *
 * A ₹1 test payment succeeded at Cashfree, the money left the customer, and
 * nothing credited — because the order carried no notify_url and the dashboard
 * fallback was not configured. That specific hole is now closed, but the
 * general shape of it is not closeable: a webhook is one HTTP call from
 * somebody else's server to ours, and it can fail. "Payments are solid" cannot
 * mean "we assume that call always lands".
 *
 * So the customer's own browser can ask us to go and check.
 *
 * WHY THIS IS NOT THE SAME AS LETTING THE BROWSER CREDIT ITSELF
 *
 * Nothing here is taken on trust from the request. It carries an order id and
 * nothing else; whether that order was paid is decided by ASKING CASHFREE, and
 * whose order it is comes from our own payment_intents row. A forged or
 * borrowed order id gets a 404, and an unpaid one gets a polite no.
 *
 * WHY IT CANNOT DOUBLE-CREDIT
 *
 * It writes with the EXACT idempotency key the webhook uses — `cf:<payment
 * id>`, taken from Cashfree's own record of which payment succeeded, never
 * invented here. wallet_entries.idempotency_key is unique, so whichever of the
 * two arrives second collides and is a no-op. That shared key is the whole
 * design: without it, reconciliation and the webhook would race and sometimes
 * both win.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (!isCashfreeConfigured || !isServiceRoleConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const admin = createAdminClient()!;

  /* Ours, and this user's. Both conditions: RLS is not in play here because
     this is the admin client, so the ownership check has to be explicit. */
  const { data: intent } = await admin
    .from("payment_intents")
    .select("order_id, user_id, amount_paise, status")
    .eq("order_id", body.orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!intent) return NextResponse.json({ error: "unknown_order" }, { status: 404 });
  if (intent.status === "paid") return NextResponse.json({ ok: true, already: true });

  const status = await fetchOrderStatus(body.orderId);
  if (!status.ok) return NextResponse.json({ error: "lookup_failed" }, { status: 502 });
  if (status.status !== "PAID") {
    /* Not an error. The customer may simply have arrived back before their
       bank finished, and telling them something failed would be wrong. */
    return NextResponse.json({ ok: true, credited: false, status: status.status });
  }

  const payments = await fetchOrderPayments(body.orderId);
  if (!payments.ok) return NextResponse.json({ error: "lookup_failed" }, { status: 502 });

  const success = payments.payments.find((p) => p.status === "SUCCESS");
  if (!success || !success.cfPaymentId) {
    console.error("[reconcile] order is PAID with no SUCCESS payment", body.orderId);
    return NextResponse.json({ ok: true, credited: false, status: "no_payment" });
  }

  /* Credit what Cashfree says arrived, not what we asked for. They differ only
     if something has gone wrong, and in that case their number is the one that
     matches the customer's bank statement. */
  const paise = success.amountPaise > 0 ? success.amountPaise : intent.amount_paise;

  const { error } = await admin.from("wallet_entries").insert({
    user_id: intent.user_id,
    direction: "credit",
    amount_paise: paise,
    reason: "Wallet top-up",
    gateway_payment_id: success.cfPaymentId,
    // THE SAME KEY THE WEBHOOK USES. See the note above.
    idempotency_key: `cf:${success.cfPaymentId}`,
  });

  if (error && error.code !== "23505") {
    console.error("[reconcile] credit failed", error);
    return NextResponse.json({ error: "credit_failed" }, { status: 500 });
  }

  /* 23505 means the webhook got there first — which is a success, not a
     conflict. Either way the intent is settled. */
  await admin.from("payment_intents").update({ status: "paid" }).eq("order_id", body.orderId);

  return NextResponse.json({
    ok: true,
    credited: !error,
    alreadyCredited: error?.code === "23505",
  });
}
