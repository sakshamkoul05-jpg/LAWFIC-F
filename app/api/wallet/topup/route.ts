import { NextResponse } from "next/server";
import { z } from "zod";
import { checkTopUpAmount } from "@/lib/money";
import {
  createTopUpOrder,
  isRazorpayConfigured,
  isRazorpayTestMode,
  razorpayKeyId,
} from "@/lib/razorpay";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ rupees: z.number() });

/**
 * Starts a top-up: creates a Razorpay order and records our own intent.
 *
 * What this route does NOT do is move any money. It cannot — the wallet is
 * credited only by the webhook, after an HMAC check. If this route were the
 * thing that credited, a user could call it directly and mint balance without
 * ever paying.
 *
 * The amount is validated server-side from the same function the form uses, so
 * a hand-crafted request cannot ask for ₹0.01 or ₹10 crore.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  if (!isRazorpayConfigured) {
    return NextResponse.json({ error: "payments_not_configured" }, { status: 503 });
  }
  if (!isServiceRoleConfigured) {
    // Without the service role we cannot record the intent, and an unrecorded
    // payment is one the webhook cannot attribute. Refuse rather than take money.
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const amount = checkTopUpAmount(parsed.rupees);
  if (!amount.ok) {
    return NextResponse.json({ error: "bad_amount", message: amount.error }, { status: 400 });
  }

  const receipt = `topup_${user.id.slice(0, 8)}_${Date.now()}`;
  const created = await createTopUpOrder({
    userId: user.id,
    amountPaise: amount.paise,
    receipt,
  });

  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: 502 });
  }

  // Record the intent BEFORE the user can pay, so a payment always has
  // something to reconcile against.
  const admin = createAdminClient()!;
  const { error } = await admin.from("payment_intents").insert({
    razorpay_order_id: created.order.id,
    user_id: user.id,
    amount_paise: created.order.amountPaise,
  });

  if (error) {
    console.error("[wallet/topup] could not record the intent", error);
    return NextResponse.json({ error: "intent_not_recorded" }, { status: 500 });
  }

  return NextResponse.json({
    orderId: created.order.id,
    amountPaise: created.order.amountPaise,
    currency: created.order.currency,
    keyId: razorpayKeyId,
    testMode: isRazorpayTestMode,
    email: user.email ?? "",
    phone: user.phone ?? "",
  });
}
