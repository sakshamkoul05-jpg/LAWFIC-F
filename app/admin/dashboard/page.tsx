import type { Metadata } from "next";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { membershipFor, paidPlans, priceFor } from "@/lib/subscription";
import {
  revenueByDay,
  revenueByMonth,
  spendByCustomer,
  totals as ledgerTotals,
  type LedgerRow,
} from "@/lib/analytics";
import RevenueChart from "@/components/admin/RevenueChart";
import { AdminGate } from "../AdminGate";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * The numbers, on one screen.
 *
 * WHAT IS ON HERE AND WHY THOSE
 *
 * Orders answers "what needs doing" and Customers answers "who is this". This
 * page answers the third question, the one an owner opens the back office for
 * rather than an agent: how much is owed, how much is held, and how many
 * people are paying us every month.
 *
 * THE WALLET FLOAT IS A LIABILITY, AND IS LABELLED AS ONE
 *
 * The sum of every customer's balance is money LAWFIC is holding and has not
 * earned. Putting it next to revenue under a heading like "total" would make
 * the business look several times its size and would be the single most
 * misleading number it is possible to put on this page. It is shown as what it
 * is: customer money, owed back as services.
 *
 * WHY THE BALANCE IS SUMMED IN CODE AND NOT IN SQL
 *
 * wallet_entries is a ledger, and a customer's balance is the newest row's
 * `balance_after_paise` — not the sum of the amounts, which would count every
 * historical credit. There is no aggregate that expresses "the latest row per
 * user" without a window function, and a `.select()` through the client cannot
 * carry one. So the rows come back newest-first and the first one seen per
 * user wins. At this scale that is cheap; past a few thousand customers it
 * wants a view with `distinct on (user_id)`, and this comment is where to
 * start when it does.
 */

