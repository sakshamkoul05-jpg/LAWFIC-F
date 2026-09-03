import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Saved services",
  description: "Services you have saved to come back to.",
};

/* See the note in app/cart/page.tsx — same reasoning, same honesty. */
export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-[24px] font-bold tracking-tight text-foreground">
        Nothing saved yet
      </h1>
      <p className="mx-auto mt-3 max-w-[36ch] text-[14px] leading-relaxed text-muted-foreground">
        Saving a service to come back to is not switched on yet. Everything we
        file is listed under Services in the meantime.
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
