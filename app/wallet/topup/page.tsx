import type { Metadata } from "next";
import Link from "next/link";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import TopUpForm from "../TopUpForm";
import { normalizePrefs, DEFAULT_PREFS } from "@/lib/wallet-custom";

export const metadata: Metadata = {
  title: "Top up wallet",
  description: "Add money to your LAWFiC wallet by UPI, card or net banking.",
};

export const dynamic = "force-dynamic";

export default async function TopUpPage() {
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

  return (
    <div className="mx-auto max-w-lg" style={{ color: "var(--wallet-fg)" }}>
      <p className="mb-6 text-center text-[14px] leading-relaxed opacity-40">
        Top up with UPI, card or net banking. The money lands in your wallet and pays for filings.
      </p>
      <TopUpForm initialBalancePaise={balancePaise} paymentsReady={isRazorpayConfigured} look={prefs} />
    </div>
  );
}
