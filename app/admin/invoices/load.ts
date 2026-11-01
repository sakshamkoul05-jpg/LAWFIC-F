import { createClient } from "@/lib/supabase/server";
import { blankInvoice, nextInvoiceNumber, type InvoiceData } from "@/lib/studio-invoice";

/**
 * Shared by the new and edit pages: the gate, and what the editor starts from.
 */

export type Gate =
  | { kind: "gate"; reason: "not-connected" | "signed-out" | "not-staff"; userId?: string; email?: string }
  | { kind: "ok"; supabase: NonNullable<Awaited<ReturnType<typeof createClient>>> };

export async function gate(): Promise<Gate> {
  const supabase = await createClient();
  if (!supabase) return { kind: "gate", reason: "not-connected" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { kind: "gate", reason: "signed-out" };
  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) return { kind: "gate", reason: "not-staff", userId: auth.user.id, email: auth.user.email };
  return { kind: "ok", supabase };
}

/** Today in India, as YYYY-MM-DD. */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** Fill in any field an older saved bill is missing, so the editor never meets undefined. */
export function normalise(raw: Partial<InvoiceData>, fallbackNumber: string, fallbackDate: string): InvoiceData {
  const base = blankInvoice(raw.number || fallbackNumber, raw.date || fallbackDate, raw.service ?? "website");
  return {
    ...base,
    ...raw,
    client: { ...base.client, ...(raw.client ?? {}) },
    issuer: { ...base.issuer, ...(raw.issuer ?? {}) },
    items: raw.items?.length ? raw.items : base.items,
    inclusions: raw.inclusions ?? base.inclusions,
    milestones: raw.milestones ?? base.milestones,
  } as InvoiceData;
}

export async function suggestNumber(supabase: Extract<Gate, { kind: "ok" }>["supabase"], date: string) {
  const year = Number(date.slice(0, 4));
  const { data, error } = await supabase.from("studio_invoices").select("number").like("number", `LF/INV/${year}/%`).limit(2000);
  return { number: nextInvoiceNumber((data ?? []).map((r) => r.number as string), year), tableMissing: !!error };
}
