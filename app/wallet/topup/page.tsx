import type { Metadata } from "next";
import Link from "next/link";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import TopUpForm from "../TopUpForm";

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

  const { data: balanceData } = await supabase.rpc("my_wallet_balance");
  const balancePaise = Number(balanceData ?? 0);

  return (
    <div className="mx-auto max-w-lg" style={{ color: "var(--wallet-fg)" }}>
      <p className="mb-6 text-center text-[14px] leading-relaxed opacity-40">
        Top up with UPI, card or net banking. The money lands in your wallet and pays for filings.
      </p>
      <TopUpForm initialBalancePaise={balancePaise} paymentsReady={isRazorpayConfigured} />
    </div>
  );
}
