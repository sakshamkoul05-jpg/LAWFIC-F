import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isRazorpayConfigured } from "@/lib/razorpay";
import {
  canAutoRenew,
  paidPlans,
  priceFor,
  type BillingPeriod,
} from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where subscribing starts.
 *
 * IT DOES NOT CREATE THE MEMBERSHIP
 *
 * It prices the chosen tier, checks the price can legally auto-renew, and
 * hands back what Checkout needs. The `subscriptions` row is written by the
 * payment webhook once Razorpay says the first debit succeeded — because a row
 * in that table is an assertion that money was taken, and the only thing
 * entitled to make that assertion is the thing that took it. Anything else
 * lets a client grant itself a membership by calling an endpoint twice.
 *
 * THE MANDATE CHECK IS HERE AND NOT ONLY IN THE UI
 *
 * Under the RBI's Digital Payments E-mandate Framework, 2026, a recurring
 * debit runs unattended only up to ₹15,000 per transaction; above that the
 * customer must authenticate every single debit. A plan sold as auto-renewing
 * above that line does not fail at checkout — it fails months later, one
 * customer at a time, as renewals start bouncing. So the price is checked
 * against the ceiling before anybody pays, server-side, where a client cannot
 * skip it.
 *
 * An annual period is over the line at today's prices, which is why it comes
 * back marked `oneOff`: it has to be taken as a single authenticated payment
 * rather than as a standing instruction.
 */

const Body = z.object({
  planId: z.string().trim().min(1).max(64),
  period: z.enum(["monthly", "annual"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { planId, period } = parsed.data;

  /* The price comes from the server's own plan list, never from the request.
     A period and a tier id are the only things a client may choose; the amount
     is ours to decide, or the amount is whatever the client says it is. */
  const plan = paidPlans().find((p) => p.id === planId);
  if (!plan) return NextResponse.json({ error: "unknown_plan" }, { status: 404 });

  const price = priceFor(plan.monthlyPaise, period as BillingPeriod);

  /* One membership at a time. The database enforces this too, with an
     exclusion constraint, but finding out there by way of a failed insert
     means the customer has already been charged. */
  const { data: existing } = await supabase
    .from("my_subscription")
    .select("plan_id, status")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "already_subscribed", planId: (existing as { plan_id: string }).plan_id },
      { status: 409 },
    );
  }

  if (!isRazorpayConfigured) {
    /* The same shape top-ups return when keys are missing: a clear 503 rather
       than a half-built checkout. Said out loud because a silent failure on a
       payment screen is the worst kind. */
    return NextResponse.json(
      {
        error: "payments_not_configured",
        message:
          "Memberships are not switched on yet — the payment gateway keys are not set for this deployment.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      planId: plan.id,
      period,
      feePaise: price.feePaise,
      gstPaise: price.gstPaise,
      totalPaise: price.totalPaise,
      /* False means this cannot be a standing instruction and the customer
         has to authenticate the payment itself. The UI must say so BEFORE
         they pay, not discover it at the bank's screen. */
      canAutoRenew: canAutoRenew(price.totalPaise),
      oneOff: !canAutoRenew(price.totalPaise),
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
