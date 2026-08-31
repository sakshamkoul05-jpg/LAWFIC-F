"use client";

import Link from "next/link";
import { promotionalBanners } from "@/lib/promotional";

/**
 * Continuously scrolling marquee of promotional banners.
 * Automatically moves right-to-left. Pauses on hover.
 * Uses CSS marquee animation for smooth, performant motion.
 */
export default function ClassicPromotionalBanners() {
  const items = [...promotionalBanners, ...promotionalBanners];

  return (
    <section className="overflow-hidden border-b border-border bg-surface py-4">
      <div className="classic-marquee-group relative">
        <div className="classic-marquee-track flex gap-4">
          {items.map((banner, i) => (
            <Link
              key={`${banner.id}-${i}`}
              href={banner.href}
              className="group relative shrink-0"
            >
              <div
                className="flex h-[150px] w-[300px] items-center justify-center overflow-hidden rounded-lg border-2 transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02]"
                style={{ borderColor: banner.color }}
              >
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-2 p-5 text-center"
                  style={{ backgroundColor: `${banner.color}08` }}
                >
                  <span
                    className="text-[22px] font-bold leading-tight"
                    style={{ color: banner.color }}
                  >
                    {banner.title}
                  </span>
                  <span className="text-[12px] text-muted max-w-[220px]">
                    {banner.label}
                  </span>
                  <span
                    className="mt-1 inline-block rounded-full px-3 py-1 text-[10px] font-semibold text-white transition-colors"
                    style={{ backgroundColor: banner.color }}
                  >
                    Explore →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
