import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminGate } from "../AdminGate";
import CategoryRow, { type CategoryWithServices } from "./CategoryRow";
import ImportCatalogue from "./ImportCatalogue";
import NewCategory from "./NewCategory";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * The service catalogue, run from here.
 *
 * TWO QUERIES, NOT TWENTY-TWO
 *
 * The obvious shape is a nested select, or a query per category for its
 * services. Both are slower than reading each table once and joining them in
 * memory: one round trip each, in parallel, and the grouping is a loop over a
 * few hundred rows. A page that issues a query per row is a page that gets
 * slower every time somebody adds a category.
 *
 * STAFF SEE DRAFTS; THE PUBLIC DOES NOT
 *
 * No `is_live` filter here. The table carries two read policies — the public
 * one returns live rows only, the staff one returns everything — so this page
 * showing a draft and the site not showing it are the same rule, enforced
 * once, in the database.
 *
 * UNTIL THE MIGRATION IS RUN
 *
 * The tables do not exist, the reads fail, and the page says so rather than
 * rendering an empty catalogue that looks like somebody deleted everything.
 */
export default async function CategoriesPage() {
  const supabase = await createClient();
  if (!supabase) return <AdminGate reason="not-connected" />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <AdminGate reason="signed-out" />;

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) return <AdminGate reason="not-staff" userId={auth.user.id} email={auth.user.email} />;

  const [{ data: categoryData, error: categoryError }, { data: serviceData }] = await Promise.all([
    supabase.from("categories").select("*").order("position"),
    supabase.from("category_services").select("*").order("position"),
  ]);

  if (categoryError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-[24px] font-bold text-foreground">Categories</h1>
        <div className="mt-6 rounded-2xl border border-border px-5 py-8">
          <p className="text-[14px] text-foreground">The catalogue tables are not there yet.</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Run{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">
              supabase/migrations/20260921090000_admin_catalogue.sql
            </code>{" "}
            in the Supabase SQL editor, then reload. Until then the site serves the
            catalogue compiled into the build, which is why nothing on it looks broken.
          </p>
          <p className="mt-3 font-mono text-[11.5px] text-subtle">{categoryError.message}</p>
        </div>
      </div>
    );
  }

  type ServiceRow = CategoryWithServices["services"][number] & { category_id: string };

  const services = (serviceData ?? []) as ServiceRow[];
  const byCategory = new Map<string, ServiceRow[]>();
  for (const s of services) {
    const list = byCategory.get(s.category_id);
    if (list) list.push(s);
    else byCategory.set(s.category_id, [s]);
  }

  const categories = ((categoryData ?? []) as CategoryWithServices[]).map((c) => ({
    ...c,
    services: byCategory.get(c.id) ?? [],
  }));

  const liveCount = categories.filter((c) => c.is_live).length;
  const serviceCount = services.length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-4 text-[13px]">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          Orders
        </Link>
        <Link href="/admin/customers" className="text-muted-foreground hover:text-foreground">
          Customers
        </Link>
        <span className="font-medium text-foreground">Categories</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-foreground">
          Categories
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          {categories.length} categor{categories.length === 1 ? "y" : "ies"}, {liveCount} live ·{" "}
          {serviceCount} service{serviceCount === 1 ? "" : "s"}. These drive the menu, the
          footer, the home page grid and what the search box can find.
        </p>
      </header>

      <NewCategory />

      {categories.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border px-5 py-10 text-center">
          <p className="text-[14px] text-muted-foreground">
            No categories in the database yet. The site is serving the catalogue
            compiled into the build, which is why nothing out there looks broken.
          </p>
          <div className="mt-5">
            <ImportCatalogue />
          </div>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {categories.map((c, i) => (
            <li key={c.id}>
              <CategoryRow
                category={c}
                isFirst={i === 0}
                isLast={i === categories.length - 1}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
