import type { Metadata } from "next";
import Link from "next/link";
import { formatEntry } from "@/lib/money";
import { isRazorpayConfigured, isRazorpayTestMode } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { normalizePrefs, DEFAULT_PREFS } from "@/lib/wallet-custom";
import WalletCard from "@/components/wallet/WalletCard";
import WalletDemo from "@/components/wallet/WalletDemo";

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

  if (!supabase) return <WalletDemo />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <WalletDemo />;

  const [{ data: balanceData }, { data: entries }, { data: prefsRow }] = await Promise.all([
    supabase.rpc("my_wallet_balance"),
    supabase
      .from("wallet_entries")
      .select("id, direction, amount_paise, reason, created_at, razorpay_payment_id, order_id")
      .order("seq", { ascending: false })
      .limit(6),
    supabase.from("wallet_prefs").select("skin, flairs, avatar").eq("user_id", auth.user.id).maybeSingle(),
  ]);

  const balancePaise = Number(balanceData ?? 0);
  const rows = (entries ?? []) as Entry[];
  const prefs = normalizePrefs(prefsRow) ?? DEFAULT_PREFS;

  return (
    <div className="mx-auto max-w-xl">
      {isRazorpayTestMode && (
        <p className="mb-5 text-center text-[12.5px] opacity-50">
          Test mode — no real money moves
        </p>
      )}

      {/* Pocket / cardholder */}
      <div className="wallet-pocket p-4 sm:p-5">
        <WalletCard prefs={prefs} balancePaise={balancePaise} animateBalance />

        {/* Quick actions inside the pocket */}
        <div className="mt-5 flex items-center gap-3">
          <Link
            href="/wallet/topup"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #d4af37, #c79b2c)",
              color: "#0b0b0b",
              boxShadow: "0 4px 16px -4px rgba(212,175,55,0.4)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Add money
          </Link>
          <Link
            href="/wallet/customize"
            className="flex items-center justify-center rounded-2xl border px-4 py-3.5 text-[13px] font-medium transition-colors"
            style={{ borderColor: "var(--wallet-pocket-border)", color: "var(--wallet-scene-fg)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.5 1.5l2 2-9 9H3.5v-2l9-9z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Quick links row */}
      <div className="mt-5 flex gap-3">
        <Link
          href="/wallet/topup"
          className="wallet-glass flex flex-1 items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-white/10"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-[#d4af37]/15 text-[#d4af37]">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium opacity-90">Top up</p>
            <p className="text-[11px] opacity-50">Add funds to your wallet</p>
          </div>
        </Link>
        <Link
          href="/wallet/transactions"
          className="wallet-glass flex flex-1 items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-white/10"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-[#d4af37]/15 text-[#d4af37]">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h10M3 8h7M3 13h4" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium opacity-90">Statement{rows.length > 0 ? ` · ${rows.length}` : ""}</p>
            <p className="text-[11px] opacity-50">See all transactions</p>
          </div>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="wallet-glass mt-5 overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">
            Recent activity
          </p>
          <Link
            href="/wallet/transactions"
            className="text-[12px] font-medium opacity-50 hover:opacity-80 transition-opacity"
          >
            See all →
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[14px] opacity-60">Nothing here yet.</p>
            <p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed opacity-40">
              Add money and every credit and debit will be listed here, each opening into its own detail.
            </p>
            <Link
              href="/wallet/topup"
              className="mt-5 inline-block rounded-full bg-[#d4af37] px-5 py-2.5 text-[13px] font-semibold text-[#0b0b0b]"
            >
              Add money
            </Link>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--wallet-pocket-border)" }}>
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/wallet/transactions/${r.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5"
                >
                  <div className="flex size-10 items-center justify-center rounded-full" style={{ background: "var(--wallet-pocket-bg)" }}>
                    <span className="text-[13px] font-semibold opacity-70">
                      {r.direction === "credit" ? "+" : "−"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium opacity-90">{r.reason}</p>
                    <p className="mt-0.5 font-mono text-[11px] opacity-40">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-mono text-[14px] tabular-nums font-medium ${
                      r.direction === "credit" ? "text-[#4cc38a]" : "opacity-70"
                    }`}
                  >
                    {formatEntry(r.direction, r.amount_paise)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="border-t px-5 py-3.5 text-[11px] leading-relaxed opacity-35" style={{ borderColor: "var(--wallet-pocket-border)" }}>
          Balance is usable only for LAWFIC services — it cannot be transferred or withdrawn.
        </p>
      </div>

      {!isRazorpayConfigured && (
        <p className="mt-5 text-center text-[12px] opacity-40">
          Payments are not switched on yet. Add the Razorpay keys and top-ups go live.
        </p>
      )}
    </div>
  );
}
