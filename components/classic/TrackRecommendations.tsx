"use client";

import Link from "next/link";
import { personalizeLine, recommendedServiceSlugs } from "@/lib/profile";
import { getService } from "@/lib/services";
import { useProfile } from "@/components/profile/ProfileProvider";

export default function TrackRecommendations() {
  const { profile, personalised } = useProfile();

  if (!personalised || !profile) return null;

  const slugs = recommendedServiceSlugs(profile);
  if (slugs.length === 0) return null;

  const track = personalizeLine(profile);
  const name = profile.fullName.split(" ")[0];

  const rows = slugs
    .map((s) => getService(s))
    .filter((s) => s !== undefined)
    .slice(0, 3);

  if (rows.length === 0) return null;

  return (
    <section className="border-b border-border bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="type-h3 text-foreground">
            Recommended for {name ? `${name} — ` : ""}{track}
          </h2>
          <p className="text-[12px] text-muted">
            The LAWFIC services that matter first on this track, ordered for you.
          </p>
        </div>

        <div className="grid gap-px sm:grid-cols-3" style={{ gap: "1px" }}>
          {rows.map((s) => (
            <Link
              key={s!.slug}
              href={`/services/${s!.slug}`}
              className="group bg-surface p-5 transition-colors hover:bg-surface-2"
            >
              <p className="type-label text-primary">
                {s!.category}
              </p>
              <p className="mt-2 text-[14px] font-semibold text-foreground">{s!.name}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted line-clamp-2">
                {s!.tagline}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="type-data text-[13px] text-foreground">
                  {s!.fee.professional}
                </span>
                <span className="text-[12px] text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                  View
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
