"use client";

import Link from "next/link";
import { personalizeLine, hasInterests, type UserProfile } from "@/lib/profile";

export default function PersonalizedHero({ profile }: { profile: UserProfile }) {
  const track = personalizeLine(profile);
  const firstName = profile.fullName.split(" ")[0] || "there";

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_50%_50%,rgba(201,168,76,0.05),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="type-label text-primary">Welcome back, {firstName}</p>
            <h1 className="type-h1 mt-3 text-foreground">
              {track}
            </h1>

            {hasInterests(profile) && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {profile.examsPreparing.map((e) => (
                  <span key={e} className="rounded-full border border-primary/20 bg-primary-light px-3 py-1 type-data text-[11px] text-primary">
                    {e}
                  </span>
                ))}
                {profile.jobsLooking.map((j) => (
                  <span key={j} className="rounded-full border border-border bg-surface px-3 py-1 type-data text-[11px] text-muted">
                    {j}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            <QuickLink href="/wallet" title="Your wallet" sub="Top up & track" />
            <QuickLink href="/jobs" title="Jobs" sub="Matched to you" />
            <QuickLink href="/orders" title="Filings" sub="Track applications" />
            <QuickLink href="/profile" title="Profile" sub="Update details" />
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickLink({
  href,
  title,
  sub,
}: {
  href: string;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group border border-border bg-surface p-4 transition-colors hover:border-primary"
    >
      <p className="text-[13px] font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-[11px] text-muted">{sub}</p>
    </Link>
  );
}
