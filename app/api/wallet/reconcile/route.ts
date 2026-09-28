import { NextResponse } from "next/server";
import { z } from "zod";
import { isCashfreeConfigured } from "@/lib/cashfree";
import { reconcilePaidOrder } from "@/lib/reconcile";
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
/* NOT GATED BY THE WALLET LOCK, DELIBERATELY.
 *
 * Everything else that touches the money calls isWalletLocked. This does not,
 * and the reason is the direction money moves: reconciliation only ever
 * settles a payment the customer has ALREADY made, crediting them. There is
 * nothing here for somebody holding a stolen session to gain — and a great
 * deal for a real customer to lose, because a payment whose webhook never
 * arrived would sit unsettled until they happened to unlock. Locking the door
 * that puts their own money back is the wrong failure. */
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

  const result = await reconcilePaidOrder({ admin, orderId: body.orderId, userId: user.id });

  if (!result.ok) {
    const status = result.reason === "unknown_order" ? 404 : result.reason === "credit_failed" ? 500 : 502;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ ok: true, credited: result.credited, reason: result.reason });
}