type BalanceRow = { user_id: string; balance_after_paise: number; direction: string; amount_paise: number; created_at: string };
type SubRow = { plan_id: string; billing_period: string; status: string };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  if (!supabase) return <AdminGate reason="not-connected" />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <AdminGate reason="signed-out" />;

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) {
    return <AdminGate reason="not-staff" userId={auth.user.id} email={auth.user.email} />;
  }

  /* Staff RLS on each of these lets one query cover every customer. */
  const [ordersRes, ledgerRes, subsRes, profilesRes, promosRes] = await Promise.all([
    supabase.from("service_orders").select("status, created_at"),
    supabase
      .from("wallet_entries")
      .select("user_id, balance_after_paise, direction, amount_paise, created_at")
      .order("seq", { ascending: false }),
    supabase.from("subscriptions").select("plan_id, billing_period, status"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("promotions").select("is_live"),
  ]);

  const orders = (ordersRes.data ?? []) as { status: string; created_at: string }[];
  const ledger = (ledgerRes.data ?? []) as BalanceRow[];
  const subs = (subsRes.data ?? []) as SubRow[];
  const promos = (promosRes.data ?? []) as { is_live: boolean }[];

  const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  /* Newest row per user is the balance. See the note above. */
  const seen = new Set<string>();
  let floatPaise = 0;
  for (const row of ledger) {
    if (seen.has(row.user_id)) continue;
    seen.add(row.user_id);
    floatPaise += row.balance_after_paise;
  }

  /* The ledger, as the analytics functions want it. Every figure below comes
     off this one read — daily, monthly, per customer and the headline totals —
     rather than four queries asking the database the same question four ways. */
  const entries: LedgerRow[] = ledger.map((r) => ({
    user_id: r.user_id,
    direction: r.direction === "credit" ? "credit" : "debit",
    amount_paise: r.amount_paise,
    created_at: r.created_at,
  }));

  const money = ledgerTotals(entries);
  const daily = revenueByDay(entries, 30);
  const monthly = revenueByMonth(entries, 12);
  const topCustomers = spendByCustomer(entries, 8);

  /* Names for the customer list. A missing profile is not an error — it just
     shows the shortened id, which is still enough to find the account. */
  const topIds = topCustomers.map((c) => c.userId);
  const { data: namesData } = topIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", topIds)
    : { data: [] };
  const names = new Map(
    ((namesData ?? []) as { id: string; full_name: string | null }[]).map((p) => [
      p.id,
      p.full_name,
    ]),
  );

  const activeSubs = subs.filter((s) => s.status === "active" || s.status === "cancelling");
  const pastDue = subs.filter((s) => s.status === "past_due").length;

  /* Recurring revenue, normalised to a month so two billing periods can be
     added together. Fee only — GST is collected on the government's behalf
     and is not LAWFIC's money. */
  const mrrPaise = activeSubs.reduce((sum, s) => {
    const plan = paidPlans().find((p) => p.id === s.plan_id);
    if (!plan) return sum;
    if (s.billing_period === "annual") {
      return sum + Math.round(priceFor(plan.monthlyPaise, "annual").feePaise / 12);
    }
    return sum + plan.monthlyPaise;
  }, 0);

  const needsQuote = byStatus["submitted"] ?? 0;
  const toFile = byStatus["paid"] ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="border-b border-border pb-6">
        <p className="type-label text-primary">Back office</p>
        <h1 className="type-h1 mt-2 text-foreground">Dashboard</h1>
      </header>

      {/* WHAT NEEDS DOING, FIRST AND LOUDEST.
          A dashboard that opens with cumulative totals is a dashboard nobody
          acts on. These two numbers are the ones that change what an agent
          does in the next ten minutes, so they lead and they link. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Action
          href="/admin"
          count={needsQuote}
          label="waiting for a quote"
          note="A customer has asked and heard nothing back."
          urgent={needsQuote > 0}
        />
        <Action
          href="/admin"
          count={toFile}
          label="paid, not yet filed"
          note="Money is in. These are owed work."
          urgent={toFile > 0}
        />
      </div>

      <section className="mt-12">
        <h2 className="type-label text-muted">Money</h2>
        <dl className="mt-4 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Today" value={formatPaise(money.today)} note="Sales since midnight, India time." />
          <Stat label="This month" value={formatPaise(money.month)} note="Sales this calendar month." />
          <Stat
            label="All time"
            value={formatPaise(money.allTime)}
            note="Every wallet debit since launch — work customers have paid for."
          />
          <Stat
            label="Average order"
            value={formatPaise(money.averageOrder)}
            note={`Across ${money.orders} paid order${money.orders === 1 ? "" : "s"}.`}
          />
          <Stat
            label="Membership fees / month"
            value={formatPaise(mrrPaise)}
            note="Active memberships, normalised to a month. Fee only — GST is not ours."
          />
          <Stat
            label="Customer money held"
            value={formatPaise(floatPaise)}
            note="Wallet balances. This is a liability, not revenue: it is owed back as services."
            liability
          />
        </dl>
      </section>

      {/* DAILY FIRST, THEN MONTHLY.
          Thirty days answers "how is trade right now", which is the question
          somebody opening a dashboard on a Tuesday actually has. Twelve months
          answers "is the business growing", which is a question you sit down
          for. */}
      <section className="mt-12 grid gap-6">
        <RevenueChart
          buckets={daily}
          heading="Revenue, last 30 days"
          note="Sales per day, India time. Empty days are drawn."
        />
        <RevenueChart
          buckets={monthly}
          heading="Revenue, last 12 months"
          note="Sales per calendar month, India time."
        />
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="type-label text-muted">Customers by spend</h2>
          <p className="text-[12px] text-subtle">
            What they have SPENT, not what they hold — a large unused balance is
            a liability, not a big customer.
          </p>
        </div>

        {topCustomers.length === 0 ? (
          <p className="mt-4 text-[13px] text-muted">
            Nobody has paid for anything yet. This fills in with the first
            completed order.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="type-label px-5 py-3 text-muted">Customer</th>
                  <th className="type-label px-5 py-3 text-right text-muted">Spent</th>
                  <th className="type-label px-5 py-3 text-right text-muted">Orders</th>
                  <th className="type-label px-5 py-3 text-right text-muted">Last paid</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => {
                  /* The share bar is drawn against the TOP spender, not against
                     the total. Against the total, eight customers each on a
                     twelfth of the business give eight stubs that all look the
                     same; against the leader the list actually ranks. */
                  const share = (c.paise / topCustomers[0].paise) * 100;
                  return (
                    <tr key={c.userId} className="border-b border-border last:border-b-0">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/customers/${c.userId}`}
                          className="text-[13px] text-foreground transition-colors hover:text-primary"
                        >
                          {names.get(c.userId) ?? `${c.userId.slice(0, 8)}…`}
                        </Link>
                        <span
                          aria-hidden
                          className="mt-1.5 block h-[3px] rounded-full bg-primary/70"
                          style={{ width: `${Math.max(share, 2)}%` }}
                        />
                      </td>
                      <td className="type-data px-5 py-3 text-right text-[13px] text-foreground">
                        {formatPaise(c.paise)}
                      </td>
                      <td className="type-data px-5 py-3 text-right text-[13px] text-muted">
                        {c.orders}
                      </td>
                      <td className="px-5 py-3 text-right text-[12px] text-muted">
                        {c.lastAt
                          ? new Date(c.lastAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="type-label text-muted">Memberships</h2>
        {activeSubs.length === 0 ? (
          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            Nobody is subscribed yet. Memberships need Razorpay Subscriptions
            enabled on the account before anyone can join —{" "}
            <Link href="/pricing" className="text-primary hover:text-primary-hover">
              the tiers are live on the pricing page
            </Link>{" "}
            and the checkout says so plainly until then.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="type-label pb-2 pr-4 text-muted">Tier</th>
                  <th className="type-label pb-2 pr-4 text-right text-muted">Members</th>
                  <th className="type-label pb-2 text-right text-muted">Off all</th>
                </tr>
              </thead>
              <tbody>
                {paidPlans().map((plan) => {
                  const n = activeSubs.filter((s) => s.plan_id === plan.id).length;
                  if (n === 0) return null;
                  return (
                    <tr key={plan.id} className="border-b border-border last:border-b-0">
                      <td className="py-2.5 pr-4 text-[13px] text-foreground">{plan.name}</td>
                      <td className="type-data py-2.5 pr-4 text-right text-[13px] text-foreground">{n}</td>
                      <td className="type-data py-2.5 text-right text-[13px] text-muted">
                        {membershipFor(plan.id)?.discountPercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pastDue > 0 && (
          <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
            {pastDue} membership{pastDue === 1 ? "" : "s"} failed to renew. Their
            benefits are paused — worth a call before they cancel.
          </p>
        )}
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="type-label text-muted">Home page</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          {promos.length === 0 ? (
            <>
              The banners table is empty, so the home page is showing the
              eleven compiled into the build. Run the migrations to take
              control of them.
            </>
          ) : (
            <>
              <span className="text-foreground">{promos.filter((p) => p.is_live).length}</span> of{" "}
              {promos.length} banners are live on the home page right now.
            </>
          )}{" "}
          <Link href="/admin/content" className="text-primary hover:text-primary-hover">
            Manage banners
          </Link>
        </p>
      </section>
    </div>
  );
}

function Action({
  href,
  count,
  label,
  note,
  urgent,
}: {
  href: string;
  count: number;
  label: string;
  note: string;
  urgent: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border p-6 transition-colors ${
        urgent ? "border-primary/50 bg-primary-light/40 hover:border-primary" : "border-border bg-surface hover:border-border-3"
      }`}
    >
      <p className={`type-data text-[38px] leading-none ${urgent ? "text-primary" : "text-muted"}`}>
        {count}
      </p>
      <p className="mt-3 text-[13.5px] font-medium text-foreground">{label}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">{note}</p>
    </Link>
  );
}

function Stat({
  label,
  value,
  note,
  liability = false,
}: {
  label: string;
  value: string;
  note: string;
  liability?: boolean;
}) {
  return (
    <div className="bg-surface p-5">
      <dt className="type-label text-muted">{label}</dt>
      <dd>
        <span className={`type-data mt-2 block text-[22px] ${liability ? "text-muted-foreground" : "text-foreground"}`}>
          {value}
        </span>
        <span className="mt-2 block text-[11.5px] leading-relaxed text-subtle">{note}</span>
      </dd>
    </div>
  );
}
