"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { classicTabs, type NavTab } from "@/lib/nav-tabs";

/**
 * The 21-section navigation strip.
 *
 * A strip this dense lives or dies on restraint, so everything that can be
 * quiet is quiet: no dividers, no pills, no boxes. Inactive tabs are muted
 * text and nothing else; the active one is gold with a hairline underline, so
 * exactly one thing on the bar is loud at a time.
 *
 * Two affordances a 21-item scroller needs and the previous version lacked:
 * the edges fade so it reads as continuing rather than clipped, and the active
 * tab scrolls itself into view on load — otherwise someone landing on
 * /professionalism sees a strip that appears not to contain their page.
 */
export default function ClassicCategoryTabs() {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const scrollerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openTab = openId ? classicTabs.find((t) => t.id === openId) : null;

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname],
  );

  const close = useCallback(() => {
    setOpenId(null);
    setAnchor(null);
  }, []);

  /* Which edges are still hiding tabs. */
  const measureEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft > 4,
      end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    measureEdges();
    const el = scrollerRef.current;
    el?.addEventListener("scroll", measureEdges, { passive: true });
    window.addEventListener("resize", measureEdges);
    return () => {
      el?.removeEventListener("scroll", measureEdges);
      window.removeEventListener("resize", measureEdges);
    };
  }, [measureEdges]);

  /* Bring the current section into view. */
  useEffect(() => {
    const el = scrollerRef.current?.querySelector<HTMLElement>("[data-active='true']");
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  /* A dropdown anchored to the viewport has to close when the page moves. */
  useEffect(() => {
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [close]);

  useEffect(() => close(), [pathname, close]);

  /* A short grace period so the pointer can cross the gap from tab to panel. */
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(close, 140);
  };
  useEffect(() => cancelClose, []);

  const open = (tab: NavTab, el: HTMLElement) => {
    cancelClose();
    if (tab.sub.length === 0) return close();
    const r = el.getBoundingClientRect();
    setAnchor({ left: r.left, top: r.bottom });
    setOpenId(tab.id);
  };

  return (
    <div className="relative border-b border-border bg-surface">
      {/* Edge fades — pure decoration over a scroller, never hit-testable. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-surface to-transparent transition-opacity duration-200 ${
          edges.start ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-surface to-transparent transition-opacity duration-200 ${
          edges.end ? "opacity-100" : "opacity-0"
        }`}
      />

      <nav aria-label="Sections" onMouseLeave={scheduleClose}>
        <div
          ref={scrollerRef}
          className="classic-tabs-nav mx-auto flex max-w-6xl items-stretch overflow-x-auto px-4 sm:px-7"
        >
          {classicTabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                data-active={active}
                aria-current={active ? "page" : undefined}
                onMouseEnter={(e) => open(tab, e.currentTarget)}
                onFocus={(e) => open(tab, e.currentTarget)}
                className={`relative shrink-0 whitespace-nowrap px-3 py-2.5 text-[12.5px] transition-colors ${
                  active
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-px h-px bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {openTab && anchor && openTab.sub.length > 0 && (
        <DropdownPanel
          tab={openTab}
          anchor={anchor}
          onEnter={cancelClose}
          onLeave={scheduleClose}
          onNavigate={close}
        />
      )}
    </div>
  );
}

function DropdownPanel({
  tab,
  anchor,
  onEnter,
  onLeave,
  onNavigate,
}: {
  tab: NavTab;
  anchor: { left: number; top: number };
  onEnter: () => void;
  onLeave: () => void;
  onNavigate: () => void;
}) {
  const WIDTH = 260;
  const left =
    typeof window === "undefined"
      ? anchor.left
      : Math.max(12, Math.min(anchor.left - 12, window.innerWidth - WIDTH - 12));

  const groups: { name: string | null; items: NavTab["sub"] }[] = [];
  for (const item of tab.sub) {
    const name = item.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.items.push(item);
    else groups.push({ name, items: [item] });
  }

  return (
    <div
      role="menu"
      aria-label={tab.label}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ left, top: anchor.top + 6, width: WIDTH }}
      className="fixed z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-surface py-1.5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.35)]"
    >
      {groups.map((group, gi) => (
        <div key={group.name ?? `g${gi}`}>
          {group.name && (
            <p className="type-label px-3.5 pb-1 pt-2.5 text-subtle">{group.name}</p>
          )}
          {group.items.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              role="menuitem"
              onClick={onNavigate}
              className="flex items-center justify-between gap-3 rounded-lg px-3.5 py-2 text-[12.5px] text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <span className="truncate">{item.label}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className="shrink-0 text-subtle"
                aria-hidden
              >
                <path
                  d="M3 2l3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ))}
        </div>
      ))}

      {!tab.live && (
        <p className="mt-1 border-t border-border px-3.5 pb-1 pt-2 text-[10.5px] text-subtle">
          This section is still being written.
        </p>
      )}
    </div>
  );
}
