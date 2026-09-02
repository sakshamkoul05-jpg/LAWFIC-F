import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { normalizePrefs, DEFAULT_PREFS } from "@/lib/wallet-custom";
import CustomizePanel from "./CustomizePanel";

export const metadata: Metadata = {
  title: "Customize wallet",
  description: "Pick your card type and create your avatar to make the LAWFiC wallet yours.",
};

export const dynamic = "force-dynamic";

export default async function CustomizePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="wallet-glass mx-auto max-w-lg rounded-2xl p-8 text-center" style={{ color: "var(--wallet-fg)" }}>
        <p className="text-[14px] opacity-60">The wallet is not connected yet.</p>
      </div>
    );
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return (
      <div className="wallet-glass mx-auto max-w-lg rounded-2xl p-8 text-center" style={{ color: "var(--wallet-fg)" }}>
        <p className="text-[14px] opacity-60">Sign in to customize your wallet card.</p>
        <Link
          href="/login?next=/wallet/customize"
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const [{ data: balanceData }, { data: prefsRow }] = await Promise.all([
    supabase.rpc("my_wallet_balance"),
    supabase.from("wallet_prefs").select("card_type, avatar_seed").eq("user_id", auth.user.id).maybeSingle(),
  ]);

  const balancePaise = Number(balanceData ?? 0);
  const prefs = normalizePrefs(prefsRow) ?? DEFAULT_PREFS;

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-8 text-center text-[14px] leading-relaxed opacity-40">
        Pick your card type and create your avatar.
      </p>
      <CustomizePanel initial={prefs} balancePaise={balancePaise} />
    </div>
  );
}
