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
      <div className="glass-panel mx-auto max-w-lg rounded-2xl p-8 text-center" style={{ color: "var(--wallet-fg)" }}>
        <p className="text-[14px] opacity-60">Sign in to see your statement.</p>
        <Link
          href="/login?next=/wallet/transactions"
          className="mt-5 inline-block rounded-full bg-[#5856d6] px-6 py-2.5 text-[13px] font-medium text-white"
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
    <div className="mx-auto max-w-lg" style={{ color: "var(--wallet-fg)" }}>
      <p className="mb-6 text-center text-[14px] leading-relaxed opacity-40">
        Every credit and debit, itemised.
      </p>
      <TransactionList rows={rows} />
      <p className="mt-5 text-center text-[11px] leading-relaxed opacity-25">
        Balance is usable only for LAWFIC services.
      </p>
    </div>
  );
}

function Empty({ title }: { title: string }) {
  return (
    <div className="glass-panel mx-auto max-w-lg rounded-2xl p-8 text-center" style={{ color: "var(--wallet-fg)" }}>
      <p className="text-[14px] opacity-60">{title}</p>
    </div>
  );
}
