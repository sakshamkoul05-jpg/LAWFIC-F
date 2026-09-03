import type { Metadata } from "next";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { type OrderStatus, type ServiceOrder } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { AdminGate } from "../AdminGate";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  business_type: string | null;
  created_at: string;
};

type Entry = { user_id: string; balance_after_paise: number; seq: number };

/**
 * Everyone who has signed up, and where each of them stands.
 *
 * The back office already listed ORDERS, which answers "what needs doing" and
 * not "who is this". An agent picking up the phone needs the second: what this
 * person has asked for before, what they have in the wallet, whether anything
 * is waiting on us. So this is the same data pivoted onto the person.
 *
 * A BALANCE IS THE LAST LEDGER ROW, NOT A SUM
 *
 * `wallet_entries.balance_after_paise` is written by the trigger that applies
 * each entry, so the newest row per user already holds the answer. Summing
 * credits and debits here would be a second implementation of the ledger's
 * arithmetic living in a page component, and the day the two disagree the page
 * is what people will believe.
 *
 * Sorted by who is waiting longest on us rather than by who signed up last.
 * A customer list ordered by signup date is a vanity metric; ordered by
 * unanswered work it is a queue.
 */
export default async function CustomersPage() {
  const supabase = await createClient();
  if (!supabase) return <AdminGate reason="not-connected" />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <AdminGate reason="signed-out" />;

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) return <AdminGate reason="not-staff" userId={auth.user.id} email={auth.user.email} />;

  const [{ data: profileData }, { data: orderData }, { data: entryData }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("service_orders").select("*"),
    supabase
      .from("wallet_entries")
      .select("user_id, balance_after_paise, seq")
      .order("seq", { ascending: false }),
  ]);

  const profiles = (profileData ?? []) as Profile[];
  const orders = (orderData ?? []) as ServiceOrder[];
  const entries = (entryData ?? []) as Entry[];

  /* Newest entry per user wins, and the list is already newest-first. */
  const balance = new Map<string, number>();
  for (const e of entries) {
    if (!balance.has(e.user_id)) balance.set(e.user_id, e.balance_after_paise);
  }

  const byUser = new Map<string, ServiceOrder[]>();
  for (const o of orders) {
    const list = byUser.get(o.user_id);
    if (list) list.push(o);
    else byUser.set(o.user_id, [o]);
  }

  /* Waiting on us: submitted needs a quote, paid needs the work starting. */
  const WAITING: OrderStatus[] = ["submitted", "paid"];

  const rows = profiles
    .map((p) => {
      const theirs = byUser.get(p.id) ?? [];
      const waiting = theirs.filter((o) => WAITING.includes(o.status));
      const oldestWait = waiting.reduce<string | null>(
        (acc, o) => (acc === null || o.created_at < acc ? o.created_at : acc),
        null,
      );
      return {
        profile: p,
        orders: theirs,
        waiting: waiting.length,
        oldestWait,
        balancePaise: balance.get(p.id) ?? 0,
      };
    })
    .sort((a, b) => {
      if (a.waiting !== b.waiting) return b.waiting - a.waiting;
      if (a.oldestWait && b.oldestWait) return a.oldestWait.localeCompare(b.oldestWait);
      return b.profile.created_at.localeCompare(a.profile.created_at);
    });

  const totalWaiting = rows.reduce((n, r) => n + r.waiting, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex items-center gap-4 text-[13px]">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          Orders
        </Link>
        <span className="font-medium text-foreground">Customers</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-foreground">
          Customers
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          {rows.length} signed up
          {totalWaiting > 0 && (
            <>
              {" · "}
              <span className="text-primary">{totalWaiting} filing{totalWaiting === 1 ? "" : "s"} waiting on us</span>
            </>
          )}
          . Sorted by who has been waiting longest.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-border px-5 py-10 text-center text-[14px] text-muted-foreground">
          Nobody has signed up yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.profile.id}>
              <Link
                href={`/admin/customers/${r.profile.id}`}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border px-5 py-4 transition-colors hover:border-border-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium text-foreground">
                    {r.profile.full_name ?? "Unnamed account"}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                    {[r.profile.phone, r.profile.city, r.profile.business_type]
                      .filter(Boolean)
                      .join(" · ") || "No details given"}
                  </span>
                </span>

                {r.waiting > 0 && (
                  <span className="rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-medium text-primary">
                    {r.waiting} waiting
                  </span>
                )}

                <span className="text-right">
                  <span className="block font-mono text-[13.5px] tabular-nums text-foreground">
                    {formatPaise(r.balancePaise)}
                  </span>
                  <span className="block text-[11px] text-subtle">wallet</span>
                </span>

                <span className="w-20 text-right">
                  <span className="block font-mono text-[13.5px] tabular-nums text-foreground">
                    {r.orders.length}
                  </span>
                  <span className="block text-[11px] text-subtle">
                    filing{r.orders.length === 1 ? "" : "s"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-[11.5px] leading-relaxed text-subtle">
        Everything here is visible because you are staff. A customer sees only
        their own row, their own ledger and their own filings — the same policies
        enforce both, so this page cannot show more than the database allows.
      </p>
    </div>
  );
}
