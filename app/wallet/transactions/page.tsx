import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WalletEntry } from "@/lib/wallet-entries";
import TransactionList from "./TransactionList";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Your LAWFiC wallet statement — every credit and debit, itemised.",
};

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <Empty title="The wallet is not connected yet" />;
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return (
      <div className="glass-panel mx-auto max-w-xl rounded-3xl p-8 text-center">
        <p className="text-[15px] text-[#f4f4ee]">Sign in to see your statement.</p>
        <Link
          href="/login?next=/wallet/transactions"
          className="mt-6 inline-block rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#0b0b0b]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const { data: entries } = await supabase
    .from("wallet_entries")
    .select("id, direction, amount_paise, reason, created_at, razorpay_payment_id, order_id")
    .order("seq", { ascending: false })
    .limit(50);

  const rows = (entries ?? []) as WalletEntry[];

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-6 text-center text-[15px] leading-relaxed text-[#f4f4ee]/70">
        Every credit and debit, itemised against the order or payment it relates to.
      </p>
      <TransactionList rows={rows} />
      <p className="mt-6 text-center text-[12px] leading-relaxed text-[#f4f4ee]/40">
        Balance is usable only for LAWFiC services — it cannot be transferred to another user or
        withdrawn to a bank account.
      </p>
    </div>
  );
}

function Empty({ title }: { title: string }) {
  return (
    <div className="glass-panel mx-auto max-w-xl rounded-3xl p-8 text-center">
      <p className="text-[15px] text-[#f4f4ee]">{title}</p>
    </div>
  );
}
