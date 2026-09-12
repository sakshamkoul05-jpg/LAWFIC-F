import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The caller's own membership: read it, or cancel it.
 *
 * BOTH GO THROUGH RLS, NOT THROUGH THE SERVICE ROLE
 *
 * The read is a select on `my_subscription`, a security-invoker view whose
 * where-clause is `user_id = auth.uid()`. The cancel is
 * `cancel_my_subscription()`, a security-definer function that can only touch
 * the caller's own row. Neither needs the service role, so neither can be
 * turned into a way to read or change somebody else's membership even if the
 * handler below were wrong about who is asking.
 *
 * There is no POST here. Creating a membership means taking money, and a row
 * that says money was taken may only be written by the thing that took it —
 * the payment webhook. See ./checkout for where subscribing starts.
 */

type Row = {
  plan_id: string;
  billing_period: "monthly" | "annual";
  status: "active" | "cancelling" | "past_due" | "expired";
  period_end: string;
  cancelled_at: string | null;
};

/** The view's shape, mapped to what lib/subscription.ts and the UI expect. */
function toSubscription(row: Row) {
  return {
    planId: row.plan_id,
    period: row.billing_period,
    status: row.status,
    currentPeriodEnd: row.period_end,
    cancelledAt: row.cancelled_at,
  };
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  /* maybeSingle, not single: having no membership is the common case and not
     an error, and `single` turns it into one. */
  const { data, error } = await supabase
    .from("my_subscription")
    .select("plan_id, billing_period, status, period_end, cancelled_at")
    .maybeSingle();

  if (error) {
    console.error("[subscription] read failed", error.message);
    return NextResponse.json({ error: "read_failed" }, { status: 502 });
  }

  return NextResponse.json(
    { subscription: data ? toSubscription(data as Row) : null },
    /* Never cached. A renewal date that is one response stale is a renewal
       date the customer cannot trust, and this is the page they check to find
       out what is about to leave their account. */
    { headers: { "Cache-Control": "no-store, private" } },
  );
}

/**
 * Cancel.
 *
 * DELETE rather than a POST to /cancel, because from the customer's side this
 * removes the standing instruction — and because a cancellation endpoint that
 * looks like every other "submit" invites being wired to the wrong button.
 *
 * It does not shorten the paid period. The row moves to 'cancelling' and the
 * benefits stand until the period ends, which is what was paid for.
 */
export async function DELETE() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const { error } = await supabase.rpc("cancel_my_subscription");
  if (error) {
    console.error("[subscription] cancel failed", error.message);
    return NextResponse.json({ error: "cancel_failed" }, { status: 502 });
  }

  /* Read back through the view rather than trusting the function's return
     shape, so the client gets exactly what a GET would have given it and the
     card has one code path for rendering state. */
  const { data } = await supabase
    .from("my_subscription")
    .select("plan_id, billing_period, status, period_end, cancelled_at")
    .maybeSingle();

  return NextResponse.json(
    { subscription: data ? toSubscription(data as Row) : null },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
