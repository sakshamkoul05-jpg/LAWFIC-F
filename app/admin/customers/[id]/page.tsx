import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEntry, formatPaise } from "@/lib/money";
import { orderTotalPaise, STATUS_META, type ServiceOrder } from "@/lib/orders";
import type { OrderMessage } from "@/lib/messages";
import { getService } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/orders/MessageThread";
import { AdminGate } from "../../AdminGate";

export const metadata: Metadata = {
  title: "Customer",
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

type Entry = {
  id: string;
  direction: "credit" | "debit";
  amount_paise: number;
  balance_after_paise: number;
  reason: string;
  created_at: string;
};

/**
 * One customer: who they are, what they hold, what they have asked for, and the
 * thread for answering them.
 *
 * Everything an agent needs on one screen, because the alternative is three
 * tabs and a phone call reconstructing what the last agent said. The thread is
 * attached to a FILING rather than to the person, so the reply box shows for
 * the filing being discussed — a general "message this customer" box would
 * produce answers with no context, which is exactly the thing that makes a
 * support history useless six months later.
 *
 * If they have more than one filing the newest is the one with the thread open,
 * on the assumption that it is what they are calling about. It is only an
 * assumption, so the others are one click away rather than hidden.
 */
export default async function CustomerPage({
  params,
  searchParams,
}: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const { order: focusParam } = (await searchParams) as { order?: string };

  const supabase = await createClient();
  if (!supabase) return <AdminGate reason="not-connected" />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <AdminGate reason="signed-out" />;

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) return <AdminGate reason="not-staff" userId={auth.user.id} email={auth.user.email} />;

  const [{ data: profileData }, { data: orderData }, { data: entryData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("service_orders")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("wallet_entries")
      .select("id, direction, amount_paise, balance_after_paise, reason, created_at")
      .eq("user_id", id)
      .order("seq", { ascending: false })
      .limit(12),
  ]);

  if (!profileData) notFound();

  const profile = profileData as Profile;
  const orders = (orderData ?? []) as ServiceOrder[];
  const entries = (entryData ?? []) as Entry[];
  const balancePaise = entries[0]?.balance_after_paise ?? 0;

  const focus = orders.find((o) => o.id === focusParam) ?? orders[0] ?? null;

  const { data: messageData } = focus
    ? await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", focus.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const messages = (messageData ?? []) as OrderMessage[];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          Orders
        </Link>
        <span className="opacity-40">/</span>
        <Link href="/admin/customers" className="hover:text-foreground">
          Customers
        </Link>
        <span className="opacity-40">/</span>
        <span className="text-foreground">{profile.full_name ?? "Unnamed"}</span>
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-foreground">
            {profile.full_name ?? "Unnamed account"}
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {[profile.phone, [profile.city, profile.state].filter(Boolean).join(", "), profile.business_type]
              .filter(Boolean)
              .join(" · ") || "No details given"}
          </p>
          <p className="mt-1 text-[11.5px] text-subtle">
            Signed up{" "}
            {new Date(profile.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
            Wallet balance
          </p>
          <p className="mt-1 font-mono text-[28px] font-semibold tabular-nums text-foreground">
            {formatPaise(balancePaise)}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div className="space-y-6">
          {/* Filings */}
          <section className="overflow-hidden rounded-2xl border border-border">
            <h2 className="border-b border-border px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Filings ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                Nothing requested yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {orders.map((o) => {
                  const meta = STATUS_META[o.status];
                  const active = focus?.id === o.id;
                  return (
                    <li key={o.id}>
                      <Link
                        href={`/admin/customers/${id}?order=${o.id}`}
                        aria-current={active ? "true" : undefined}
                        className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2"
                        style={active ? { background: "var(--surface-2)" } : undefined}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-foreground">
                            {getService(o.service_slug)?.name ?? o.service_slug}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11px] text-subtle">
                            {o.reference} · {meta.label}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[13px] tabular-nums text-muted-foreground">
                          {orderTotalPaise(o) > 0 ? formatPaise(orderTotalPaise(o)) : "—"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Statement */}
          <section className="overflow-hidden rounded-2xl border border-border">
            <h2 className="border-b border-border px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Recent statement
            </h2>
            {entries.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                No money has moved.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-foreground">{e.reason}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-subtle">
                        {new Date(e.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 font-mono text-[13px] tabular-nums ${
                        e.direction === "credit" ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      {formatEntry(e.direction, e.amount_paise)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Replying */}
        <div className="lg:sticky lg:top-24">
          {focus ? (
            <>
              <p className="mb-2 text-[12px] text-muted-foreground">
                Replying about{" "}
                <span className="font-medium text-foreground">
                  {getService(focus.service_slug)?.name ?? focus.service_slug}
                </span>{" "}
                <span className="font-mono text-[11px] text-subtle">{focus.reference}</span>
              </p>
              <MessageThread orderId={focus.id} messages={messages} viewerIsStaff />
            </>
          ) : (
            <p className="rounded-2xl border border-border px-5 py-10 text-center text-[13px] leading-relaxed text-muted-foreground">
              Messages hang off a filing, so there is nothing to reply to until
              this customer requests one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
