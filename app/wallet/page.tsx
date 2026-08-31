import type { Metadata } from "next";
import Link from "next/link";
import { formatEntry } from "@/lib/money";
import { isRazorpayConfigured, isRazorpayTestMode } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import BalanceCard from "@/components/wallet/BalanceCard";

export const metadata: Metadata = {
  title: "Wallet",
  description:
    "A prepaid balance for LAWFIC services, with every debit itemised against the order it paid for.",
};

export const dynamic = "force-dynamic";

type Entry = {
  id: string;
  direction: "credit" | "debit";
  amount_paise: number;
  reason: string;
  created_at: string;
};

export default async function WalletPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <Prompt title="The wallet is not connected yet" />;
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <Prompt title="Sign in to see your wallet" />;

  const [{ data: balanceData }, { data: entries }] = await Promise.all([
    supabase.rpc("my_wallet_balance"),
    supabase
      .from("wallet_entries")
      .select("id, direction, amount_paise, reason, created_at, razorpay_payment_id, order_id")
      .order("seq", { ascending: false })
      .limit(6),
  ]);

  const balancePaise = Number(balanceData ?? 0);
  const rows = (entries ?? []) as Entry[];

  return (
    <div className="mx-auto max-w-2xl">
      {isRazorpayTestMode && (
        <p className="mb-5 text-center text-[12.5px] text-[#f4f4ee]/45">
          Test mode — no real money moves
        </p>
      )}

      <BalanceCard balancePaise={balancePaise} entryCount={rows.length} />

      <div className="glass-panel mt-6 overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
            Recent activity
          </p>
          <Link
            href="/wallet/transactions"
            className="text-[13px] font-medium text-[#f4f4ee]/60 hover:text-[#f4f4ee]"
          >
            See all →
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[14.5px] text-[#f4f4ee]/65">Nothing here yet.</p>
            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-[#f4f4ee]/45">
              Add money and every credit and debit will be listed here, each opening into its own
              detail.
            </p>
            <Link
              href="/wallet/topup"
              className="mt-6 inline-block rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#0b0b0b]"
            >
              Add money
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/wallet/transactions/${r.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-[#f4f4ee]">{r.reason}</p>
                    <p className="mt-1 font-mono text-[11px] tracking-[0.04em] text-[#f4f4ee]/40">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-mono text-[14px] tabular-nums ${
                      r.direction === "credit" ? "text-[#7fc98e]" : "text-[#f4f4ee]"
                    }`}
                  >
                    {formatEntry(r.direction, r.amount_paise)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="border-t border-white/10 px-6 py-4 text-[12px] leading-relaxed text-[#f4f4ee]/40">
          Balance is usable only for LAWFIC services — it cannot be transferred to another user or
          withdrawn to a bank account.
        </p>
      </div>

      {!isRazorpayConfigured && (
        <p className="mt-6 text-center text-[12.5px] text-[#f4f4ee]/40">
          Payments are not switched on yet. Add the Razorpay keys and top-ups go live.
        </p>
      )}
    </div>
  );
}

function Prompt({ title }: { title: string }) {
  return (
    <div className="glass-panel mx-auto max-w-xl rounded-3xl p-8 text-center">
      <p className="text-[15px] text-[#f4f4ee]">{title}</p>
      <Link
        href="/login?next=/wallet"
        className="mt-6 inline-block rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#0b0b0b]"
      >
        Sign in
      </Link>
    </div>
  );
}
