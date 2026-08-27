"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getService } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";

/**
 * Customer-side order actions.
 *
 * Neither of these trusts an amount from the browser. Starting a filing sends
 * no money at all, and paying reads the price from the order row the database
 * holds — the client only names which order.
 */

const Start = z.object({
  slug: z.string().min(1),
  details: z.string().max(2000).optional(),
});

export async function startFiling(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Sign-in is not switched on yet." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/orders");

  const parsed = Start.safeParse({
    slug: formData.get("slug"),
    details: formData.get("details") ?? undefined,
  });
  if (!parsed.success) return { error: "Something was missing from that request." };

  if (!getService(parsed.data.slug)) return { error: "That service does not exist." };

  const { data, error } = await supabase
    .from("service_orders")
    .insert({
      user_id: auth.user.id,
      service_slug: parsed.data.slug,
      details: parsed.data.details || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[orders] could not create", error);
    return { error: "Could not start that filing. Try again." };
  }

  revalidatePath("/orders");
  redirect(`/orders/${data.id}`);
}

export async function payFromWallet(orderId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Not available." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in to pay." };

  const { error } = await supabase.rpc("pay_order_from_wallet", { p_order_id: orderId });

  if (error) {
    // 23514 is the balance guard in the ledger trigger.
    if (error.code === "23514" || /insufficient/i.test(error.message)) {
      return { error: "Your wallet does not have enough for this. Top up and try again." };
    }
    if (error.code === "22023") {
      return { error: "This order is not awaiting payment." };
    }
    console.error("[orders] payment failed", error);
    return { error: "Could not take the payment. Nothing has been charged." };
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/wallet");
  return { ok: true };
}
