import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEntry } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Transaction ${id.slice(0, 8)}` };
}

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) notFound();

  // RLS restricts this to the caller's own entries, so no ownership check.
  const { data } = await supabase
    .from("wallet_entries")
    .select("id, direction, amount_paise, reason, created_at, razorpay_payment_id, order_id")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const entry = data as {
    id: string;
    direction: "credit" | "debit";
    amount_paise: number;
    reason: string;
    created_at: string;
    razorpay_payment_id: string | null;
    order_id: string | null;
  };

  const rows: [string, string][] = [
    ["Date", new Date(entry.created_at).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })],
    ["Direction", entry.direction === "credit" ? "Credit" : "Debit"],
    ["Reference", entry.id.slice(0, 12) + "…"],
  ];
  if (entry.order_id) rows.push(["Order", entry.order_id.slice(0, 12) + "…"]);
  if (entry.razorpay_payment_id)
    rows.push(["Payment", entry.razorpay_payment_id]);
  rows.push(["Kind", entry.direction === "credit" ? "Wallet top-up or refund" : "Payment for a filing"]);

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/wallet/transactions"
        className="inline-block text-[13px] text-[#d4af37] hover:text-[#e8c86a]"
      >
        ← All transactions
      </Link>

      <div className="glass-panel mt-6 overflow-hidden rounded-3xl">
        <div
          className={`px-6 py-8 text-center ${
            entry.direction === "credit"
              ? "bg-gradient-to-b from-[#d4af37]/10 to-transparent"
              : ""
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f4f4ee]/45">
            {entry.direction === "credit" ? "Credited" : "Debited"}
          </p>
          <p
            className={`mt-2 font-display text-[40px] leading-none tabular-nums ${
              entry.direction === "credit" ? "wallet-gold-text" : "text-[#f4f4ee]"
            }`}
          >
            {formatEntry(entry.direction, entry.amount_paise)}
          </p>
          <p className="mt-3 text-[14px] text-[#f4f4ee]/70">{entry.reason}</p>
          <p className="mt-1 font-mono text-[11px] text-[#f4f4ee]/35">
            {new Date(entry.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </p>
        </div>

        <dl className="divide-y divide-white/10 border-t border-white/10">
          {rows.map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between gap-4 px-6 py-3.5"
            >
              <dt className="text-[12.5px] uppercase tracking-[0.12em] text-[#f4f4ee]/40">
                {k}
              </dt>
              <dd className="min-w-0 truncate text-right font-mono text-[13px] text-[#f4f4ee]/85">
                {v}
              </dd>
            </div>
          ))}
        </dl>

        <Link
          href="/wallet"
          className="block border-t border-white/10 px-6 py-5 text-center text-[13px] font-medium text-[#d4af37] hover:text-[#e8c86a]"
        >
          {entry.direction === "credit" ? "Spend this balance on a filing →" : "Top up →"}
        </Link>
      </div>
    </div>
  );
}
