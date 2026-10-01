"use client";

import Link from "next/link";
import { allServices, categories } from "@/lib/catalogue";
import { services } from "@/lib/services";
import CategoryIcon from "@/components/site/CategoryIcon";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * "Latest Launch In LAWFIC" and "Coming Soon In LAWFIC" — the last two items
 * of the client's running order.
 *
 * Both come straight from the catalogue, so they cannot drift from it: a
 * service with a written page is a launch, everything still marked "soon" is
 * coming. A coming-soon card links nowhere — the catalogue's own rule, so the
 * page never promises a page that does not exist.
 */
const PHOTO: Record<string, string> = {
  aadhaar: "/banners/passport.webp",
  "msme-udyam": "/banners/udyam.webp",
  gst: "/banners/gst.webp",
  pan: "/banners/identity.webp",
};

export default function LaunchAndSoon() {
  const { tx } = useLocale();
  const soon = allServices.filter((s) => s.status === "soon");

  return (
    <>
      <section aria-labelledby="launch-heading" className="home-wrap home-section">
        <div className="home-section-head">
          <h2 id="launch-heading" className="home-section-title">
            {tx("Latest Launch In LAWFIC")}
          </h2>
          <Link href="/services" className="home-section-link">
            {tx("All services")} →
          </Link>
        </div>
        <ul className="home-section-body grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.slug}>
              <Link href={`/services/${s.slug}`} className="home-launch-card group">
                <span className="relative block aspect-[16/9] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={PHOTO[s.slug] ?? "/banners/membership.webp"} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="home-launch-new">{tx("NEW")}</span>
                </span>
                <span className="block p-4">
                  <span className="type-label text-primary">{tx(s.category)}</span>
                  <span className="mt-1.5 block text-[16px] font-semibold leading-snug text-foreground">{tx(s.name)}</span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">{tx(s.tagline)}</span>
                  <span className="mt-3 flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold text-foreground">{s.fee.professional}</span>
                    <span className="text-muted-foreground">{tx(s.turnaround)}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="soon-heading" className="home-band is-tint">
        <div className="home-wrap home-section">
          <h2 id="soon-heading" className="home-section-title">
            {tx("Coming Soon In LAWFIC")}
          </h2>
          <p className="home-section-sub">
            {soon.length} {tx("more services are on the way. Ask about any of them today — we will tell you what we can do.")}
          </p>
          <ul className="home-section-body grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {soon.map((s) => {
              const cat = categories.find((c) => c.id === s.categoryId);
              return (
                <li key={s.slug} className="home-soon-card">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                    {cat && <CategoryIcon name={cat.icon} size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-foreground">{tx(s.name)}</span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">{tx(s.blurb)}</span>
                  </span>
                  <span className="home-soon-chip">{tx("Soon")}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
