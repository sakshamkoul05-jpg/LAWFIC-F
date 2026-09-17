import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchOrderPayments, fetchOrderStatus } from "./cashfree.ts";

/**
 * Settle a paid order that the webhook did not settle.
 *
 * ONE IMPLEMENTATION, TWO CALLERS
 *
 * The API route (called by the top-up flow as soon as checkout resolves) and
 * the return page (where a redirect-based payment lands) both need exactly
 * this, and two copies of "decide whether to credit a wallet" is the last
 * thing this codebase should have. The logic lives here; the callers only
 * supply an admin client and say which order.
 *
 * WHY IT IS SAFE TO RUN FROM A PAGE LOAD
 *
 * It is idempotent by construction, not by convention. Whether the order was
 * paid is decided by ASKING CASHFREE; whose order it is comes from our own
 * payment_intents row; and the credit is written with the EXACT idempotency
 * key the webhook uses — `cf:<payment id>`, taken from Cashfree's record of
 * which payment succeeded and never invented here. wallet_entries.
 * idempotency_key is unique, so a reload, a shared URL, a retry and a late
 * webhook all collide into the same no-op.
 *
 * That shared key is the design. With different keys the webhook and this
 * would race, and sometimes both would win.
 */

export type ReconcileResult =
  | { ok: true; credited: boolean; reason: "credited" | "already" | "not_paid" | "no_payment" }
  | { ok: false; reason: "unknown_order" | "lookup_failed" | "credit_failed" };

export async function reconcilePaidOrder(opts: {
  admin: SupabaseClient;
  orderId: string;
  /** Restricts the reconcile to this user's own order. */
  userId: string;
}): Promise<ReconcileResult> {
  const { admin, orderId, userId } = opts;

  /* Ours, and this user's. Both conditions stated explicitly: this is the
     admin client, so RLS is not standing behind the query. */
  const { data: intent } = await admin
    .from("payment_intents")
    .select("order_id, user_id, amount_paise, status")
    .eq("order_id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!intent) return { ok: false, reason: "unknown_order" };
  if (intent.status === "paid") return { ok: true, credited: false, reason: "already" };

  const status = await fetchOrderStatus(orderId);
  if (!status.ok) return { ok: false, reason: "lookup_failed" };
  if (status.status !== "PAID") {
    /* Not a failure. Somebody may have come back before their bank finished,
       and telling them the payment failed would be wrong as well as unkind. */
    return { ok: true, credited: false, reason: "not_paid" };
  }

  const payments = await fetchOrderPayments(orderId);
  if (!payments.ok) return { ok: false, reason: "lookup_failed" };

  const success = payments.payments.find((p) => p.status === "SUCCESS" && p.cfPaymentId);
  if (!success) {
    console.error("[reconcile] order is PAID with no SUCCESS payment", orderId);
    return { ok: true, credited: false, reason: "no_payment" };
  }

  /* Credit what actually arrived, not what was asked for. The two differ only
     when something has gone wrong, and Cashfree's figure is the one that
     matches the customer's bank statement. */
  const paise = success.amountPaise > 0 ? success.amountPaise : intent.amount_paise;

  const { error } = await admin.from("wallet_entries").insert({
    user_id: intent.user_id,
    direction: "credit",
    amount_paise: paise,
    reason: "Wallet top-up",
    gateway_payment_id: success.cfPaymentId,
    idempotency_key: `cf:${success.cfPaymentId}`,
  });

  /* 23505 is the unique violation on idempotency_key: the webhook, or another
     tab, got there first. That is this working as designed, not an error. */
  if (error && error.code !== "23505") {
    console.error("[reconcile] credit failed", error);
    return { ok: false, reason: "credit_failed" };
  }

  await admin.from("payment_intents").update({ status: "paid" }).eq("order_id", orderId);

  return error
    ? { ok: true, credited: false, reason: "already" }
    : { ok: true, credited: true, reason: "credited" };
}
