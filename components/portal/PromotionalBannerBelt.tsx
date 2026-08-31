"use client";

import Link from "next/link";
import { promotionalBanners } from "@/lib/promotional";

/**
 * A continuously moving horizontal belt of promotional banners.
 *
 * Uses CSS marquee animation. Hover pauses. Seamless loop via duplicated items.
 * Respects prefers-reduced-motion.
 */
export default function PromotionalBannerBelt() {
  const items = [...promotionalBanners, ...promotionalBanners];

  return (
    <section className="overflow-hidden border-y border-border bg-surface py-6">
      <div className="portal-marquee-group relative">
        <div className="portal-marquee-track flex gap-6">
          {items.map((banner, i) => (
            <Link
              key={`${banner.id}-${i}`}
              href={banner.href}
              className="portal-marquee-item group relative shrink-0"
            >
              <div
                className="flex h-[180px] w-[320px] items-center justify-center overflow-hidden rounded-lg border-2 transition-transform duration-300 group-hover:scale-[1.02]"
                style={{ borderColor: banner.color }}
              >
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
                  style={{ backgroundColor: `${banner.color}10` }}
                >
                  <span
                    className="text-[28px] font-bold leading-tight"
                    style={{ color: banner.color }}
                  >
                    {banner.title}
                  </span>
                  <span className="text-[14px] text-muted">{banner.label}</span>
                </div>
              </div>
              <p className="mt-2.5 text-center text-[12px] text-muted">
                {banner.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
