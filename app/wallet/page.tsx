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

  const { data: auth } = await supabase.auth.getUser();
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
    <div className="mx-auto max-w-xl">
      {isRazorpayTestMode && (
        <p className="mb-5 text-center text-[12.5px] opacity-50">
          Test mode — no real money moves
        </p>
      )}

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[13px] opacity-60">Hi, {displayName}!</p>
          <h1 className="text-[22px] font-bold">My Wallet</h1>
        </div>
        <DiceBearAvatar seed={prefs.avatarSeed} size={44} />
      </div>

      {/* ─── Pocket with card ──────────────────────────────────── */}
      <WalletPocket
        cardOut={false}
        onToggleCard={() => {}}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/wallet/topup"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/20 py-3.5 text-[13px] font-semibold text-white transition-all hover:bg-white/30"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
              Add Balance
            </Link>
            <Link
              href="/wallet/customize"
              className="flex items-center justify-center rounded-2xl bg-white/15 px-4 py-3.5 text-[13px] font-medium text-white transition-colors hover:bg-white/25"
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

      {/* ─── Quick actions ──────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {[
          { label: "Add money", icon: "M8 3v10M3 8h10", href: "/wallet/topup" },
          { label: "Transfer", icon: "M3 8h10M10 4l4 4-4 4", href: "#" },
          { label: "Withdraw", icon: "M3 3h10v10H3zM8 7v4M6 9h4", href: "#" },
          { label: "More", icon: "M4 6h8M4 10h8", href: "/wallet/transactions" },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="wallet-glass flex flex-col items-center gap-2 rounded-2xl py-4 text-[11px] font-medium opacity-80 transition-all hover:opacity-100 hover:scale-105"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-white/15">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={a.icon} />
              </svg>
            </div>
            {a.label}
          </Link>
        ))}
      </div>

      {/* ─── Recent transactions ────────────────────────────────── */}
      <div className="wallet-glass mt-6 overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a78bfa]">
            Latest Transactions
          </p>
          <Link
            href="/wallet/transactions"
            className="text-[12px] font-medium opacity-50 hover:opacity-80 transition-opacity"
          >
            See more →
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[14px] opacity-60">Nothing here yet.</p>
            <p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed opacity-40">
              Add money and every credit and debit will be listed here.
            </p>
            <Link
              href="/wallet/topup"
              className="mt-5 inline-block rounded-full bg-[#7c3aed] px-5 py-2.5 text-[13px] font-semibold text-white"
            >
              Add money
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/wallet/transactions/${r.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-white/10">
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

        <p className="border-t border-white/5 px-5 py-3.5 text-[11px] leading-relaxed opacity-35">
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
