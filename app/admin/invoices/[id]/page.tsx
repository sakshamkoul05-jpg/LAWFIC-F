import type { Metadata } from "next";
import Link from "next/link";
import { AdminGate } from "../../AdminGate";
import InvoiceEditor from "../InvoiceEditor";
import { gate, normalise, todayIST } from "../load";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** An issued bill, reopened for editing, printing again or duplicating. */
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const g = await gate();
  if (g.kind === "gate") return <AdminGate reason={g.reason} userId={g.userId} email={g.email} />;

  const { id } = await params;
  const { data } = /^[0-9a-f-]{36}$/i.test(id)
    ? await g.supabase.from("studio_invoices").select("id, number, issue_date, data").eq("id", id).maybeSingle()
    : { data: null };

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-[24px] font-bold text-foreground">Invoice not found</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">It may have been deleted.</p>
        <Link href="/admin/invoices" className="mt-4 inline-block text-[13.5px] text-primary hover:underline">
          Back to invoices
        </Link>
      </div>
    );
  }

  const initial = normalise(data.data ?? {}, data.number as string, (data.issue_date as string) ?? todayIST());
  return <InvoiceEditor key={data.id as string} id={data.id as string} initial={initial} canSave />;
}
