"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { describeWriteError, staffClient } from "@/lib/admin-gate";
import { servicePreset, totals, type InvoiceData } from "@/lib/studio-invoice";

/**
 * Saving and deleting studio invoices.
 *
 * The whole bill is stored as JSON so it can be redrawn exactly; the few
 * columns beside it (number, date, client, service, total) are what the list
 * page sorts and searches by. The total is worked out here again rather than
 * trusted from the browser.
 */

const text = (max: number) => z.string().max(max).default("");

const Schema = z.object({
  heading: text(60),
  number: z.string().trim().min(1, "Give the invoice a number.").max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the invoice date."),
  quoteRef: text(60),
  service: z.enum([
    "website",
    "ecommerce",
    "app",
    "marketing",
    "seo",
    "social",
    "photoshoot",
    "leads",
    "saas",
    "branding",
    "renewal",
    "other",
  ]),
  client: z.object({
    business: text(120),
    person: text(120),
    phone: text(60),
    email: text(160),
    address: text(400),
    gstin: text(20),
  }),
  items: z
    .array(
      z.object({
        id: z.string().max(40),
        title: text(200),
        qty: z.number().min(0).max(100000),
        rate: z.number().min(0).max(1_00_00_00_000),
      }),
    )
    .max(12),
  inclusions: z.array(z.string().max(80)).max(16),
  discount: z.number().min(0).max(1_00_00_00_000),
  tax: z.enum(["excluding", "not-applicable", "including", "add18"]),
  showTerms: z.boolean(),
  milestones: z
    .array(z.object({ id: z.string().max(40), percent: z.number().min(0).max(100), label: text(40), note: text(80) }))
    .max(4),
  showRenewal: z.boolean(),
  renewalText: text(400),
  note: text(400),
  issuer: z.object({
    phone: text(60),
    specialEmail: text(120),
    supportEmail: text(120),
    websites: text(120),
    address: text(400),
  }),
});

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

async function operator() {
  const gate = await staffClient();
  if ("error" in gate) return gate;
  const { data: can } = await gate.supabase.rpc("staff_can", { capability: "operate" });
  if (can === false) return { error: "Your role can view the back office but not make invoices." };
  return gate;
}

export async function saveInvoice(id: string | null, input: InvoiceData): Promise<SaveResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Some details are not valid." };
  const data = parsed.data as InvoiceData;

  const gate = await operator();
  if ("error" in gate) return { ok: false, error: gate.error };

  const row = {
    number: data.number.trim(),
    issue_date: data.date,
    client_name: (data.client.business || data.client.person).trim(),
    service: servicePreset(data.service).label,
    total_paise: totals(data).total,
    data,
  };

  const q = id
    ? gate.supabase.from("studio_invoices").update(row).eq("id", id).select("id").single()
    : gate.supabase.from("studio_invoices").insert(row).select("id").single();
  const { data: saved, error } = await q;

  if (error) {
    if (error.message.includes("duplicate key")) return { ok: false, error: `Invoice number ${row.number} is already used. Change the number and save again.` };
    if (error.message.includes("studio_invoices") && error.message.includes("does not exist"))
      return { ok: false, error: "The invoices table is not set up yet — run the studio_invoices migration in Supabase." };
    return { ok: false, error: describeWriteError(error.message) };
  }

  revalidatePath("/admin/invoices");
  return { ok: true, id: saved.id as string };
}

export async function deleteInvoice(id: string): Promise<{ ok: boolean; error?: string }> {
  const gate = await operator();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { error } = await gate.supabase.from("studio_invoices").delete().eq("id", id);
  if (error) return { ok: false, error: describeWriteError(error.message) };
  revalidatePath("/admin/invoices");
  return { ok: true };
}
