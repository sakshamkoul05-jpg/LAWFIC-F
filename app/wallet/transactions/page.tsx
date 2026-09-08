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
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background"
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

      {/* A plain link, not a fetch-and-blob. The browser already knows how to
          save a response with a Content-Disposition, and doing it that way
          means the file is the whole ledger rather than the fifty entries this
          page happens to be holding. */}
      {rows.length > 0 && (
        <div className="mt-6 text-center">
          <a
            href="/api/wallet/statement"
            download
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[13px] text-foreground transition-colors hover:border-border-3"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15.5h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download statement (CSV)
          </a>
        </div>
      )}
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
