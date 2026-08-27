import { NextResponse } from "next/server";
import { isRazorpayWebhookConfigured, verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook — the ONLY thing that may credit a wallet.
 *
 * Order of operations matters and is not negotiable:
 *
 *   1. read the RAW body. Parsing and re-serialising changes the bytes and the
 *      signature will never match;
 *   2. verify the HMAC. Nothing is read from the payload before this — an
 *      unverified body is an attacker's text, not Razorpay's;
 *   3. only then touch the database.
 *
 * Crediting a wallet is a privileged write, so it runs with the service-role
 * key. That is safe *because* of step 2 and only because of it. Never move the
 * database work above the signature check.
 *
 * Idempotent by construction: Razorpay retries until it gets a 2xx, and
 * wallet_entries.idempotency_key is unique, so a replayed event collides
 * instead of crediting twice. A collision is a SUCCESS here, not an error.
 *
 * Whose wallet gets credited comes from OUR payment_intents row, looked up by
 * the Razorpay order id — not from `notes` in the payload. Notes are echoed
 * back from what we sent, so trusting them would mean trusting a round trip we
 * do not control.
 */
export async function POST(request: Request) {
  if (!isRazorpayWebhookConfigured || !isServiceRoleConfigured) {
    // 200 rather than an error: an unconfigured site should not make Razorpay
    // retry forever, and there is nothing to do.
    return NextResponse.json({ ok: true, ignored: "not_configured" });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    console.warn("[razorpay] rejected a webhook with a bad signature");
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: Record<string, unknown> } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const kind = event.event ?? "";
  const payment = event.payload?.payment?.entity ?? {};

  const paymentId = typeof payment.id === "string" ? payment.id : "";
  const orderId = typeof payment.order_id === "string" ? payment.order_id : "";
  const paidPaise = typeof payment.amount === "number" ? payment.amount : 0;

  const admin = createAdminClient()!;

  if (kind === "payment.failed") {
    if (orderId) {
      await admin.from("payment_intents").update({ status: "failed" }).eq("razorpay_order_id", orderId);
    }
    return NextResponse.json({ ok: true, handled: "failed" });
  }

  if (kind !== "payment.captured" && kind !== "order.paid") {
    return NextResponse.json({ ok: true, ignored: kind || "unknown_event" });
  }

  if (!paymentId || !orderId || paidPaise <= 0) {
    console.warn("[razorpay] captured event missing id/order/amount", { paymentId, orderId, paidPaise });
    return NextResponse.json({ ok: true, ignored: "incomplete_payload" });
  }

  // Whose money is this? Ours to say, from our own record.
  const { data: intent, error: intentErr } = await admin
    .from("payment_intents")
    .select("user_id, amount_paise, status")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (intentErr) {
    console.error("[razorpay] intent lookup failed", intentErr);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 }); // let Razorpay retry
  }

  if (!intent) {
    // A payment we never initiated. Do not guess a user — record nothing and
    // stop retries. This is the line worth an alert in production.
    console.error("[razorpay] captured payment with no matching intent", { orderId, paymentId });
    return NextResponse.json({ ok: true, ignored: "no_intent" });
  }

  if (paidPaise !== intent.amount_paise) {
    // Credit what actually arrived, but make the discrepancy loud.
    console.warn("[razorpay] amount differs from the intent", {
      orderId,
      intent: intent.amount_paise,
      paid: paidPaise,
    });
  }

  const { error: creditErr } = await admin.from("wallet_entries").insert({
    user_id: intent.user_id,
    direction: "credit",
    amount_paise: paidPaise,
    reason: "Wallet top-up",
    razorpay_payment_id: paymentId,
    idempotency_key: `rzp:${paymentId}`,
  });

  if (creditErr) {
    // 23505 is the unique violation on idempotency_key: this event has already
    // been applied. That is the retry working as designed.
    if (creditErr.code === "23505") {
      return NextResponse.json({ ok: true, handled: "already_credited" });
    }
    console.error("[razorpay] credit failed", creditErr);
    return NextResponse.json({ error: "credit_failed" }, { status: 500 }); // retry
  }

  await admin.from("payment_intents").update({ status: "paid" }).eq("razorpay_order_id", orderId);

  return NextResponse.json({ ok: true, handled: "credited" });
}
