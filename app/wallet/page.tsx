import type { Metadata } from "next";
import Link from "next/link";
import { formatEntry } from "@/lib/money";
import { isRazorpayConfigured, isRazorpayTestMode } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/ui/Reveal";
import WalletPanel from "./WalletPanel";

export const metadata: Metadata = {
  title: "Wallet",
  description:
    "A prepaid balance for LAWFIC services, with every debit itemised against the order it paid for.",
};

// Balances must never be served from a cache.
export const dynamic = "force-dynamic";

type Entry = {
  id: string;
  direction: "credit" | "debit";
  amount_paise: number;
  reason: string;
  created_at: string;
  razorpay_payment_id: string | null;
  order_id: string | null;
};

export default async function WalletPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <NotConfigured />;
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    // proxy.ts normally redirects first; this is the belt to that pair of braces.
    return <SignedOut />;
  }

  const [{ data: balanceData }, { data: entries }] = await Promise.all([
    supabase.rpc("my_wallet_balance"),
    supabase
      .from("wallet_entries")
      .select("id, direction, amount_paise, reason, created_at, razorpay_payment_id, order_id")
      .order("seq", { ascending: false })
      .limit(50),
  ]);

  const balancePaise = Number(balanceData ?? 0);
  const rows = (entries ?? []) as Entry[];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <Reveal>
            <div className="flex flex-wrap items-center gap-3">
              <p className="label text-primary">Wallet</p>
              {isRazorpayTestMode && (
                <span className="label rounded-sm border border-border px-2 py-1 text-subtle">
                  Test mode — no real money moves
                </span>
              )}
            </div>
            <h1 className="mt-6 max-w-2xl font-display text-[clamp(32px,4.6vw,48px)] leading-[1.08] text-foreground">
              Top up once. Pay for filings in a tap.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <WalletPanel initialBalancePaise={balancePaise} paymentsReady={isRazorpayConfigured} />

          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <p className="label text-muted">Statement</p>
              <p className="label text-muted">
                {rows.length === 0 ? "No entries yet" : `${rows.length} entries`}
              </p>
            </div>

            {rows.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-[14.5px] text-muted">Nothing here yet.</p>
                <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-subtle">
                  Add money and every credit and debit will be listed here, with the order it
                  paid for.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] text-foreground">{r.reason}</p>
                      <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-subtle">
                        {new Date(r.created_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {r.razorpay_payment_id ? ` · ${r.razorpay_payment_id}` : ""}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 font-mono text-[14px] tabular-nums ${
                        r.direction === "credit" ? "text-success" : "text-foreground"
                      }`}
                    >
                      {formatEntry(r.direction, r.amount_paise)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="border-t border-border px-6 py-4 text-[12px] leading-relaxed text-subtle">
              Every debit names the order it paid for. Government fees and professional fees stay
              on separate lines. Balance is usable only for LAWFIC services — it cannot be
              transferred to another user or withdrawn to a bank account.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="relative min-h-[70vh] overflow-hidden bg-surface">
      <div className="relative z-2 mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <p className="label text-primary">Wallet</p>
        <h1 className="mt-6 max-w-xl font-display text-[clamp(30px,4.2vw,44px)] leading-[1.1] text-foreground">
          {title}
        </h1>
        <div className="mt-7 max-w-lg text-[16px] leading-relaxed text-muted">{children}</div>
      </div>
    </section>
  );
}

function SignedOut() {
  return (
    <Shell title="Sign in to see your wallet">
      <p>Your balance and statement are tied to your account.</p>
      <Link
        href="/login?next=/wallet"
        className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Sign in
      </Link>
    </Shell>
  );
}

function NotConfigured() {
  return (
    <Shell title="The wallet is not connected yet">
      <p>
        This build has no database configured, so there is no balance to show. Add the Supabase
        keys to <code className="font-mono text-[14px] text-foreground">.env.local</code> and the wallet
        comes online — see{" "}
        <code className="font-mono text-[14px] text-foreground">supabase/README.md</code>.
      </p>
    </Shell>
  );
}
