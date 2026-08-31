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
      <div className="glass-panel mx-auto max-w-xl rounded-3xl p-8 text-center">
        <p className="text-[15px] text-[#f4f4ee]">The wallet is not connected yet.</p>
      </div>
    );
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return (
      <div className="glass-panel mx-auto max-w-xl rounded-3xl p-8 text-center">
        <p className="text-[15px] text-[#f4f4ee]">Sign in to top up your wallet.</p>
        <Link
          href="/login?next=/wallet/topup"
          className="mt-6 inline-block rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#0b0b0b]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const { data: balanceData } = await supabase.rpc("my_wallet_balance");
  const balancePaise = Number(balanceData ?? 0);

  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-6 text-center text-[15px] leading-relaxed text-[#f4f4ee]/70">
        Top up once with UPI, card or net banking. The money lands in your wallet and pays for
        filings with nothing more to type.
      </p>
      <TopUpForm
        initialBalancePaise={balancePaise}
        paymentsReady={isRazorpayConfigured}
      />
    </div>
  );
}
