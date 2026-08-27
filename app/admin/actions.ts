"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Back-office actions.
 *
 * Every one of these is a thin wrapper over a security-definer function that
 * re-checks `is_staff()` in the database. The check here is a courtesy so the
 * UI can show a sensible message; the check that matters is the one in the
 * function, which holds even if this file is bypassed entirely.
 */

async function client() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? supabase : null;
}

const Quote = z.object({
  orderId: z.string().uuid(),
  governmentRupees: z.coerce.number().int().min(0).max(1000000),
  professionalRupees: z.coerce.number().int().min(0).max(1000000),
  notes: z.string().max(2000).optional(),
});

export async function quoteOrder(formData: FormData) {
  const supabase = await client();
  if (!supabase) return { error: "Not signed in." };

  const parsed = Quote.safeParse({
    orderId: formData.get("orderId"),
    governmentRupees: formData.get("governmentRupees") || 0,
    professionalRupees: formData.get("professionalRupees") || 0,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return { error: "Check the figures and try again." };

  const { orderId, governmentRupees, professionalRupees, notes } = parsed.data;

  if (governmentRupees + professionalRupees <= 0) {
    return { error: "A quote has to come to more than zero." };
  }

  const { error } = await supabase.rpc("quote_order", {
    p_order_id: orderId,
    p_government_fee_paise: governmentRupees * 100,
    p_professional_fee_paise: professionalRupees * 100,
    p_admin_notes: notes || null,
  });

  if (error) {
    if (error.code === "42501") return { error: "You are not staff." };
    if (error.code === "22023") return { error: error.message };
    console.error("[admin] quote failed", error);
    return { error: "Could not save that quote." };
  }

  revalidatePath("/admin");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function advanceOrder(formData: FormData) {
  const supabase = await client();
  if (!supabase) return { error: "Not signed in." };

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!["in_progress", "completed"].includes(status)) {
    return { error: "That is not a status an order can be moved to." };
  }

  const { error } = await supabase.rpc("advance_order", {
    p_order_id: orderId,
    p_status: status,
  });

  if (error) {
    if (error.code === "42501") return { error: "You are not staff." };
    if (error.code === "22023") return { error: error.message };
    console.error("[admin] advance failed", error);
    return { error: "Could not move that order." };
  }

  revalidatePath("/admin");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function rejectOrder(formData: FormData) {
  const supabase = await client();
  if (!supabase) return { error: "Not signed in." };

  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!reason) return { error: "Give a reason the customer can read." };

  // The database does the refund in the same transaction as the status change.
  const { error } = await supabase.rpc("reject_order", {
    p_order_id: orderId,
    p_reason: reason,
  });

  if (error) {
    if (error.code === "42501") return { error: "You are not staff." };
    if (error.code === "22023") return { error: error.message };
    console.error("[admin] reject failed", error);
    return { error: "Could not close that order." };
  }

  revalidatePath("/admin");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/wallet");
  return { ok: true };
}
