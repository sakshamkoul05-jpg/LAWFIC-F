import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ENTITY_LABELS, GST_LABELS, profileFromParams, type EntityType, type GstScheme } from "@/lib/compliance/calendar";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo";
import { Card, PageShell } from "@/components/compliance/ui";
import { ConfirmSubmit } from "@/components/compliance/ConfirmSubmit";
import { BusinessForm, type BusinessRow } from "./BusinessForm";
import { deleteBusiness } from "../actions";

/**
 * Your businesses. One login, as many as you run — a CA's office, or the
 * proprietorship and the company that grew out of it. Each has its own
 * calendar, filings and licences on the dashboard.
 */

export const metadata: Metadata = { title: "Your businesses", robots: PRIVATE_PAGE_ROBOTS };
export const dynamic = "force-dynamic";

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/compliance/businesses");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/compliance/businesses");

  const { data } = await supabase.from("businesses").select("*").order("created_at");
  const businesses = (data ?? []) as BusinessRow[];
  const editing = sp.edit ? businesses.find((b) => b.id === sp.edit) : undefined;
  /* Arriving from the free calendar's "Save to my account" carries the
     answers in the URL, so the form opens already filled in. */
  const preset = sp.entity ? profileFromParams((k) => sp[k]) : undefined;

  return (
    <PageShell
      eyebrow="Compliance"
      title="Your businesses"
      lead="Each business gets its own calendar, filings and renewals. Switch between them on the dashboard."
      crumbs={[
        { label: "Dashboard", href: "/compliance" },
        { label: "Businesses", href: "/compliance/businesses" },
      ]}
      width="max-w-3xl"
    >
      {businesses.length > 0 && (
        <ul className="mb-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {businesses.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link href={`/compliance?b=${b.id}`} className="text-[14.5px] text-foreground hover:text-primary">
                  {b.name}
                </Link>
                <p className="mt-0.5 text-[12px] text-subtle">
                  {ENTITY_LABELS[b.entity_type as EntityType]} · {GST_LABELS[b.gst_scheme as GstScheme]}
                  {b.state ? ` · ${b.state}` : ""}
                </p>
              </div>
              <Link href={`/compliance/businesses?edit=${b.id}`} className="text-[12.5px] text-muted hover:text-primary">
                Edit
              </Link>
              <form action={deleteBusiness}>
                <input type="hidden" name="id" value={b.id} />
                <ConfirmSubmit
                  message={`Remove ${b.name}? Its filing record and licences go with it.`}
                  className="text-[12.5px] text-subtle hover:text-destructive"
                >
                  Remove
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <p className="mb-5 text-[15px] text-foreground">{editing ? `Edit ${editing.name}` : "Add a business"}</p>
        <BusinessForm key={editing?.id ?? "new"} business={editing} preset={preset} />
      </Card>
    </PageShell>
  );
}
