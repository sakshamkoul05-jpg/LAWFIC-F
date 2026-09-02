"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isRequestableSlug } from "@/lib/catalogue";
import { getIntake } from "@/lib/intake";
import { documents } from "@/lib/documents";
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
  details: z.string().max(4000).optional(),
});

/**
 * Fold a document's intake answers into the one `details` column.
 *
 * Each document asks for different things (see lib/intake.ts), so the shapes
 * vary per request. They are written as readable "Label: value" lines rather
 * than JSON because the only consumer is a person reading the order in the
 * admin console, and a paragraph they can scan beats a blob they have to
 * decode. If this ever needs querying — "how many GST requests were over ₹5
 * crore" — that is the point to add a jsonb column, not before.
 *
 * Anything not declared in the intake spec is ignored, so a hand-crafted POST
 * cannot stuff arbitrary content into an order.
 */
function summarise(slug: string, formData: FormData): string {
  const intake = getIntake(slug);
  if (!intake) {
    const notes = formData.get("notes");
    return typeof notes === "string" ? notes.trim().slice(0, 4000) : "";
  }

  const lines: string[] = [];
  for (const field of intake.fields) {
    const raw = formData.get(field.name);
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value) continue;
    lines.push(`${field.label}: ${value}`);
  }
  return lines.join("\n").slice(0, 4000);
}

export async function startFiling(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Sign-in is not switched on yet." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/orders");

  const slug = formData.get("slug");
  const parsed = Start.safeParse({
    slug,
    details: typeof slug === "string" ? summarise(slug, formData) || undefined : undefined,
  });
  if (!parsed.success) return { error: "Something was missing from that request." };

  /* Any catalogue service or document may be requested. Previously this
     accepted only the handful of slugs with a written page, so a customer
     could read about sixty documents and ask for four of them. What LAWFIC
     will actually take on is decided at the quote step, not here. */
  const known = isRequestableSlug(
    parsed.data.slug,
    documents.map((d) => d.slug),
  );
  if (!known) return { error: "We do not have that on our list." };

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
