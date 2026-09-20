import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminGate } from "../AdminGate";
import JobList from "./JobList";
import type { JobRow } from "./JobForm";

export const metadata: Metadata = {
  title: "Jobs",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Job postings, run from here.
 *
 * STAFF SEE DRAFTS AND EXPIRED POSTINGS; THE PUBLIC SEES NEITHER
 *
 * No filter on `is_live` or `expires_at`. The table's public policy returns
 * only live, unexpired rows, and the staff policy returns everything — so what
 * this page shows and what /jobs shows are the same rule enforced once, in the
 * database, rather than two filters that can disagree.
 *
 * An expired posting is worth seeing here precisely because it is invisible
 * out there: somebody needs to notice it lapsed and decide whether to extend
 * it.
 */
export default async function JobsPage() {
  const supabase = await createClient();
  if (!supabase) return <AdminGate reason="not-connected" />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <AdminGate reason="signed-out" />;

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) return <AdminGate reason="not-staff" userId={auth.user.id} email={auth.user.email} />;

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("posted_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-[24px] font-bold text-foreground">Jobs</h1>
        <div className="mt-6 rounded-2xl border border-border px-5 py-8">
          <p className="text-[14px] text-foreground">The jobs table is not there yet.</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Run{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">
              supabase/migrations/20260921090000_admin_catalogue.sql
            </code>{" "}
            in the Supabase SQL editor, then reload.
          </p>
          <p className="mt-3 font-mono text-[11.5px] text-subtle">{error.message}</p>
        </div>
      </div>
    );
  }

  const jobs = (data ?? []) as JobRow[];
  const now = Date.now();
  const live = jobs.filter(
    (j) => j.is_live && (!j.expires_at || new Date(j.expires_at).getTime() > now),
  ).length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-4 text-[13px]">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          Orders
        </Link>
        <Link href="/admin/customers" className="text-muted-foreground hover:text-foreground">
          Customers
        </Link>
        <Link href="/admin/categories" className="text-muted-foreground hover:text-foreground">
          Categories
        </Link>
        <span className="font-medium text-foreground">Jobs</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-foreground">Jobs</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          {jobs.length} posting{jobs.length === 1 ? "" : "s"}, {live} visible on the site.
          Drafts and lapsed postings are listed here and nowhere else.
        </p>
      </header>

      <JobList jobs={jobs} />
    </div>
  );
}
