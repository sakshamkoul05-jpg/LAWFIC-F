import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR, formatInvoiceDate } from "@/lib/studio-invoice";
import { AdminGate } from "../AdminGate";

export const metadata: Metadata = {
  title: "Invoices",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Every bill the studio has issued — websites, apps, marketing and the rest —
 * newest first, with a search box. "New invoice" opens the editor.
 */

type Row = {
  id: string;
  number: string;
  issue_date: string;
  client_name: string;
  service: string;
  total_paise: number;
};

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient();
  if (!supabase) return <AdminGate reason="not-connected" />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <AdminGate reason="signed-out" />;

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) return <AdminGate reason="not-staff" userId={auth.user.id} email={auth.user.email} />;

  const { q = "" } = await searchParams;
  const term = q.trim().replace(/[%,()]/g, " ").slice(0, 60);

  let query = supabase
    .from("studio_invoices")
    .select("id, number, issue_date, client_name, service, total_paise")
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  if (term) query = query.or(`client_name.ilike.%${term}%,number.ilike.%${term}%,service.ilike.%${term}%`);
  const { data, error } = await query;
  const rows = (data ?? []) as Row[];
  const missing = !!error && /studio_invoices|does not exist|schema cache/i.test(error.message);

  const sum = rows.reduce((s, r) => s + Number(r.total_paise || 0), 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold text-foreground">Invoices</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Bills for websites, apps, marketing and the studio’s other work, in the LAWFIC invoice design.
          </p>
        </div>
        <Link href="/admin/invoices/new" className="rounded-lg bg-primary px-4 py-2 text-[13.5px] font-medium text-background hover:opacity-90">
          New invoice
        </Link>
      </div>

      {missing ? (
        <div className="mt-8 rounded-2xl border border-border px-5 py-6">
          <p className="text-[14px] text-foreground">Saving invoices needs one table that isn’t set up yet.</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Run{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">supabase/migrations/20261101090000_studio_invoices.sql</code> in
            the Supabase SQL editor, then reload. Until then you can still make and print a bill from “New invoice”; it just won’t be saved.
          </p>
        </div>
      ) : error ? (
        <p className="mt-8 font-mono text-[12px] text-destructive">{error.message}</p>
      ) : (
        <>
          <form className="mt-6 flex gap-2" action="/admin/invoices">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by client, number or service"
              className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-primary/60"
            />
            <button className="rounded-lg border border-border px-3 py-2 text-[13px] text-foreground hover:border-border-3">Search</button>
            {q && (
              <Link href="/admin/invoices" className="self-center text-[13px] text-muted-foreground hover:text-foreground">
                Clear
              </Link>
            )}
          </form>

          {rows.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border px-5 py-10 text-center">
              <p className="text-[14px] text-foreground">{q ? "No invoices match that search." : "No invoices yet."}</p>
              {!q && (
                <Link href="/admin/invoices/new" className="mt-3 inline-block text-[13.5px] text-primary hover:underline">
                  Make the first one
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead className="bg-surface-2 text-[12px] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Number</th>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Client</th>
                    <th className="px-4 py-2.5 font-medium">Service</th>
                    <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link href={`/admin/invoices/${r.id}`} className="hover:text-primary">
                          {r.number}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatInvoiceDate(r.issue_date)}</td>
                      <td className="px-4 py-3 text-foreground">{r.client_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.service}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">{formatINR(Number(r.total_paise))}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link href={`/admin/invoices/${r.id}`} className="text-[12.5px] text-primary hover:underline">
                          Open
                        </Link>
                        <Link href={`/admin/invoices/new?from=${r.id}`} className="ml-3 text-[12.5px] text-muted-foreground hover:text-foreground">
                          Duplicate
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-surface-2 text-[12.5px] text-muted-foreground">
                    <td className="px-4 py-2.5" colSpan={4}>
                      {rows.length} invoice{rows.length === 1 ? "" : "s"}
                      {q ? " matching" : ""}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground">{formatINR(sum)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
