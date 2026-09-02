import type { Metadata } from "next";
import Link from "next/link";
import { formatEntry } from "@/lib/money";
import { isRazorpayConfigured, isRazorpayTestMode } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { normalizePrefs, DEFAULT_PREFS } from "@/lib/wallet-custom";
import WalletCard from "@/components/wallet/WalletCard";
import WalletPocket from "@/components/wallet/WalletPocket";
import WalletDemo from "@/components/wallet/WalletDemo";
import DiceBearAvatar from "@/components/wallet/DiceBearAvatar";

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

  const { data: auth } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!auth.user) return <WalletDemo />;

  const [{ data: balanceData }, { data: entries }, { data: prefsRow }] = await Promise.all([
    supabase.rpc("my_wallet_balance"),
    supabase
      .from("wallet_entries")
      .select("id, direction, amount_paise, reason, created_at, razorpay_payment_id, order_id")
      .order("seq", { ascending: false })
      .limit(6),
    supabase.from("wallet_prefs").select("card_type, avatar_seed").eq("user_id", auth.user.id).maybeSingle(),
  ]);

  const balancePaise = Number(balanceData ?? 0);
  const rows = (entries ?? []) as Entry[];
  const prefs = normalizePrefs(prefsRow) ?? DEFAULT_PREFS;
  const displayName = auth.user.user_metadata?.full_name ?? auth.user.email?.split("@")[0] ?? "there";

  return (
    <div className="mx-auto max-w-lg" style={{ color: "var(--wallet-fg)" }}>
      {isRazorpayTestMode && (
        <p className="mb-6 text-center text-[12px] opacity-40">
          Test mode — no real money moves
        </p>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[13px]" style={{ color: "var(--wallet-fg-muted)" }}>
            Hi, {displayName}
          </p>
          <h1 className="text-[20px] font-semibold tracking-tight">My Wallet</h1>
        </div>
        <DiceBearAvatar seed={prefs.avatarSeed} size={40} />
      </div>

      {/* Card in pocket */}
      <WalletPocket
        cardOut={false}
        onToggleCard={() => {}}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/wallet/topup"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium transition-all duration-200"
              style={{ background: "var(--wallet-btn-bg)", color: "var(--wallet-btn-text)" }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
              Add Balance
            </Link>
            <Link
              href="/wallet/customize"
              className="flex items-center justify-center rounded-xl px-4 py-3 text-[13px] font-medium transition-all duration-200"
              style={{ background: "var(--wallet-btn-bg)", color: "var(--wallet-btn-text)" }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.5 1.5l2 2-9 9H3.5v-2l9-9z" />
              </svg>
            </Link>
          </div>
        }
      >
        <WalletCard prefs={prefs} balancePaise={balancePaise} animateBalance />
      </WalletPocket>

      {/* Quick actions */}
      {/* Three actions, not four. "Transfer" and "Withdraw" were here marked
          "coming soon" — but this wallet is a closed-loop prepaid balance and
          it never pays out: no withdrawal to a bank, no user-to-user transfer,
          no third-party spend. That is the whole basis of the closed-system PPI
          exemption it operates under, so advertising a payout as forthcoming is
          not a harmless placeholder. Do not add them back. */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { label: "Add money", icon: "M8 3v10M3 8h10", href: "/wallet/topup" },
          { label: "Statement", icon: "M4 6h8M4 10h8", href: "/wallet/transactions" },
          { label: "Your filings", icon: "M3 3h10v10H3z", href: "/orders" },
        ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="wallet-glass flex flex-col items-center gap-2.5 rounded-2xl py-4 text-[11px] font-medium transition-all duration-200 hover:scale-[1.03]"
              style={{ color: "var(--wallet-fg)" }}
            >
              <div
                className="flex size-9 items-center justify-center rounded-full"
                style={{ background: "var(--wallet-icon-circle)", color: "var(--wallet-icon-fg)" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={a.icon} />
                </svg>
              </div>
              {a.label}
            </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="wallet-glass mt-8 overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-50">
            Recent
          </p>
          <Link
            href="/wallet/transactions"
            className="text-[12px] font-medium opacity-40 hover:opacity-70 transition-opacity"
          >
            See all
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[14px] opacity-50">Nothing here yet.</p>
            <p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed opacity-35">
              Add money and every credit and debit will appear here.
            </p>
            <Link
              href="/wallet/topup"
              className="mt-5 inline-block rounded-full bg-[#5856d6] px-5 py-2.5 text-[13px] font-medium text-white"
            >
              Add money
            </Link>
          </div>
        ) : (
          <ul style={{ borderColor: "var(--wallet-divider)" }} className="divide-y">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/wallet/transactions/${r.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150"
                  style={{ color: "var(--wallet-fg)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{r.reason}</p>
                    <p className="mt-0.5 font-mono text-[11px] opacity-35">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-mono text-[13px] tabular-nums ${
                      r.direction === "credit" ? "text-[#34c759]" : "opacity-50"
                    }`}
                  >
                    {formatEntry(r.direction, r.amount_paise)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="border-t px-5 py-3 text-[11px] leading-relaxed opacity-25" style={{ borderColor: "var(--wallet-divider)" }}>
          Balance is usable only for LAWFIC services.
        </p>
      </div>

      {!isRazorpayConfigured && (
        <p className="mt-4 text-center text-[12px] opacity-30">
          Payments are not switched on yet.
        </p>
      )}
    </div>
  );
}
