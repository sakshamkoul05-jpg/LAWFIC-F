import type { Metadata } from "next";
import Link from "next/link";
import { type OrderStatus, type ServiceOrder } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import CustomerDirectory, { type DirectoryRow } from "@/components/admin/CustomerDirectory";
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

/** What staff_user_directory() returns. See the migration for why it exists. */
type DirectoryEntry = {
  id: string;
  email: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  email_confirmed_at: string | null;
};

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

  /* FOUR QUERIES, ONE ROUND TRIP'S WORTH OF WAITING.
     Sequential awaits here would make the page as slow as the sum of them
     rather than as slow as the slowest. The directory is an RPC over
     auth.users — see the migration for why it is not auth.admin.listUsers(),
     which would be one HTTP call per fifty users. */
  const [
    { data: profileData },
    { data: orderData },
    { data: entryData },
    { data: directoryData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("service_orders").select("*"),
    supabase
      .from("wallet_entries")
      .select("user_id, balance_after_paise, seq")
      .order("seq", { ascending: false }),
    /* Missing until the migration is run. The page degrades to no email and
       no last-login rather than failing, because a directory without those
       two columns is still the directory. */
    supabase.rpc("staff_user_directory"),
  ]);

  const profiles = (profileData ?? []) as Profile[];
  const orders = (orderData ?? []) as ServiceOrder[];
  const entries = (entryData ?? []) as Entry[];
  const directory = new Map<string, DirectoryEntry>();
  for (const d of (directoryData ?? []) as DirectoryEntry[]) directory.set(d.id, d);

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
      const auth = directory.get(p.id);
      return {
        profile: p,
        orders: theirs,
        waiting: waiting.length,
        oldestWait,
        balancePaise: balance.get(p.id) ?? 0,
        email: auth?.email ?? null,
        lastSignInAt: auth?.last_sign_in_at ?? null,
      };
    })
    .sort((a, b) => {
      if (a.waiting !== b.waiting) return b.waiting - a.waiting;
      if (a.oldestWait && b.oldestWait) return a.oldestWait.localeCompare(b.oldestWait);
      return b.profile.created_at.localeCompare(a.profile.created_at);
    });

  const totalWaiting = rows.reduce((n, r) => n + r.waiting, 0);

  /* Flattened for the client component: it needs strings and numbers, not the
     shape the queries happened to return. */
  const directoryRows: DirectoryRow[] = rows.map((r) => ({
    id: r.profile.id,
    name: r.profile.full_name,
    email: r.email,
    phone: r.profile.phone,
    city: r.profile.city,
    businessType: r.profile.business_type,
    balancePaise: r.balancePaise,
    filings: r.orders.length,
    waiting: r.waiting,
    lastSignInAt: r.lastSignInAt,
    createdAt: r.profile.created_at,
  }));

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

      {/* The rows are handed to a client component so the search box can
          filter between frames instead of making a round trip per keystroke.
          See the note in CustomerDirectory. */}
      <CustomerDirectory rows={directoryRows} />

      <p className="mt-8 text-[11.5px] leading-relaxed text-subtle">
        Everything here is visible because you are staff. A customer sees only
        their own row, their own ledger and their own filings — the same policies
        enforce both, so this page cannot show more than the database allows.
      </p>
    </div>
  );
}
