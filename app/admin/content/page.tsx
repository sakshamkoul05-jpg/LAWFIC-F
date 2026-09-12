import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PROMOTION_COLUMNS, type PromotionRow } from "@/lib/promotions-db";
import { AdminGate } from "../AdminGate";
import BannerRow from "./BannerRow";

export const metadata: Metadata = {
  title: "Home page content",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * The home-page banners, run from here.
 *
 * STAFF SEE DRAFTS; THE PUBLIC DOES NOT
 *
 * This page does not filter on `is_live` at all. The promotions table carries
 * two read policies — one for the public that only returns rows switched on
 * and inside their window, and one for staff that returns everything — so the
 * same query gives a visitor the live carousel and an agent the full list
 * including drafts and expired campaigns. The filtering is in the database
 * where it cannot be forgotten, rather than in whichever query was written
 * most recently.
 *
 * WHEN THE TABLE IS EMPTY
 *
 * The migration seeds the eleven that were in the code, so this should not
 * happen. If it does — migration not yet run — the page says so and names the
 * fallback, because the home page will still be showing eleven banners and an
 * agent editing nothing while the site displays something is the most
 * confusing state available.
 */
export default async function AdminContentPage() {
  const supabase = await createClient();
  if (!supabase) return <AdminGate reason="not-connected" />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <AdminGate reason="signed-out" />;

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) {
    return <AdminGate reason="not-staff" userId={auth.user.id} email={auth.user.email} />;
  }

  const { data, error } = await supabase
    .from("promotions")
    .select(PROMOTION_COLUMNS)
    .order("position", { ascending: true });

  const rows = (data ?? []) as PromotionRow[];
  const live = rows.filter((r) => r.is_live).length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="type-label text-primary">Home page</p>
          <h1 className="type-h1 mt-2 text-foreground">Banners</h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
            The carousel at the top of the home page. Changes appear
            immediately — there is no publish step and no deploy.
          </p>
        </div>
        <p className="type-data text-[13px] text-muted">
          <span className="text-foreground">{live}</span> live of {rows.length}
        </p>
      </header>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
          Could not read the banners: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="mt-6 rounded-lg border border-border bg-surface-2 px-5 py-4">
          <p className="text-[13px] leading-relaxed text-muted">
            This table is empty, which means the <code className="type-data">promotions</code>{" "}
            migration has not been run on this project yet. The home page is
            currently showing the eleven banners compiled into the build, so
            visitors see a carousel even though there is nothing to edit here.
            Run the migrations and this list fills itself.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <ul className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
          {rows.map((row, i) => (
            <BannerRow key={row.id} row={row} index={i} total={rows.length} />
          ))}
        </ul>
      )}

      <p className="mt-6 text-[12px] leading-relaxed text-subtle">
        The colour tones and the drawn motifs live in the code, not here. They
        are a designed set of eleven that has to hold together across the site,
        and a free colour field would let one campaign put a shade on the home
        page that nothing else uses. Copy, links, order and scheduling are all
        editable; the design system is not.{" "}
        <Link href="/" className="text-primary hover:text-primary-hover">
          See the home page
        </Link>
      </p>
    </div>
  );
}
