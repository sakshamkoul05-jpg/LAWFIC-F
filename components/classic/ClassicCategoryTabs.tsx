"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  classicTabs,
  tabAccent,
  TABS_ROW_ONE,
  TABS_ROW_TWO,
  TAB_GRID_COLUMNS,
  ROW_ONE_SPAN,
  ROW_TWO_SPAN,
  type NavTab,
} from "@/lib/nav-tabs";

/**
 * The 27-section navigation strip, on two rows.
 *
 * One row of twenty-seven only fits by scrolling, and a scroller hides most of
 * its contents at any width: someone landing on /professionalism saw a bar that
 * appeared not to contain their page. Fifteen above and twelve below shows
 * every section at once on a desktop, which for a site whose whole proposition
 * is breadth is worth the extra strip of height. Below the breakpoint the two
 * rows become two scrollers, because two rows of fifteen on a phone is a wall.
 *
 * THE ROWS LINE UP EXACTLY, AND THAT IS ARITHMETIC RATHER THAN NUDGING
 *
 * Fifteen and twelve both divide sixty, so the bar is a sixty-column grid and
 * the rows take four columns and five. Both rows therefore start and end on the
 * same pixel and share a boundary every fifth column. The previous version made
 * one row eleven columns and the other ten — cells of different widths that
 * could never align — and papered over it with half a cell of padding, which
 * is why the two rows visibly drifted.
 *
 * Each tab carries its section's colour as a bottom border. With this many
 * items of identical-looking text the eye has nothing to aim at, so a fixed
 * colour per section is the thing that makes the bar learnable — see TAB_ACCENT
 * for why they are muted rather than bright. The border sits at low opacity
 * until a tab is hovered or current, so the resting strip is still calm.
 */
export default function ClassicCategoryTabs() {
  const pathname = usePathname();
  const { t } = useLocale();
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

  /**
   * The dropdown HOLDS while the pointer is on it.
   *
   * Anything the pointer can land on inside the panel cancels the pending
   * close, so hovering a sub-tab pauses the dismissal rather than racing it.
   * The grace period is 340ms rather than 140: the panel is anchored below the
   * bar with a gap to cross, the rows are dense, and a diagonal move toward a
   * sub-tab in the far corner takes longer than a seventh of a second. Too
   * short and the menu vanishes out from under the pointer on the way to the
   * thing it is aiming at, which reads as the site fighting you.
   */
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(close, 340);
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
        {[TABS_ROW_ONE, TABS_ROW_TWO].map((row, ri) => (
          <div
            key={ri}
            ref={ri === 0 ? scrollerRef : undefined}
            style={{
              ["--tab-cols" as string]: String(TAB_GRID_COLUMNS),
              ["--tab-span" as string]: String(ri === 0 ? ROW_ONE_SPAN : ROW_TWO_SPAN),
            }}
            className={`classic-tabs-nav flex w-full items-stretch overflow-x-auto px-3 sm:px-5 lg:grid lg:grid-cols-[repeat(var(--tab-cols),minmax(0,1fr))] lg:overflow-visible lg:px-6 ${
              ri === 1 ? "border-t border-border/60" : ""
            }`}
          >
            {row.map((tab) => {
              const active = isActive(tab.href);
              const accent = tabAccent(tab.id);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                  onMouseEnter={(e) => open(tab, e.currentTarget)}
                  onFocus={(e) => open(tab, e.currentTarget)}
                  style={{ ["--tab-accent" as string]: accent }}
                  /* Below the breakpoint the row scrolls, so tabs keep their
                     natural width. At lg and up they share the bar evenly and
                     it spans the full page, which is the only arrangement that
                     does not leave a stretch of empty rule after Contact. */
                  className={`group relative shrink-0 truncate whitespace-nowrap px-3 py-2.5 text-center text-[12.5px] transition-colors lg:col-[span_var(--tab-span)] lg:min-w-0 lg:px-1.5 ${
                    active ? "font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span style={active ? { color: accent } : undefined}>
                    {t(`tab.${tab.id}`, tab.label)}
                  </span>
                  {/* The section's colour, quiet at rest and lit when the tab is
                      current or under the pointer. */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-2 bottom-0 h-[2px] rounded-full transition-opacity duration-200 ${
                      active ? "opacity-100" : "opacity-20 group-hover:opacity-70"
                    }`}
                    style={{ background: accent }}
                  />
                </Link>
              );
            })}
          </div>
        ))}
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
    /* The outer element starts at the BAR, not at the panel, and the six
       pixels of visual gap are its padding. That strip is invisible but
       hoverable, so the pointer never leaves everything at once on its way
       down — without it, crossing the gap fires the bar's mouseleave with
       nothing yet entered, and the menu dismisses itself under a pointer that
       was heading straight for it. */
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ left, top: anchor.top, width: WIDTH, paddingTop: 6 }}
      className="fixed z-50"
    >
    <div
      role="menu"
      aria-label={tab.label}
      className="max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-surface py-1.5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.35)]"
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
    </div>
  );
}
