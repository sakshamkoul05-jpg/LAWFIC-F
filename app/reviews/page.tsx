import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getService } from "@/lib/services";
import { absolute, metaDescription } from "@/lib/seo";
import ReviewWall, { type Review } from "@/components/reviews/ReviewWall";
import Reveal from "@/components/ui/Reveal";

/**
 * What customers said.
 *
 * EVERY REVIEW ON THIS PAGE IS ATTACHED TO AN ORDER
 *
 * The table will not accept one otherwise: writing a review requires owning
 * the order it is about, and there can only be one per order. That constraint
 * is the entire reason the page is worth reading. A reviews page anybody can
 * post to is a page nobody believes, including about the reviews that are
 * real — and the first two arrivals are always a competitor and a bot.
 *
 * WHY THERE IS NO REVIEW ON IT YET, AND WHY THAT IS NOT FIXED WITH FILLER
 *
 * LAWFIC has no published reviews. The temptation on a page like this is
 * obvious and it is the one thing that must not happen: inventing "Rajesh from
 * Pune, 5 stars" is a fabricated endorsement of a real company, and the client
 * would be the one holding it when somebody asked to be introduced to Rajesh.
 *
 * So the empty state is designed rather than apologised for. It says what the
 * page will hold, says plainly why it is empty, and points the only people who
 * can change that — customers with a completed order — at the form.
 *
 * NO AGGREGATERATING IN THE STRUCTURED DATA EITHER
 *
 * Google will happily render stars in search results off an AggregateRating,
 * and emitting one with a made-up figure is the same lie with a wider
 * audience. It appears here only once there are real reviews to average, and
 * the count it reports is the count in the table.
 */

export const metadata: Metadata = {
  title: "Customer reviews",
  description: metaDescription(
    "What LAWFIC customers say, on the filings they actually bought. Every review is attached to a completed order.",
  ),
  alternates: { canonical: absolute("/reviews") },
};

export const revalidate = 300;

export default async function ReviewsPage() {
  const supabase = await createClient();

  let reviews: Review[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("reviews")
      .select("id, service_slug, rating, title, body, display_name, city, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(120);

    reviews = ((data ?? []) as RawReview[]).map((r) => ({
      id: r.id,
      slug: r.service_slug,
      /* The service's real name, so a card never shows a slug. A review for a
         service that has since been withdrawn keeps the slug rather than
         disappearing — the review still happened. */
      service: getService(r.service_slug)?.name ?? r.service_slug,
      rating: r.rating,
      title: r.title,
      body: r.body,
      name: r.display_name,
      city: r.city,
      on: r.published_at,
    }));
  }

  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : null;

  return (
    <div className="pb-24">
      {/* ── the header ── */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <Reveal>
            <p className="label text-primary">Reviews</p>
            <h1 className="mt-3 max-w-2xl font-display text-[34px] leading-[1.1] tracking-tight text-foreground sm:text-[46px]">
              What people say, on filings they actually bought
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Every review here is attached to a completed order. You cannot write one for a service
              you have not used, and nobody can write two.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-[12.5px] text-muted-foreground">
                <ShieldCheck size={14} className="text-primary" aria-hidden />
                Tied to an order, one per order
              </span>
              {average !== null && (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-[12.5px] text-muted-foreground">
                  <Star size={14} className="fill-primary text-primary" aria-hidden />
                  {average.toFixed(1)} from {count} {count === 1 ? "review" : "reviews"}
                </span>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {count === 0 ? (
        <EmptyWall connected={Boolean(supabase)} />
      ) : (
        <ReviewWall reviews={reviews} average={average ?? 0} />
      )}

      {/* Only real numbers get structured data. An AggregateRating over zero
          reviews is a fabricated star rating in Google's results. */}
      {average !== null && count > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AggregateRating",
              ratingValue: Number(average.toFixed(2)),
              reviewCount: count,
              bestRating: 5,
              worstRating: 1,
            }),
          }}
        />
      )}
    </div>
  );
}

type RawReview = {
  id: string;
  service_slug: string;
  rating: number;
  title: string;
  body: string;
  display_name: string;
  city: string;
  published_at: string | null;
};

/**
 * The empty state.
 *
 * Designed, not apologised for. It says what will be here, says why it is not
 * yet, and sends the only people who can change that to the place they do it.
 * The alternative — a wall of invented five-star reviews — is a fabricated
 * endorsement of a real company, and the client is the one who has to answer
 * for it when somebody asks to speak to the customer who wrote one.
 */
function EmptyWall({ connected }: { connected: boolean }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <Reveal>
        <div className="rounded-3xl border border-border bg-surface px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="mx-auto flex w-fit gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={20} className="text-border-3" aria-hidden />
            ))}
          </div>

          <h2 className="mt-6 font-display text-[24px] tracking-tight text-foreground sm:text-[28px]">
            No reviews yet
          </h2>

          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {connected
              ? "Nobody has published one yet. Rather than fill this page with examples, it stays empty until a real customer writes the first — an invented review would be worth less than nothing to the people reading it."
              : "This page reads from the reviews table, which is not connected on this deployment yet."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/orders"
              className="inline-flex min-h-[48px] items-center rounded-xl bg-primary px-6 text-[14px] font-medium text-background transition-colors hover:bg-primary-hover"
            >
              Review a filing you have had done
            </Link>
            <Link
              href="/services"
              className="inline-flex min-h-[48px] items-center rounded-xl border border-border px-6 text-[14px] font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              See the services
            </Link>
          </div>

          <p className="mt-6 text-[11.5px] leading-relaxed text-subtle">
            Reviews open from your orders page once a filing is complete.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
