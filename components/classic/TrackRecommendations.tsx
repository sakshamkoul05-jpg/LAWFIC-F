"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isCompleteProfile, personalizeLine, recommendedServiceSlugs, type UserProfile } from "@/lib/profile";
import { getService } from "@/lib/services";

/**
 * The personalised services strip. Renders nothing for signed-out users or
 * accounts with no interests, so it is safe to drop onto any page. When a
 * complete profile exists it says "your track means these services matter
 * first" and links straight into the live service pages.
 */
export default function TrackRecommendations() {
  const [slugs, setSlugs] = useState<string[] | null>(null);
  const [track, setTrack] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive || !data || !isCompleteProfile(data as UserProfile)) return;
        const p = data as UserProfile;
        const found = recommendedServiceSlugs(p);
        if (found.length === 0) return;
        setSlugs(found);
        setTrack(personalizeLine(p));
        setName(p.fullName.split(" ")[0]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!slugs) return null;

  const rows = slugs
    .map((s) => getService(s))
    .filter((s) => s !== undefined)
    .slice(0, 3);

  if (rows.length === 0) return null;

  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-[16px] font-bold text-foreground">
            Recommended for {name ? `${name} — ` : ""}{track}
          </h2>
          <p className="text-[12px] text-muted">
            The LAWFIC services that matter first on this track, ordered for you.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {rows.map((s) => (
            <Link
              key={s!.slug}
              href={`/services/${s!.slug}`}
              className="group rounded border border-border bg-surface-2 p-4 transition-colors hover:border-primary hover:bg-surface"
            >
              <p className="text-[10px] text-primary font-medium uppercase tracking-wider">
                {s!.category}
              </p>
              <p className="mt-1 text-[14px] font-semibold text-foreground">{s!.name}</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted line-clamp-2">
                {s!.tagline}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-[12px] text-foreground tabular-nums">
                  {s!.fee.professional}
                </span>
                <span className="text-[11px] text-primary transition-transform duration-300 group-hover:translate-x-0.5">
                  View →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}