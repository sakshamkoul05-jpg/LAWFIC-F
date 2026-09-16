import { NextResponse } from "next/server";
import { z } from "zod";
import { checkTopUpAmount } from "@/lib/money";
import {
  cashfreeMode,
  createTopUpOrder,
  isCashfreeConfigured,
  isCashfreeTestMode,
  newTopUpOrderId,
} from "@/lib/cashfree";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PHONE_RE = /^[6-9]\d{9}$/;

const Body = z.object({
  rupees: z.number(),
  /* Optional because most customers already have one on their profile. Sent
     only by the form when the profile has none — see the note below. */
  phone: z.string().optional(),
});

/**
 * Starts a top-up: creates a Cashfree order and records our own intent.
 *
 * What this route does NOT do is move any money. It cannot — the wallet is
 * credited only by the webhook, after an HMAC check. If this route were the
 * thing that credited, a user could call it directly and mint balance without
 * ever paying.
 *
 * The amount is validated server-side from the same function the form uses, so
 * a hand-crafted request cannot ask for ₹0.005 or ₹10 crore.
 *
 * WHY A PHONE NUMBER SUDDENLY MATTERS
 *
 * Cashfree requires `customer_phone` on every order; Razorpay did not. It is a
 * real requirement, not a formality — it is what their UPI flows and their
 * payment receipts are addressed to. Our profile has always had a phone field
 * and has never required it, so some accounts have none.
 *
 * Rather than invent a number (which would send someone else's phone a payment
 * receipt) or block the top-up outright, the route asks: no phone anywhere
 * means a 422 the form knows how to render as one extra field. A phone given
 * that way is saved to the profile, so it is asked for exactly once.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  if (!isCashfreeConfigured) {
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

  const admin = createAdminClient()!;

  /* The profile is read with the ADMIN client, not the user's. The user's own
     client would work — RLS lets somebody read their own profile — but this
     route already holds the admin client for the intent insert, and one client
     is one fewer round trip and one fewer thing to reason about. */
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const supplied = (parsed.phone ?? "").replace(/\D/g, "");
  const stored = String(profile?.phone ?? "").replace(/\D/g, "");
  const phone = PHONE_RE.test(supplied) ? supplied : PHONE_RE.test(stored) ? stored : "";

  if (!phone) {
    /* 422 and not 400: the request was well formed, it is the account that is
       incomplete. The form branches on this code to show the field. */
    return NextResponse.json(
      {
        error: "phone_required",
        message:
          supplied && !PHONE_RE.test(supplied)
            ? "That does not look like an Indian mobile number."
            : "Our payment provider needs a mobile number for the receipt.",
      },
      { status: 422 },
    );
  }

  /* Save it back, so this is asked once and not on every top-up. A failure
     here is not worth refusing a payment over — the number is already in hand
     for this order, and the worst case is being asked again next time. */
  if (supplied && supplied !== stored) {
    const { error } = await admin.from("profiles").update({ phone: supplied }).eq("id", user.id);
    if (error) console.error("[wallet/topup] could not save the phone to the profile", error);
  }

  const orderId = newTopUpOrderId(user.id);

  /* RECORD THE INTENT BEFORE THE ORDER EXISTS AT THE GATEWAY.
     The other order — create at Cashfree first, record second — leaves a
     window in which a customer can pay for an order we have no record of, and
     the webhook's only honest response to that is to refuse to credit. Doing
     it this way, the worst case is an unused intent row, which is inert. */
  const { error: intentErr } = await admin.from("payment_intents").insert({
    order_id: orderId,
    user_id: user.id,
    amount_paise: amount.paise,
    gateway: "cashfree",
  });

  if (intentErr) {
    console.error("[wallet/topup] could not record the intent", intentErr);
    return NextResponse.json({ error: "intent_not_recorded" }, { status: 500 });
  }

  const created = await createTopUpOrder({
    orderId,
    userId: user.id,
    amountPaise: amount.paise,
    customerPhone: phone,
    customerEmail: user.email ?? undefined,
    customerName: (profile?.full_name as string | null) ?? undefined,
    /* Where a redirect-based method lands. Built from SITE_URL rather than the
       request's own host: the same reasoning as the sign-in emails, and here it
       is stricter still — Cashfree validates the URL against the domains
       registered on the merchant account, so a preview host is simply refused. */
    returnUrl: `${SITE_URL}/wallet/topup/return?order_id={order_id}`,
  });

  if (!created.ok) {
    /* The intent is left behind deliberately. It is harmless, it records that
       a top-up was attempted, and deleting it would need a second round trip
       on the path where something is already going wrong. */
    return NextResponse.json({ error: created.error }, { status: 502 });
  }

  return NextResponse.json({
    orderId: created.order.orderId,
    /* Single-use and order-scoped. This is the only payment value the browser
       ever sees — there is no publishable key in this integration. */
    paymentSessionId: created.order.paymentSessionId,
    amountPaise: created.order.amountPaise,
    mode: cashfreeMode,
    testMode: isCashfreeTestMode,
  });
}
