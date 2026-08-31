import type { Metadata } from "next";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { orderTotalPaise, type ServiceOrder } from "@/lib/orders";
import { getService } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import { StatusPill } from "@/components/orders/OrderBits";

export const metadata: Metadata = { title: "Your filings" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  if (!supabase) return <Empty title="Not connected yet" body="This build has no database configured." />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <Empty title="Sign in to see your filings" body="Your orders are tied to your account." cta />;

  const { data } = await supabase
    .from("service_orders")
    .select("*")
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as ServiceOrder[];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="label text-primary">Your filings</p>
          <h1 className="mt-6 max-w-2xl font-display text-[clamp(30px,4.2vw,44px)] leading-[1.08] text-foreground">
            Everything you have sent us, and where it has got to
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        {orders.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
            <p className="text-[15px] text-muted">You have not started a filing yet.</p>
            <Link
              href="/services"
              className="mt-7 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Browse services
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-border">
            {orders.map((o) => {
              const service = getService(o.service_slug);
              const total = orderTotalPaise(o);
              return (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="group grid gap-4 bg-surface p-6 transition-colors hover:bg-surface-2 md:grid-cols-[1.5fr_1fr_auto] md:items-center md:gap-8"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11.5px] tracking-[0.08em] text-subtle">
                      {o.reference}
                    </p>
                    <h2 className="mt-2 font-display text-[20px] leading-snug text-foreground">
                      {service?.name ?? o.service_slug}
                    </h2>
                    <p className="mt-1.5 text-[13px] text-muted">
                      Started{" "}
                      {new Date(o.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="label text-muted">Amount</p>
                    <p className="mt-1 font-mono text-[14px] text-foreground tabular-nums">
                      {o.professional_fee_paise === null ? "Awaiting quote" : formatPaise(total)}
                    </p>
                  </div>

                  <StatusPill status={o.status} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function Empty({ title, body, cta }: { title: string; body: string; cta?: boolean }) {
  return (
    <section className="relative min-h-[70vh] overflow-hidden bg-surface">
      <div className="relative z-2 mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <p className="label text-primary">Your filings</p>
        <h1 className="mt-6 max-w-xl font-display text-[clamp(28px,4vw,40px)] leading-[1.1] text-foreground">
          {title}
        </h1>
        <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-muted">{body}</p>
        {cta && (
          <Link
            href="/login?next=/orders"
            className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Sign in
          </Link>
        )}
      </div>
    </section>
  );
}
