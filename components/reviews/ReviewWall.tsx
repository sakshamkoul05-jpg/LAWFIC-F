"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Quote, Star } from "lucide-react";

export type Review = {
  id: string;
  slug: string;
  service: string;
  rating: number;
  title: string;
  body: string;
  name: string;
  city: string;
  on: string | null;
};

/**
 * The wall.
 *
 * THE SUMMARY IS A DISTRIBUTION, NOT A SINGLE NUMBER
 *
 * "4.6 stars" tells you almost nothing — it is the same average whether
 * everyone gave a four or half gave a five and half gave a three, and those
 * are entirely different businesses. The bars are the honest version, and
 * they are pressable: tapping the 2-star row shows the two-star reviews.
 *
 * Making the bad rows reachable is the point. A reviews page where the low
 * scores are technically present but three scrolls down reads as a page that
 * would hide them if it could, and a reader who suspects that stops trusting
 * the good ones too.
 *
 * FILTERED BY SERVICE, BECAUSE THAT IS WHAT PEOPLE WANT
 *
 * Somebody on this page is about to buy one specific thing. An average across
 * thirty-nine services does not tell them whether the GST filings go well. The
 * chips are the services that actually have reviews, never the full catalogue
 * — an empty filter is a dead end dressed as a choice.
 */
export default function ReviewWall({
  reviews,
  average,
}: {
  reviews: Review[];
  average: number;
}) {
  const [stars, setStars] = useState<number | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  /* Counts per star, and the services that actually have reviews. Computed
     from the full set so the numbers do not change as filters are applied —
     a distribution that reshapes itself when you touch it is not a
     distribution. */
  const { spread, services } = useMemo(() => {
    const spread = [5, 4, 3, 2, 1].map((n) => ({
      n,
      count: reviews.filter((r) => r.rating === n).length,
    }));
    const byService = new Map<string, { slug: string; service: string; count: number }>();
    for (const r of reviews) {
      const hit = byService.get(r.slug);
      if (hit) hit.count += 1;
      else byService.set(r.slug, { slug: r.slug, service: r.service, count: 1 });
    }
    return {
      spread,
      services: [...byService.values()].sort((a, b) => b.count - a.count),
    };
  }, [reviews]);

  const shown = useMemo(
    () =>
      reviews.filter(
        (r) => (stars === null || r.rating === stars) && (slug === null || r.slug === slug),
      ),
    [reviews, stars, slug],
  );

  const most = Math.max(1, ...spread.map((s) => s.count));

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-12">
        {/* ── the distribution ── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-surface px-6 py-7">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[46px] leading-none tracking-tight text-foreground">
                {average.toFixed(1)}
              </span>
              <span className="text-[13px] text-muted-foreground">out of 5</span>
            </div>

            <Stars value={average} size={16} className="mt-3" />

            <p className="mt-2 text-[12.5px] text-muted-foreground">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}, each on a completed
              filing
            </p>

            <div className="mt-6 flex flex-col gap-1.5">
              {spread.map((row) => {
                const on = stars === row.n;
                return (
                  <button
                    key={row.n}
                    type="button"
                    onClick={() => setStars(on ? null : row.n)}
                    disabled={row.count === 0}
                    aria-pressed={on}
                    aria-label={`${row.count} ${row.n}-star reviews`}
                    className={`group flex items-center gap-3 rounded-lg px-1.5 py-1 transition-colors disabled:opacity-40 ${
                      on ? "bg-primary-lighter" : "hover:bg-surface-2"
                    }`}
                  >
                    <span className="w-9 shrink-0 text-left text-[12px] tabular-nums text-muted-foreground">
                      {row.n} ★
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <motion.span
                        className="block h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(row.count / most) * 100}%` }}
                        transition={{ type: "spring", stiffness: 140, damping: 24 }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right text-[12px] tabular-nums text-subtle">
                      {row.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {(stars !== null || slug !== null) && (
              <button
                type="button"
                onClick={() => {
                  setStars(null);
                  setSlug(null);
                }}
                className="mt-5 w-full rounded-lg border border-border py-2 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* ── the reviews ── */}
        <div>
          {services.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {services.map((s) => {
                const on = slug === s.slug;
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => setSlug(on ? null : s.slug)}
                    aria-pressed={on}
                    className={`inline-flex min-h-[38px] items-center gap-2 rounded-full border px-4 text-[12.5px] transition-colors ${
                      on
                        ? "border-primary bg-primary-lighter text-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.service}
                    <span className="text-subtle">{s.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <p aria-live="polite" className="sr-only">
            Showing {shown.length} of {reviews.length} reviews
          </p>

          {/* Masonry via CSS columns: reviews are wildly different lengths, and
              a grid row is only ever as useful as its tallest card. */}
          <div className="columns-1 gap-5 md:columns-2 [&>*]:mb-5">
            <AnimatePresence mode="popLayout">
              {shown.map((r, i) => (
                <Card key={r.id} review={r} index={i} />
              ))}
            </AnimatePresence>
          </div>

          {shown.length === 0 && (
            <p className="rounded-2xl border border-border bg-surface px-6 py-10 text-center text-[13.5px] text-muted-foreground">
              No reviews match that. Clear the filters to see all of them.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Card({ review, index }: { review: Review; index: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.2) }}
      className="group relative break-inside-avoid rounded-2xl border border-border bg-surface px-6 py-6 transition-colors hover:border-border-3"
    >
      <Quote
        size={30}
        className="absolute right-5 top-5 text-border-2 transition-colors group-hover:text-border-3"
        aria-hidden
      />

      <Stars value={review.rating} size={14} />

      {review.title && (
        <h3 className="mt-3 pr-8 font-display text-[17px] leading-snug tracking-tight text-foreground">
          {review.title}
        </h3>
      )}

      {review.body && (
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{review.body}</p>
      )}

      <footer className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-3 text-[12px] font-medium text-muted-foreground">
          {initial(review.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-foreground">
            {review.name || "A LAWFIC customer"}
          </span>
          <span className="block truncate text-[11.5px] text-subtle">
            {[review.city, review.service].filter(Boolean).join(" · ")}
          </span>
        </span>
        {review.on && (
          <time
            dateTime={review.on}
            className="shrink-0 text-[11px] text-subtle"
            suppressHydrationWarning
          >
            {new Date(review.on).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </time>
        )}
      </footer>
    </motion.article>
  );
}

function initial(name: string): string {
  const t = name.trim();
  return t ? t[0]!.toUpperCase() : "·";
}

/**
 * Stars, including half ones.
 *
 * A 4.6 shown as five filled stars is a rounding error that flatters, and a
 * reader who checks the number against the picture and finds them disagreeing
 * stops trusting both. The clip is a plain overflow-hidden span, which behaves
 * in every browser and needs no SVG mask.
 */
function Stars({
  value,
  size = 15,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex gap-0.5 ${className}`}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-border-3" aria-hidden />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
                aria-hidden
              >
                <Star size={size} className="fill-primary text-primary" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
