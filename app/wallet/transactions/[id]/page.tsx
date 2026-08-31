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
  if (entry.razorpay_payment_id) rows.push(["Payment", entry.razorpay_payment_id]);
  rows.push(["Kind", entry.direction === "credit" ? "Wallet top-up or refund" : "Payment for a filing"]);

  return (
    <div className="mx-auto max-w-lg" style={{ color: "var(--wallet-fg)" }}>
      <Link
        href="/wallet/transactions"
        className="inline-block text-[13px] opacity-50 hover:opacity-80 transition-opacity"
      >
        ← All transactions
      </Link>

      <div className="glass-panel mt-6 overflow-hidden rounded-2xl">
        <div className="px-6 py-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
            {entry.direction === "credit" ? "Credited" : "Debited"}
          </p>
          <p
            className={`mt-2 text-[40px] leading-none tabular-nums tracking-tight font-semibold ${
              entry.direction === "credit" ? "text-[#34c759]" : ""
            }`}
          >
            {formatEntry(entry.direction, entry.amount_paise)}
          </p>
          <p className="mt-3 text-[14px] opacity-70">{entry.reason}</p>
          <p className="mt-1 font-mono text-[11px] opacity-30">
            {new Date(entry.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </p>
        </div>

        <dl style={{ borderColor: "var(--wallet-divider)" }} className="divide-y border-t">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-6 py-3">
              <dt className="text-[11px] uppercase tracking-[0.12em] opacity-35">{k}</dt>
              <dd className="min-w-0 truncate text-right font-mono text-[12px] opacity-70">{v}</dd>
            </div>
          ))}
        </dl>

        <Link
          href="/wallet"
          className="block border-t px-6 py-4 text-center text-[13px] font-medium opacity-50 hover:opacity-80 transition-opacity"
          style={{ borderColor: "var(--wallet-divider)" }}
        >
          {entry.direction === "credit" ? "Spend this balance on a filing →" : "Top up →"}
        </Link>
      </div>
    </div>
  );
}
