import type { Metadata } from "next";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { isRazorpayConfigured, isRazorpayTestMode } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { normalizePrefs, DEFAULT_PREFS } from "@/lib/wallet-custom";
import WalletSection from "@/components/wallet/WalletSection";
import WalletDemo from "@/components/wallet/WalletDemo";
import WalletAvatar from "@/components/wallet/WalletAvatar";
import WalletOnboarding from "@/components/wallet/WalletOnboarding";
import WalletQuickActions from "@/components/wallet/WalletQuickActions";
import WalletActivity, { type ActivityRow } from "@/components/wallet/WalletActivity";
import WalletMenu from "@/components/wallet/WalletMenu";
import MembershipCard from "@/components/account/MembershipCard";

/**
 * The wallet home, rebuilt in CRED's visual language.
 *
 * What that actually means, since "make it look like CRED" is otherwise a mood:
 *
 *   - ONE loud element. The balance. Everything else — labels, dates, hints —
 *     is quiet, small and letterspaced. The old page had a heading, a panel
 *     title, a section label and the number all competing at similar weight;
 *   - the object gets a stage. It sits on a soft pool of light with nothing
 *     beside it, at full column width, because the wallet is the product;
 *   - slabs at a large radius with a hairline and a lit top edge, never boxes
 *     with visible borders;
 *   - money in tabular monospace, so a column of amounts aligns;
 *   - generous vertical rhythm. The sections are far apart on purpose.
 *
 * Borrowed language, not borrowed artwork: none of CRED's marks, colours,
 * illustrations or copy appear here, and the whole thing runs on our own
 * tokens so it still follows the site's theme.
 */

export const metadata: Metadata = {
  title: "Wallet",
  description:
    "A prepaid balance for LAWFIC services, with every debit itemised against the order it paid for.",
};

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const supabase = await createClient();
  if (!supabase) return <WalletDemo />;

  const { data: auth } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!auth.user) return <WalletDemo />;

  /* Month-to-date, for the strip under the actions. Bounded by a limit as well
     as a date so a busy account cannot turn the home page into a full table
     scan. */
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: balanceData }, { data: entries }, { data: monthRows }, { data: prefsRow }] =
    await Promise.all([
      supabase.rpc("my_wallet_balance"),
      supabase
        .from("wallet_entries")
        .select("id, direction, amount_paise, reason, created_at")
        .order("seq", { ascending: false })
        .limit(6),
      supabase
        .from("wallet_entries")
        .select("direction, amount_paise")
        .gte("created_at", monthStart.toISOString())
        .limit(500),
      supabase.from("wallet_prefs").select("*").eq("user_id", auth.user.id).maybeSingle(),
    ]);

  const balancePaise = Number(balanceData ?? 0);
  const rows = (entries ?? []) as ActivityRow[];

  let inPaise = 0;
  let outPaise = 0;
  for (const r of (monthRows ?? []) as { direction: string; amount_paise: number }[]) {
    if (r.direction === "credit") inPaise += r.amount_paise;
    else outPaise += r.amount_paise;
  }

  const prefsInput = prefsRow as Record<string, unknown> | null;
  const prefs =
    normalizePrefs(
      prefsInput && {
        hide: prefsInput.hide,
        plate: prefsInput.plate,
        thread: prefsInput.thread,
        nameplate: prefsInput.nameplate,
        avatarSeed: prefsInput.avatar_seed,
      },
    ) ?? DEFAULT_PREFS;

  const displayName =
    auth.user.user_metadata?.full_name ?? auth.user.email?.split("@")[0] ?? "there";
  const month = monthStart.toLocaleDateString("en-IN", { month: "long" });

  return (
    <div className="mx-auto w-full max-w-[860px]" style={{ color: "var(--wallet-fg)" }}>
      <WalletOnboarding />

      {/* GREETING. Deliberately the smallest thing on the page. */}
      <header className="mb-10 flex items-center justify-between px-1">
        <div>
          <p className="cred-label">Welcome back</p>
          <p className="mt-2 text-[17px] font-medium tracking-tight">{displayName}</p>
        </div>
        <WalletAvatar seed={prefs.avatarSeed} size={44} />
      </header>

      {isRazorpayTestMode && (
        <p className="mb-6 text-center text-[11.5px]" style={{ color: "var(--wallet-fg-muted)" }}>
          Test mode — no real money moves
        </p>
      )}

      {/* THE OBJECT AND THE NUMBER. */}
      <div className="cred-stage">
        <WalletSection
          prefs={prefs}
          balancePaise={balancePaise}
          persist
          lastEntry={
            rows[0] && {
              id: rows[0].id,
              reason: rows[0].reason,
              direction: rows[0].direction,
              amountPaise: rows[0].amount_paise,
            }
          }
          actions={
            <Link
              href="/wallet/topup"
              className="cred-cta rounded-full bg-primary px-8 py-3 text-[13.5px] font-medium text-background transition-colors hover:bg-primary-hover"
            >
              Add money
            </Link>
          }
        />
      </div>

      {/* MONTH TO DATE. Two figures, a hairline between them, no chrome. */}
      <section className="cred-slab mt-16 grid grid-cols-2" aria-label={`${month} so far`}>
        <div className="p-6">
          <p className="cred-label">Added in {month}</p>
          <p className="mt-3 font-mono text-[22px] tabular-nums">{formatPaise(inPaise)}</p>
        </div>
        <div className="border-l p-6" style={{ borderColor: "var(--wallet-divider)" }}>
          <p className="cred-label">Spent in {month}</p>
          <p className="mt-3 font-mono text-[22px] tabular-nums">{formatPaise(outPaise)}</p>
        </div>
      </section>

      <div className="mt-6">
        <WalletQuickActions />
      </div>

      {/* The membership sits above the ledger, because a recurring debit is
          the one movement a customer wants to know about BEFORE it happens
          and the activity list can only show it afterwards. */}
      <div className="mt-16">
        <MembershipCard />
      </div>

      <div className="mt-16">
        <WalletActivity rows={rows} />
      </div>

      <div className="mt-16">
        <p className="cred-label mb-4 px-1">Wallet</p>
        <WalletMenu />
      </div>

      <p
        className="mt-10 px-1 text-[11.5px] leading-relaxed"
        style={{ color: "var(--wallet-fg-muted)" }}
      >
        Balance is usable only for LAWFIC services. It is not transferable, not
        refundable to a third party, and cannot be withdrawn as cash.
        {!isRazorpayConfigured && " Payments are not switched on yet."}
      </p>
    </div>
  );
}
