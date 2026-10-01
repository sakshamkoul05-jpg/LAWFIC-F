import type { Metadata } from "next";
import Link from "next/link";
import { isCashfreeConfigured } from "@/lib/cashfree";
import { createClient } from "@/lib/supabase/server";
import { isWalletLocked } from "@/lib/wallet-lock";
import { redirect } from "next/navigation";
import TopUpForm from "../TopUpForm";
import { checkTopUpAmount } from "@/lib/money";
import { normalizePrefs, DEFAULT_PREFS } from "@/lib/wallet-custom";
import { configFromRow } from "@/lib/wallet3d/config";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Top up wallet",
  description: "Add money to your LAWFiC wallet by UPI, card or net banking.",
  robots: PRIVATE_PAGE_ROBOTS,
};

export const dynamic = "force-dynamic";

/* `?amount=2000` preselects an amount — the home page's "Recharge now" buttons
   link here that way. Anything checkTopUpAmount refuses is simply ignored. */
export default async function TopUpPage({ searchParams }: { searchParams: Promise<{ amount?: string }> }) {
  const { amount: asked } = await searchParams;
  const preset = asked && checkTopUpAmount(Number(asked)).ok ? Number(asked) : undefined;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="glass-panel mx-auto max-w-lg rounded-2xl p-8 text-center" style={{ color: "var(--wallet-fg)" }}>
        <p className="text-[14px] opacity-60">The wallet is not connected yet.</p>
      </div>
    );
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return (
      <div className="glass-panel mx-auto max-w-lg rounded-2xl p-8 text-center" style={{ color: "var(--wallet-fg)" }}>
        <p className="text-[14px] opacity-60">Sign in to top up your wallet.</p>
        <Link
          href="/login?next=/wallet/topup"
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background"
        >
          Sign in
        </Link>
      </div>
    );
  }

  /* THE LOCK. Every route that can reach a balance, a ledger, an invoice or a
     payment calls this — see isWalletLocked for why it is shared rather than
     checked on one page. Redirected to /wallet, where the unlock lives. */
  if (await isWalletLocked(supabase, auth.user.id)) redirect("/wallet");

  const [{ data: balanceData }, { data: prefsRow }] = await Promise.all([
    supabase.rpc("my_wallet_balance"),
    supabase.from("wallet_prefs").select("*").eq("user_id", auth.user.id).maybeSingle(),
  ]);
  const balancePaise = Number(balanceData ?? 0);

  const p = prefsRow as Record<string, unknown> | null;
  const prefs =
    normalizePrefs(
      p && {
        hide: p.hide,
        plate: p.plate,
        thread: p.thread,
        nameplate: p.nameplate,
        avatarSeed: p.avatar_seed,
      },
    ) ?? DEFAULT_PREFS;

  /* Same row, same appearance as the wallet home. Passed down rather than
     fetched on the client so the object does not change material between the
     two screens while a request is in flight. */
  const walletConfig = configFromRow(p);

  return (
    <div className="mx-auto max-w-lg" style={{ color: "var(--wallet-fg)" }}>
      <p className="mb-6 text-center text-[14px] leading-relaxed opacity-40">
        Top up with UPI, card or net banking. The money lands in your wallet and pays for filings.
      </p>
      <TopUpForm
        initialBalancePaise={balancePaise}
        initialAmount={preset}
        paymentsReady={isCashfreeConfigured}
        look={prefs}
        config={walletConfig}
      />
    </div>
  );
}
