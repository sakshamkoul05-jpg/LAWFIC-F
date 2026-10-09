import type { SupabaseClient } from "@supabase/supabase-js";
import { STATUS_META, type OrderStatus } from "./orders";
import { isWhatsAppConfigured, sendOrderUpdate } from "./whatsapp";

/**
 * Tell a customer on WhatsApp that their filing moved — quoted, in progress,
 * done, or closed.
 *
 * Runs on the staff member's own session (the "staff read businesses" policy
 * lets them see the customer's opt-in), after the status change has already
 * committed, and never throws: a WhatsApp outage must not make a quote look
 * like it failed. Only numbers the customer opted in on a business profile
 * are used, and only the first, so one order is one message.
 */
export async function notifyOrderStatus(supabase: SupabaseClient, orderId: string, status: OrderStatus) {
  if (!isWhatsAppConfigured) return;
  try {
    const { data: order } = await supabase
      .from("service_orders")
      .select("reference,user_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;
    const { data: biz } = await supabase
      .from("businesses")
      .select("whatsapp_number")
      .eq("user_id", order.user_id)
      .eq("whatsapp_opt_in", true)
      .neq("whatsapp_number", "")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (!biz?.whatsapp_number) return;
    await sendOrderUpdate(biz.whatsapp_number, order.reference, STATUS_META[status].label);
  } catch (err) {
    console.error("[notify] order status message failed", err);
  }
}
