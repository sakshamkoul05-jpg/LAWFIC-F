import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/money";
import { ACCOUNT_GROUPS, MONEY_ROWS } from "@/lib/account-sections";

/**
 * The customer profile — sheet 3 of the client's blueprint.
 *
 * "Hye <name> / Welcome To Lawfic Family !!" over nine groups: Profile,
 * Wallet, <name> Money, Dash Board, Address, Wish List, Account Privacy, Your
 * Storage File, Your Offline File. Their headings, their rows, their order.
 *
 * IT IS A HUB, NOT A FORM
 *
 * /profile used to be the edit form itself, which is one of the rows in the
 * first group here. The form moved to /profile/edit and this took its place,
 * because everything in the header and the personalised hero that pointed at
 * "your profile" meant the account, not the name field.
 *
 * ROWS WITHOUT A PAGE ARE NOT LINKS
 *
 * Most of what the sheet lists has not been built. Those rows are drawn and
 * marked, not linked: a settings list whose rows lead to a 404 is worse than
 * one that says plainly which parts exist. The reader learns the shape of their
 * account either way and only one version is honest about it.
 */

export const metadata: Metadata = {
  title: "Your account",
  description:
    "Your profile, your wallet, your saved documents and everything LAWFIC holds for you.",
};

export const dynamic = "force-dynamic";

export default async function ProfileHubPage() {
  const supabase = await createClient();

  const { data: auth } = supabase
    ? await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
    : { data: { user: null } };
  const user = auth?.user ?? null;

  let balancePaise: number | null = null;
  if (supabase && user) {
    const { data } = await supabase.rpc("my_wallet_balance");
    balancePaise = Number(data ?? 0);
  }

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    null;
  const firstName = fullName?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-12 sm:px-8">
      <header className="mb-10">
        <h1 className="type-h1 text-foreground">
          {fullName ? `Hi ${fullName}` : "Your account"}
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Welcome to the LAWFIC family.
        </p>
      </header>

      {!user && (
        <div className="mb-10 rounded-2xl border border-border bg-surface px-5 py-5">
          <p className="text-[14px] text-foreground">Sign in to see your account.</p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Everything below is here either way — signing in fills it with your own
            details.
          </p>
          <Link
            href="/login?next=/profile"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-primary-hover"
          >
            Sign in
          </Link>
        </div>
      )}

      {/* ── MONEY ──────────────────────────────────────────────
          The sheet's "<name> Money": the LAWFIC wallet beside a savings
          account, two recurring deposits, an insurance fund and a post office
          account. Only the first is a figure we can know — see MONEY_ROWS for
          why the rest carry a disclaimer instead of a number. */}
      <section aria-labelledby="money-heading" className="mb-10">
        <h2 id="money-heading" className="type-label mb-4 text-subtle">
          {firstName ? `${firstName} money` : "Your money"}
        </h2>

        <div className="overflow-hidden rounded-2xl border border-border">
          <ul className="divide-y divide-border">
            {MONEY_ROWS.map((row) => {
              const isWallet = row.source === "wallet";
              return (
                <li key={row.label}>
                  <div className="flex items-center gap-4 px-5 py-4">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-foreground">
                        {row.label}
                      </span>
                      {!isWallet && (
                        <span className="mt-0.5 block text-[11.5px] text-subtle">
                          Not connected — LAWFIC cannot see accounts at other institutions.
                        </span>
                      )}
                    </span>

                    {isWallet ? (
                      <span className="shrink-0 font-mono text-[14px] tabular-nums text-foreground">
                        {balancePaise === null ? "—" : formatPaise(balancePaise)}
                      </span>
                    ) : (
                      <span className="type-label shrink-0 text-subtle">Not linked</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-3 text-[11.5px] leading-relaxed text-subtle">
          Reading a balance held at a bank, insurer or post office requires a
          licensed Account Aggregator and your explicit consent. LAWFIC is not
          one, and shows only its own wallet.
        </p>
      </section>

      {/* ── THE NINE GROUPS ────────────────────────────────── */}
      <div className="grid gap-8 sm:grid-cols-2">
        {ACCOUNT_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`${group.id}-heading`}>
            <h2 id={`${group.id}-heading`} className="type-label mb-3 text-subtle">
              {group.title}
            </h2>

            <div className="overflow-hidden rounded-2xl border border-border">
              <ul className="divide-y divide-border">
                {group.rows.map((row) => {
                  const body = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-foreground">
                          {row.label}
                        </span>
                        {row.note && (
                          <span className="mt-0.5 block text-[11.5px] text-subtle">
                            {row.note}
                          </span>
                        )}
                      </span>
                      {row.href ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden
                          className="shrink-0 text-subtle"
                        >
                          <path
                            d="M4 2.5l3.5 3.5L4 9.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <span className="type-label shrink-0 text-subtle">Soon</span>
                      )}
                    </>
                  );

                  return (
                    <li key={row.label}>
                      {row.href ? (
                        <Link
                          href={row.href}
                          className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2"
                        >
                          {body}
                        </Link>
                      ) : (
                        /* Not a link and not a button: there is nothing behind
                           it yet, and a control that does nothing when pressed
                           is worse than one that never invited the press. */
                        <div className="flex items-center gap-3 px-5 py-3.5 opacity-60">
                          {body}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
