"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { classicTabs } from "@/lib/nav-tabs";

export default function ClassicCategoryTabs() {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <nav
      className="classic-tabs-nav overflow-x-auto border-b border-border bg-surface"
      aria-label="Classic navigation"
      onMouseLeave={() => setOpenId(null)}
    >
      <div className="mx-auto flex min-w-max items-stretch">
        {classicTabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href));
          const open = openId === tab.id;

          return (
            <div
              key={tab.id}
              className="relative"
              onMouseEnter={() => tab.sub.length > 0 && setOpenId(tab.id)}
            >
              <Link
                href={tab.href}
                className={`classic-tab-item group flex flex-col items-center border-r border-border px-3 py-2 text-center transition-colors ${
                  active
                    ? "bg-primary-light text-primary"
                    : "text-foreground hover:bg-surface-2"
                }`}
                style={{ minWidth: 64 }}
              >
                <span className="text-[11px] font-semibold leading-tight whitespace-nowrap">
                  {tab.label}
                </span>
                <span className="mt-0.5 text-[8px] font-medium leading-tight text-success whitespace-nowrap">
                  {tab.sublabel}
                </span>
              </Link>

              {/* Hover sub-tab dropdown */}
              {open && tab.sub.length > 0 && (
                <div className="classic-tabs-dropdown absolute left-0 top-full z-40 w-60 border border-border border-t-0 bg-surface shadow-lg">
                  <p className="border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {tab.label}
                  </p>
                  {tab.sub.map((st) => (
                    <Link
                      key={st.href}
                      href={st.href}
                      onClick={() => setOpenId(null)}
                      className="flex items-center justify-between gap-2 px-4 py-2 text-[12.5px] text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                    >
                      {st.label}
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-subtle" aria-hidden>
                        <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  ))}
                  {!tab.live && (
                    <p className="border-t border-border px-4 py-2 text-[10px] text-subtle">
                      More soon…
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
