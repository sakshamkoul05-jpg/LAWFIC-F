import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEntry, formatPaise } from "@/lib/money";
import { orderTotalPaise, STATUS_META, type ServiceOrder } from "@/lib/orders";
import { getService } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import { FeeBreakdown, StatusPill, Timeline } from "@/components/orders/OrderBits";
import PayButton from "./PayButton";
import MessageThread from "@/components/orders/MessageThread";
import type { OrderMessage } from "@/lib/messages";
import { markRead } from "../message-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Filing ${id.slice(0, 8)}` };
}

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) notFound();

  // RLS restricts this to the caller's own orders, so no ownership check is
  // needed here — a mistyped id simply returns nothing.
  const { data } = await supabase.from("service_orders").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const order = data as ServiceOrder;

  /* The thread, and a read receipt for anything LAWFIC has said. Marking read
     on render rather than on scroll is the honest reading of "seen": the
     customer has opened the filing the message is about. */
  const { data: messageData } = await supabase
    .from("order_messages")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });
  const messages = (messageData ?? []) as OrderMessage[];
  if (messages.some((m) => m.from_staff && m.read_at === null)) {
    await markRead(order.id);
  }
  const service = getService(order.service_slug);
  const total = orderTotalPaise(order);
  const meta = STATUS_META[order.status];

  const [{ data: balanceData }, { data: entries }] = await Promise.all([
    supabase.rpc("my_wallet_balance"),
    supabase
      .from("wallet_entries")
      .select("id, direction, amount_paise, reason, created_at")
      .eq("order_id", order.id)
      .order("seq", { ascending: false }),
  ]);

  const balancePaise = Number(balanceData ?? 0);
  const ledger = (entries ?? []) as {
    id: string;
    direction: "credit" | "debit";
    amount_paise: number;
    reason: string;
    created_at: string;
  }[];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/orders" className="label text-muted hover:text-foreground">
              Your filings
            </Link>
            <span className="label text-border">/</span>
            <p className="label font-mono text-primary">{order.reference}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="font-display text-[clamp(28px,4vw,42px)] leading-[1.08] text-foreground">
                {service?.name ?? order.service_slug}
              </h1>
              <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">{meta.blurb}</p>
            </div>
            <StatusPill status={order.status} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-10">
            {/* what it costs */}
            <div>
              <p className="label mb-4 text-primary">What it costs</p>
              <FeeBreakdown
                governmentPaise={order.government_fee_paise}
                professionalPaise={order.professional_fee_paise}
                format={formatPaise}
              />

              {order.status === "quoted" && (
                <div className="mt-6">
                  <PayButton
                    orderId={order.id}
                    amountLabel={formatPaise(total)}
                    balancePaise={balancePaise}
                    totalPaise={total}
                  />
                  <p className="mt-3 font-mono text-[12px] text-muted tabular-nums">
                    Wallet balance {formatPaise(balancePaise)}
                  </p>
                </div>
              )}
            </div>

            {/* what you told us */}
            {order.details && (
              <div>
                <p className="label mb-4 text-primary">What you told us</p>
                <p className="rounded border border-border bg-surface-2 px-5 py-4 text-[14px] leading-relaxed text-muted">
                  {order.details}
                </p>
              </div>
            )}

            {/* notes from us */}
            {order.admin_notes && (
              <div>
                <p className="label mb-4 text-primary">From LAWFIC</p>
                <p className="rounded border border-border bg-surface-2 px-5 py-4 text-[14px] leading-relaxed text-muted">
                  {order.admin_notes}
                </p>
              </div>
            )}

            {/* money moved on this order */}
            {ledger.length > 0 && (
              <div>
                <p className="label mb-4 text-primary">Money moved on this filing</p>
                <div className="flex flex-col gap-px overflow-hidden rounded border border-border">
                  {ledger.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-4 bg-surface px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] text-foreground">{e.reason}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-subtle">
                          {new Date(e.created_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 font-mono text-[13.5px] tabular-nums ${
                          e.direction === "credit" ? "text-success" : "text-foreground"
                        }`}
                      >
                        {formatEntry(e.direction, e.amount_paise)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* progress */}
          <div>
            <p className="label mb-6 text-primary">Progress</p>
            <Timeline status={order.status} />

            {service && (
              <div className="mt-10 rounded border border-border bg-surface p-5">
                <p className="label mb-3 text-muted">What we will need</p>
                <ul className="flex flex-col gap-2.5">
                  {service.documents.map((d) => (
                    <li key={d} className="flex gap-2.5 text-[13.5px] leading-relaxed text-muted">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Whatever LAWFIC has said about this filing, and a way to ask.
                Under the progress column on purpose: the question someone has
                is almost always about the step the timeline just showed them. */}
            <MessageThread
              orderId={order.id}
              messages={messages}
              viewerIsStaff={false}
              className="mt-10"
            />
          </div>
        </div>
      </section>
    </>
  );
}
