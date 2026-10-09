"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { LICENCE_KINDS } from "@/lib/compliance/renewals";
import { checkId } from "@/lib/compliance/identifiers";

/**
 * The compliance dashboard's writes.
 *
 * Every one runs on the customer's own session. Row Level Security on each
 * table is what stops a request touching someone else's business — the
 * user_id filters here are for a clear error, not for safety.
 */

async function session() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/compliance");
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/compliance");
  return { supabase, user: data.user };
}

const Business = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  entity_type: z.enum(["proprietorship", "partnership", "llp", "opc", "pvt_ltd"]),
  state: z.string().regex(/^[A-Z]{0,2}$/),
  gst_scheme: z.enum(["none", "monthly", "qrmp", "composition"]),
  has_employees: z.boolean(),
  deducts_tds: z.boolean(),
  tax_audit: z.boolean(),
  gstin: z.string().max(15),
  pan: z.string().max(10),
  whatsapp_opt_in: z.boolean(),
  whatsapp_number: z.string().regex(/^[0-9]{0,15}$/),
});

export type ActionState = { error?: string; ok?: boolean } | undefined;

export async function saveBusiness(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await session();
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const bool = (k: string) => formData.get(k) === "1";

  const gstin = str("gstin").toUpperCase().replace(/\s/g, "");
  const pan = str("pan").toUpperCase().replace(/\s/g, "");
  if (gstin && !checkId("gstin", gstin).valid) return { error: "That GSTIN does not check out — look for a typo." };
  if (pan && !checkId("pan", pan).valid) return { error: "That PAN is not in the right format." };

  let phone = str("whatsapp_number").replace(/\D/g, "");
  if (phone.length === 10) phone = `91${phone}`;
  const optIn = bool("whatsapp_opt_in");
  if (optIn && !/^91[6-9]\d{9}$/.test(phone)) {
    return { error: "Add a 10-digit Indian mobile number for WhatsApp reminders." };
  }

  const parsed = Business.safeParse({
    id: str("id") || undefined,
    name: str("name"),
    entity_type: str("entity_type"),
    state: str("state").toUpperCase(),
    gst_scheme: str("gst_scheme"),
    has_employees: bool("has_employees"),
    deducts_tds: bool("deducts_tds"),
    tax_audit: bool("tax_audit"),
    gstin,
    pan,
    whatsapp_opt_in: optIn,
    whatsapp_number: phone,
  });
  if (!parsed.success) return { error: "Something in the form was missing or not valid." };

  const { id, ...row } = parsed.data;
  let businessId = id;
  if (id) {
    const { error } = await supabase
      .from("businesses")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: "Could not save those changes." };
  } else {
    const { data, error } = await supabase
      .from("businesses")
      .insert({ ...row, user_id: user.id })
      .select("id")
      .single();
    if (error || !data) return { error: "Could not add that business." };
    businessId = data.id;
  }

  revalidatePath("/compliance");
  revalidatePath("/compliance/businesses");
  redirect(`/compliance?b=${businessId}`);
}

export async function deleteBusiness(formData: FormData) {
  const { supabase, user } = await session();
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  await supabase.from("businesses").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/compliance");
  redirect("/compliance/businesses");
}

export async function toggleFiled(formData: FormData) {
  const { supabase, user } = await session();
  const businessId = String(formData.get("business_id") ?? "");
  const key = String(formData.get("item_key") ?? "");
  const filed = formData.get("filed") === "1";
  if (!z.string().uuid().safeParse(businessId).success || !/^[A-Z0-9]{2,12}:[0-9A-Z-]{1,20}$/.test(key)) return;

  if (filed) {
    await supabase.from("compliance_filings").delete().eq("business_id", businessId).eq("item_key", key);
  } else {
    await supabase
      .from("compliance_filings")
      .upsert({ business_id: businessId, user_id: user.id, item_key: key }, { onConflict: "business_id,item_key", ignoreDuplicates: true });
  }
  revalidatePath("/compliance");
}

const Licence = z.object({
  business_id: z.string().uuid(),
  kind: z.enum(LICENCE_KINDS.map((k) => k.id) as [string, ...string[]]),
  label: z.string().trim().max(80),
  number: z.string().trim().max(40),
  expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function addLicence(formData: FormData) {
  const { supabase, user } = await session();
  const parsed = Licence.safeParse({
    business_id: formData.get("business_id"),
    kind: formData.get("kind"),
    label: formData.get("label") ?? "",
    number: formData.get("number") ?? "",
    expires_on: formData.get("expires_on"),
  });
  if (!parsed.success) return;
  await supabase.from("business_licences").insert({ ...parsed.data, user_id: user.id });
  revalidatePath("/compliance");
}

export async function deleteLicence(formData: FormData) {
  const { supabase, user } = await session();
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  await supabase.from("business_licences").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/compliance");
}
