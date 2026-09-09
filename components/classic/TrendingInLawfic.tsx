"use client";

import Link from "next/link";
import { TRENDING } from "@/lib/blueprint";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * "Tranding In LAWFIC !!" — section two in the client's running order.
 *
 * Their note asks for a top ten where every row clicks through to its page, and
 * the sheet marks four of them out as TREND #1 to #4. So the first four are
 * given cards and the remaining six a numbered list: ten cards would be a wall
 * of identical tiles and the ranking would stop meaning anything, which is the
 * one thing a top ten is for.
 *
 * The order is taken from what LAWFIC actually sells, with the four written
 * services leading. Ranking by invented demand would be a claim about the world
 * rather than about us, and the four at the top are the ones a customer can
 * finish today — which is the more useful thing for a list at the top of a page
 * to be sorted by anyway.
 */
export default function TrendingInLawfic() {
  const { tx } = useLocale();
  const [featured, rest] = [TRENDING.slice(0, 4), TRENDING.slice(4)];

  return (
    <section
      id="trending"
      aria-labelledby="trending-heading"
      className="mx-auto max-w-7xl px-4 py-14 sm:px-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="trending-heading" className="type-h2 text-foreground">
          {tx("Trending in LAWFIC")}
        </h2>
        <Link
          href="/services"
          className="text-[13px] font-medium text-primary transition-colors hover:text-primary-hover"
        >
          {tx("All services")} →
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((t) => (
          <Link
            key={t.rank}
            href={t.href}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-3"
          >
            {/* The rank, set large and quiet behind the words. It carries the
                ordering without another line of type competing for the eye. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 -top-4 font-mono text-[72px] font-semibold leading-none text-foreground/[0.05]"
            >
              {t.rank}
            </span>
            <p className="type-label text-subtle">{tx(t.section)}</p>
            <h3 className="mt-2 text-[15.5px] font-medium leading-snug text-foreground">
              {tx(t.label)}
            </h3>
            <p className="mt-4 text-[12.5px] text-muted-foreground">
              {tx(t.live ? "Available now" : "Enquire")}
              <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </p>
          </Link>
        ))}
      </div>

      <ol className="mt-4 grid gap-x-8 overflow-hidden rounded-2xl border border-border sm:grid-cols-2">
        {rest.map((t) => (
          <li key={t.rank} className="border-b border-border last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
            <Link
              href={t.href}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2"
            >
              <span className="w-6 shrink-0 font-mono text-[12px] tabular-nums text-subtle">
                {t.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">
                {tx(t.label)}
              </span>
              <span className="type-label shrink-0 text-subtle">{tx(t.section)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
