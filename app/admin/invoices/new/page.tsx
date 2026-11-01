import type { Metadata } from "next";
import { AdminGate } from "../../AdminGate";
import InvoiceEditor from "../InvoiceEditor";
import { blankInvoice, newId } from "@/lib/studio-invoice";
import { gate, normalise, suggestNumber, todayIST } from "../load";

export const metadata: Metadata = { title: "New invoice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** A fresh bill, numbered on from the last one this year — or a copy of an earlier bill (?from=id) with a new number and today's date. */
export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const g = await gate();
  if (g.kind === "gate") return <AdminGate reason={g.reason} userId={g.userId} email={g.email} />;

  const date = todayIST();
  const { number, tableMissing } = await suggestNumber(g.supabase, date);
  let initial = blankInvoice(number, date);

  const { from } = await searchParams;
  if (from && !tableMissing) {
    const { data } = await g.supabase.from("studio_invoices").select("data").eq("id", from).maybeSingle();
    if (data?.data) {
      const copy = normalise(data.data, number, date);
      initial = {
        ...copy,
        number,
        date,
        items: copy.items.map((it) => ({ ...it, id: newId() })),
        milestones: copy.milestones.map((m) => ({ ...m, id: newId() })),
      };
    }
  }

  return (
    <InvoiceEditor
      id={null}
      initial={initial}
      canSave={!tableMissing}
      saveBlockedReason={
        tableMissing
          ? "Saving is off until the studio_invoices table is set up (run supabase/migrations/20261101090000_studio_invoices.sql in Supabase). You can still fill in the bill and print it."
          : undefined
      }
    />
  );
}
