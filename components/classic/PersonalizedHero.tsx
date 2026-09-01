"use client";

import Link from "next/link";
import { personalizeLine, hasInterests, type UserProfile } from "@/lib/profile";

/**
 * The personalised banner shown at the top of the homepage for signed-in users
 * who have completed onboarding. Renders "your track" and the fastest routes
 * into the site for that track.
 */
export default function PersonalizedHero({ profile }: { profile: UserProfile }) {
  const track = personalizeLine(profile);
  const firstName = profile.fullName.split(" ")[0] || "there";

  return (
    <section className="border-b border-border bg-gradient-to-br from-primary-light via-surface to-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="label text-primary">Welcome back, {firstName}</p>
            <h1 className="mt-3 font-display text-[clamp(22px,3.4vw,32px)] font-bold leading-tight text-foreground">
              {track}
            </h1>

            {hasInterests(profile) && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {profile.examsPreparing.map((e) => (
                  <span key={e} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                    {e}
                  </span>
                ))}
                {profile.jobsLooking.map((j) => (
                  <span key={j} className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium text-muted">
                    {j}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <QuickLink href="/wallet" icon="💰" title="Your wallet" sub="Top up & track" />
            <QuickLink href="/jobs" icon="💼" title="Jobs" sub="Matched to you" />
            <QuickLink href="/orders" icon="📋" title="Filings" sub="Track applications" />
            <QuickLink href="/profile" icon="✏️" title="Profile" sub="Update details" />
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickLink({
  href,
  icon,
  title,
  sub,
}: {
  href: string;
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded border border-border bg-surface p-3.5 transition-colors hover:border-primary hover:bg-surface-2"
    >
      <span aria-hidden>{icon}</span>
      <p className="mt-1.5 text-[13px] font-semibold text-foreground">{title}</p>
      <p className="text-[10px] text-muted">{sub}</p>
    </Link>
  );
}