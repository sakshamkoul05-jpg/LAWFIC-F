import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { normalizePrefs, DEFAULT_PREFS } from "@/lib/wallet-custom";
import CustomizePanel from "./CustomizePanel";

export const metadata: Metadata = {
  title: "Customize wallet",
  description: "Choose your card's material and pin badges to make the LAWFiC wallet yours.",
};

export const dynamic = "force-dynamic";

export default async function CustomizePage() {
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
        <p className="text-[15px] text-[#f4f4ee]">Sign in to customize your wallet card.</p>
        <Link
          href="/login?next=/wallet/customize"
          className="mt-6 inline-block rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#0b0b0b]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const [{ data: balanceData }, { data: prefsRow }] = await Promise.all([
    supabase.rpc("my_wallet_balance"),
    supabase.from("wallet_prefs").select("skin, flairs").eq("user_id", auth.user.id).maybeSingle(),
  ]);

  const balancePaise = Number(balanceData ?? 0);
  const prefs = normalizePrefs(prefsRow) ?? DEFAULT_PREFS;

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-6 text-center text-[15px] leading-relaxed text-[#f4f4ee]/70">
        Your wallet is a card that can be yours — pick a material, pin a few badges, and it
        becomes yours wherever you sign in.
      </p>
      <CustomizePanel initial={prefs} balancePaise={balancePaise} />
    </div>
  );
}
