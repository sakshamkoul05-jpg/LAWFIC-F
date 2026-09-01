"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { classicTabs, type NavTab } from "@/lib/nav-tabs";

export default function ClassicCategoryTabs() {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const openTab = openId ? classicTabs.find((t) => t.id === openId) : null;

  // Close the dropdown when the user scrolls or resizes.
  useEffect(() => {
    const close = () => setOpenId(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);

  const handleEnter = (tabId: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setAnchorRect({ left: r.left, top: r.bottom, width: r.width });
    setOpenId(tabId);
  };

  const handleLeaveNav = () => {
    setOpenId(null);
    setAnchorRect(null);
  };

  // Keep the fixed panel aligned if the tab moves while open.
  useEffect(() => {
    if (!openId) return;
    const el = document.querySelector<HTMLElement>(`[data-tab-id="${openId}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setAnchorRect({ left: r.left, top: r.bottom, width: r.width });
    }
  }, [openId]);

  return (
    <div
      className="relative"
      onMouseLeave={handleLeaveNav}
    >
      <nav
        ref={navRef}
        className="classic-tabs-nav overflow-x-auto border-b border-border bg-surface"
        aria-label="Classic navigation"
      >
        <div className="mx-auto flex min-w-max items-stretch gap-1 sm:justify-center sm:pr-4">
          {classicTabs.map((tab) => {
            const active =
              pathname === tab.href ||
              (tab.href !== "/" && pathname.startsWith(tab.href));

            return (
              <Link
                key={tab.id}
                href={tab.href}
                data-tab-id={tab.id}
                onMouseEnter={(e) => handleEnter(tab.id, e.currentTarget)}
                className={`classic-tab-item group flex items-center rounded-full px-3 py-1 text-center transition-colors ${
                  active
                    ? "bg-primary-light text-primary"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span className="text-[12px] font-medium leading-tight whitespace-nowrap">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Dropdown rendered as a descendant of the wrapper (so moving the
          pointer into it does not close it) but outside the scroll container
          (so it is not clipped), using fixed viewport coordinates. */}
      {openId && openTab && openTab.sub.length > 0 && anchorRect && (
        <DropdownPanel
          openTab={openTab}
          anchorRect={anchorRect}
          onNavigate={() => {
            setOpenId(null);
            setAnchorRect(null);
          }}
        />
      )}
    </div>
  );
}

function DropdownPanel({
  openTab,
  anchorRect,
  onNavigate,
}: {
  openTab: NavTab;
  anchorRect: { left: number; top: number; width: number };
  onNavigate: () => void;
}) {
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 272 - 8));
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep the panel open while hovering it; closes when leaving panel or nav.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const onEnter = () => {};
    const onLeave = () => onNavigate();
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseleave", onLeave);
      void onEnter;
    };
  }, [onNavigate]);

  return (
    <div
      ref={panelRef}
      className="fixed z-50 max-h-[72vh] w-64 overflow-y-auto border border-border bg-surface shadow-2xl"
      style={{ left, top: anchorRect.top - 1 }}
      onMouseEnter={() => {}}
    >
      <p className="type-label border-b border-border px-4 py-2 text-primary">
        {openTab.label}
      </p>

      {openTab.sub.some((s) => s.group) ? (
        <GroupedList sub={openTab.sub} onNavigate={onNavigate} />
      ) : (
        openTab.sub.map((st) => (
          <Link
            key={st.href}
            href={st.href}
            onClick={onNavigate}
            className="flex items-center justify-between gap-2 px-4 py-2 text-[12.5px] text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            {st.label}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-subtle" aria-hidden>
              <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))
      )}

      {!openTab.live && (
        <p className="border-t border-border px-4 py-2 text-[10px] text-subtle">More soon…</p>
      )}
    </div>
  );
}

function GroupedList({
  sub,
  onNavigate,
}: {
  sub: NavTab["sub"];
  onNavigate: () => void;
}) {
  const groups: { name: string; items: NavTab["sub"] }[] = [];
  for (const st of sub) {
    const g = groups.find((x) => x.name === (st.group ?? "Other"));
    if (g) g.items.push(st);
    else groups.push({ name: st.group ?? "Other", items: [st] });
  }
  return (
    <>
      {groups.map((g) => (
        <div key={g.name}>
          <p className="px-4 pb-1 pt-3 type-label text-subtle">
            {g.name}
          </p>
          {g.items.map((st) => (
            <Link
              key={st.href + st.label}
              href={st.href}
              onClick={onNavigate}
              className="flex items-center justify-between gap-2 px-4 py-[7px] text-[12.5px] text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {st.label}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-subtle" aria-hidden>
                <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}
