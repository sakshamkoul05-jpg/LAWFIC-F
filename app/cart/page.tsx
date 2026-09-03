import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Services you have lined up, before you commit to filing them.",
};

/* A real page rather than a header icon pointing at a 404.
   It is empty because nothing writes to it yet: adding a service to a cart
   needs a store, and inventing one here would mean two sources of truth the
   day the real one lands. What this page must not do is pretend — so it says
   plainly that the feature is not wired up rather than showing a fake total. */
export default function CartPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-[24px] font-bold tracking-tight text-foreground">
        Your cart is empty
      </h1>
      <p className="mx-auto mt-3 max-w-[36ch] text-[14px] leading-relaxed text-muted-foreground">
        Lining several filings up at once is not switched on yet. For now, start
        a service and we will confirm the fee before anything is charged.
      </p>
      <Link
        href="/services"
        className="mt-7 inline-block rounded-full bg-primary px-6 py-3 text-[14px] font-medium text-background transition-colors hover:bg-primary-hover"
      >
        Browse services
      </Link>
    </div>
  );
}
