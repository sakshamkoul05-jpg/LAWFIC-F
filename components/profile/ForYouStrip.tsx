"use client";

import Link from "next/link";
import { useProfile } from "@/components/profile/ProfileProvider";
import { personalizeLine, recommendedServiceSlugs } from "@/lib/profile";
import { getService } from "@/lib/services";

/**
 * A short "for you" band, shown on any page that has room for one.
 *
 * Personalisation used to live in exactly one place — a hero on the home page.
 * Sign in, go anywhere else, and the site forgot who you were. This is the
 * piece that carries it across: the same profile, read from the shared
 * provider, expressed briefly enough to sit on a services list or a document
 * index without taking the page over.
 *
 * It renders nothing at all for signed-out visitors and for anyone who has not
 * finished onboarding. That is the point — a personalised element that falls
 * back to a generic one is just clutter with extra steps.
 */
export default function ForYouStrip({
  /** How many suggestions to show. Pages with less room ask for fewer. */
  limit = 3,
  className = "",
}: {
  limit?: number;
  className?: string;
}) {
  const { profile, personalised } = useProfile();

  if (!personalised || !profile) return null;

  const services = recommendedServiceSlugs(profile)
    .map((slug) => getService(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .slice(0, limit);

  if (services.length === 0) return null;

  const firstName = profile.fullName.split(" ")[0];

  return (
    <section
      aria-label="Suggested for you"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="type-label text-primary">For you, {firstName}</p>
        <p className="text-[12.5px] text-muted-foreground">{personalizeLine(profile)}</p>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {services.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/services/${s.slug}`}
              className="flex h-full flex-col justify-between gap-2 rounded-lg border border-border bg-surface-2/60 p-3.5 transition-colors hover:border-primary/50"
            >
              <span className="text-[13.5px] font-medium leading-snug text-foreground">
                {s.name}
              </span>
              <span className="type-data text-[11.5px] text-primary">{s.turnaround}</span>
            </Link>
          </li>
        ))}
      </ul>

      {profile.city && (
        <p className="mt-3 text-[12px] text-subtle">
          Fees and timelines shown for {profile.city} where they differ by state.
        </p>
      )}
    </section>
  );
}
