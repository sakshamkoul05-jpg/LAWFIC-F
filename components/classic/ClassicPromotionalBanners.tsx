"use client";

import Link from "next/link";
import { promotionalBanners } from "@/lib/promotional";

export default function ClassicPromotionalBanners() {
  const items = [...promotionalBanners, ...promotionalBanners];

  return (
    <section className="overflow-hidden border-b border-border bg-surface/50 py-3">
      <div className="classic-marquee-group relative">
        <div className="classic-marquee-track flex gap-3">
          {items.map((banner, i) => (
            <Link
              key={`${banner.id}-${i}`}
              href={banner.href}
              className="group relative shrink-0"
            >
              <div
                className="flex h-[130px] w-[260px] items-center justify-center overflow-hidden border border-border transition-all duration-300 group-hover:border-primary/30"
              >
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-2 p-5 text-center"
                >
                  <span
                    className="text-[18px] font-bold leading-tight"
                    style={{ color: banner.color }}
                  >
                    {banner.title}
                  </span>
                  <span className="text-[11px] text-muted max-w-[200px]">
                    {banner.label}
                  </span>
                  <span
                    className="mt-1 type-data text-[10px] text-primary"
                  >
                    Explore
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
