import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintButton from "@/components/wallet/PrintButton";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo";
import { company } from "@/lib/company";
import {
  amountRows,
  documentTitle,
  issuedOn,
  supplierParty,
  taxDisclaimer,
  type Invoice,
} from "@/lib/invoice";

export const metadata: Metadata = { title: "Document", robots: PRIVATE_PAGE_ROBOTS };
export const dynamic = "force-dynamic";

/**
 * One receipt or tax invoice, laid out to be printed.
 *
 * Deliberately plain: black on white, no brand gradients, no dark mode. This
 * is a document somebody forwards to an accountant or prints for a file, and
 * every design flourish on it is one more thing that renders badly in a PDF or
 * costs somebody ink.
 *
 * WHAT IT DOES NOT DO IS DECIDE ANYTHING
 *
 * The amounts, the tax split and the number were all fixed by the database at
 * the moment the money moved. Nothing here recomputes them — a document that
 * derives its own totals at render time is a document that can disagree with
 * the ledger it describes, and the ledger is the one that is right.
 */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="text-[14px] text-muted">Sign in to see this document.</p>
        <Link
          href={`/login?next=/wallet/invoices/${id}`}
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background"
        >
          Sign in
        </Link>
      </div>
    );
  }

  /* RLS already limits this to the owner; the explicit filter says out loud
     what the query depends on, because a policy is easy to change without
     reading every query that relied on it. */
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, number, kind, issued_at, total_paise, taxable_paise, tax_paise, tax_rate_bp, narration",
    )
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!data) notFound();
  const invoice = data as Invoice;

  const supplier = supplierParty();
  const disclaimer = taxDisclaimer(invoice);
  const rows = amountRows(invoice);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 print:px-0 print:py-0">
      {/* Screen-only chrome. `print:hidden` keeps the buttons off the paper. */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/wallet/transactions" className="text-[13px] text-muted hover:text-foreground">
          ← Transactions
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-xl border border-border bg-white p-8 text-[#1a1a1a] print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-200 pb-6">
          <div>
            <h1 className="text-[19px] font-semibold">{documentTitle(invoice)}</h1>
            <p className="mt-1 font-mono text-[13px] text-neutral-600">{invoice.number}</p>
            <p className="mt-0.5 text-[12.5px] text-neutral-600">{issuedOn(invoice.issued_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-semibold">{supplier.name}</p>
            {supplier.lines.map((line) => (
              <p key={line} className="text-[12px] leading-relaxed text-neutral-600">
                {line}
              </p>
            ))}
          </div>
        </header>

        <section className="grid gap-6 border-b border-neutral-200 py-6 sm:grid-cols-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
              Billed to
            </p>
            <p className="mt-1.5 text-[13.5px]">
              {(profile?.full_name as string | null) ?? auth.user.email}
            </p>
            {profile?.full_name && (
              <p className="text-[12.5px] text-neutral-600">{auth.user.email}</p>
            )}
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
              For
            </p>
            <p className="mt-1.5 text-[13.5px]">{invoice.narration}</p>
          </div>
        </section>

        <section className="py-6">
          <dl className="ml-auto max-w-xs space-y-2">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className={`flex items-baseline justify-between gap-6 ${
                  i === rows.length - 1 && rows.length > 1
                    ? "border-t border-neutral-300 pt-2 text-[15px] font-semibold"
                    : "text-[13.5px]"
                }`}
              >
                <dt className="text-neutral-600">{row.label}</dt>
                <dd className="font-mono tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {disclaimer && (
          /* Not fine print. See the note in lib/invoice.ts — a customer's
             accountant seeing an 18% line would reasonably assume the tax is
             claimable, and staying quiet about it would be the dishonest
             choice. */
          <p className="border-t border-neutral-200 pt-5 text-[11.5px] leading-relaxed text-neutral-600">
            {disclaimer}
          </p>
        )}

        <footer className="mt-6 border-t border-neutral-200 pt-5 text-[11px] leading-relaxed text-neutral-500">
          <p>
            {company.brand} · closed-loop wallet. Balance is spendable on {company.brand}{" "}
            services only and is not redeemable for cash.
          </p>
          {company.supportEmail && <p className="mt-1">Queries: {company.supportEmail}</p>}
        </footer>
      </article>
    </div>
  );
}
