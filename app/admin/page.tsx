import type { Metadata } from "next";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { orderTotalPaise, type OrderStatus, type ServiceOrder } from "@/lib/orders";
import { getService } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import OrderRow from "./OrderRow";
import { AdminGate } from "./AdminGate";

export const metadata: Metadata = { title: "Back office", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Work comes first, finished work last. */
const GROUPS: { status: OrderStatus; heading: string; note: string }[] = [
  { status: "submitted", heading: "Needs a quote", note: "The customer is waiting to hear a price." },
  { status: "paid", heading: "Paid — start work", note: "Money is in. File these." },
  { status: "in_progress", heading: "With the registry", note: "Filed, awaiting the certificate." },
  { status: "quoted", heading: "Awaiting payment", note: "Quoted. Nothing to do until they pay." },
  { status: "completed", heading: "Completed", note: "" },
  { status: "rejected", heading: "Closed", note: "" },
];

export default async function AdminPage() {
  const supabase = await createClient();
  if (!supabase) return <AdminGate reason="not-connected" />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return <AdminGate reason="signed-out" />;
  }

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) {
    return <AdminGate reason="not-staff" />;
  }

  // RLS lets staff see every order; a customer sees only their own.
  const { data: orderData } = await supabase
    .from("service_orders")
    .select("*")
    .order("created_at", { ascending: false });

  const orders = (orderData ?? []) as ServiceOrder[];

  // Names for the header line. A missing profile is not an error.
  const userIds = [...new Set(orders.map((o) => o.user_id))];
  const { data: profileData } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", userIds)
    : { data: [] };

  const profiles = new Map(
    (profileData ?? []).map((p: { id: string; full_name: string | null; phone: string | null }) => [
      p.id,
      p,
    ])
  );

  const rows = orders.map((o) => {
    const service = getService(o.service_slug);
    const p = profiles.get(o.user_id);
    return {
      ...o,
      customer_name: p?.full_name ?? null,
      customer_phone: p?.phone ?? null,
      service_name: service?.name ?? o.service_slug,
      suggested_government_rupees: 0,
      suggested_professional_rupees: Math.round(
        Number((service?.fee.professional ?? "0").replace(/[^\d]/g, "")) || 0
      ),
    };
  });

  const needsAction = rows.filter((r) =>
    ["submitted", "paid", "in_progress"].includes(r.status)
  ).length;

  const takenPaise = rows
    .filter((r) => ["paid", "in_progress", "completed"].includes(r.status))
    .reduce((sum, r) => sum + orderTotalPaise(r), 0);

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label text-primary">Back office</p>
              <h1 className="mt-4 font-display text-[32px] leading-tight text-foreground">
                {needsAction === 0 ? "Nothing waiting on you" : `${needsAction} waiting on you`}
              </h1>
            </div>

            <div className="flex items-end gap-8">
              <dl className="flex gap-8">
                <Stat label="Orders" value={String(rows.length)} />
                <Stat label="Collected" value={formatPaise(takenPaise)} />
              </dl>
              <Link
                href="/admin/customers"
                className="rounded-full border border-border px-4 py-2 text-[13px] text-foreground transition-colors hover:border-border-3"
              >
                Customers
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface px-6 py-16 text-center text-[15px] text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <div className="flex flex-col gap-12">
            {GROUPS.map((g) => {
              const group = rows.filter((r) => r.status === g.status);
              if (group.length === 0) return null;
              return (
                <div key={g.status}>
                  <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 className="font-display text-[21px] text-foreground">{g.heading}</h2>
                    <span className="font-mono text-[12px] text-primary tnum">{group.length}</span>
                    {g.note && <span className="text-[13px] text-muted">{g.note}</span>}
                  </div>
                  <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-border bg-border">
                    {group.map((r) => (
                      <OrderRow key={r.id} order={r} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label text-muted">{label}</dt>
      <dd className="mt-1.5 font-mono text-[18px] text-foreground tnum">{value}</dd>
    </div>
  );
}

