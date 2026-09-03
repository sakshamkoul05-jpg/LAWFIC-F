import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./AdminNav";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The back office is its own product, with its own chrome.
 *
 * It gets none of the shopfront: no twenty-one section strip, no cart, no
 * leather picker, no footer full of service links. A staff member working a
 * queue has no use for any of it, and dressing an internal tool in a storefront
 * makes it read as part of the storefront — which is how someone ends up
 * demoing the customer site to a room and landing on a list of every customer
 * and their wallet balance.
 *
 * The visual difference is the point, not decoration. You should be able to
 * tell from across the room whether the screen someone is looking at is the one
 * customers see.
 *
 * The sign-in door renders bare, because a nav bar offering Orders and
 * Customers to someone who cannot see either is furniture.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = data.user;

  /* Whether to show the nav at all. Not a permission check — the pages each
     re-check `is_staff()` against the database, and RLS holds regardless. This
     only decides whether a bar is drawn. */
  let staff = false;
  if (supabase && user) {
    const { data: isStaff } = await supabase.rpc("is_staff");
    staff = Boolean(isStaff);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {staff && (
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
            <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/lawfic-logo.png" alt="" className="h-7 w-7 object-contain" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-[14px] font-bold tracking-tight text-foreground">
                  LAWFIC
                </span>
                <span className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-primary">
                  Back office
                </span>
              </span>
            </Link>

            <AdminNav />

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden max-w-[22ch] truncate text-[12px] text-muted-foreground sm:block">
                {user?.email}
              </span>
              <Link
                href="/wallet"
                className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Customer site
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      {staff && (
        <footer className="border-t border-border px-4 py-4 text-center sm:px-6">
          <p className="text-[11px] leading-relaxed text-subtle">
            Internal. Everything visible here is visible because the database says
            you are staff — the same policies decide what a customer can see.
          </p>
        </footer>
      )}
    </div>
  );
}
