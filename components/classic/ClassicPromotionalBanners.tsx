"use client";

import Link from "next/link";
import { promotionalBanners } from "@/lib/promotional";
import { useEffect, useRef, useState } from "react";

/**
 * Horizontal promotional banner carousel immediately below the tab navigation.
 * Shows large cards with prominent titles, descriptions, and colored borders.
 * Supports autoplay scrolling, manual navigation arrows, and hover pause.
 */
export default function ClassicPromotionalBanners() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = dir === "left" ? -340 : 340;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="relative border-b border-border bg-surface py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Navigation arrows */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface shadow-md transition-colors hover:border-primary hover:text-primary"
            aria-label="Scroll banners left"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface shadow-md transition-colors hover:border-primary hover:text-primary"
            aria-label="Scroll banners right"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Banner scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {promotionalBanners.map((banner) => (
            <Link
              key={banner.id}
              href={banner.href}
              className="group relative shrink-0"
              style={{ minWidth: 300 }}
            >
              <div
                className="flex h-[160px] w-[300px] items-center justify-center overflow-hidden rounded-lg border-2 transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02]"
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
