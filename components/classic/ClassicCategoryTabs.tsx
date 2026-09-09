"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  classicTabs,
  TABS_VISIBLE,
  TABS_COLLAPSED,
  type NavTab,
} from "@/lib/nav-tabs";

/**
 * The section bar: the blueprint's first row on a black band in gold, and its
 * second row behind a chevron.
 *
 * WHAT CHANGED AND WHY
 *
 * It used to be all twenty-seven at once, each tab carrying its own accent
 * colour. The client's instruction is black ground, gold text, and the sheet's
 * fifteen showing with its twelve folded away. That is not only a taste call:
 * twenty-seven items in a permanent block is a wall a reader scans rather than
 * reads, and twenty-seven different colours is a toy shelf. One ground and one ink makes the row read as a set,
 * and the current section is then the only thing on the bar with a bright
 * mark on it, which is the whole job of a nav bar.
 *
 * THE CHEVRON
 *
 * Centred under the first row, and it opens on hover as well as on click: a
 * pointer user should not have to click to look, and a keyboard or touch user
 * cannot hover, so it has to answer both. It closes on a second click, on
 * Escape, on leaving the bar, and on navigating — four ways out, because a
 * panel that covers the page with no obvious dismissal is the thing people
 * complain about in mega menus.
 *
 * The colours are hard-coded rather than themed. This band is black in both
 * light and dark mode by instruction, so a token that flips with the theme
 * would be the wrong tool: what is wanted is a constant, and writing it as one
 * is more honest than defining a token that never varies.
 */

const BAND = "#0B0B0C";
const GOLD = "#D0AE55";
const GOLD_DIM = "#9A803C";

export default function ClassicCategoryTabs() {
  const pathname = usePathname();
  const { t } = useLocale();

  const [openId, setOpenId] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openTab = openId ? classicTabs.find((x) => x.id === openId) : null;

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname],
  );

  const close = useCallback(() => {
    setOpenId(null);
    setAnchor(null);
  }, []);

  /* A viewport-anchored dropdown has to close when the page moves under it. */
  useEffect(() => {
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [close]);

  useEffect(() => {
    close();
    setExpanded(false);
  }, [pathname, close]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      setExpanded(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [close]);

  /**
   * The dropdown holds while the pointer is on it.
   *
   * 340ms rather than a tenth of a second: the panel sits below the bar with a
   * gap to cross, and a diagonal move toward an item in its far corner takes
   * longer than that. Too short and the menu vanishes out from under a pointer
   * that was heading straight for it, which reads as the site fighting you.
   */
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(close, 340);
  };
  const cancelCollapse = () => {
    if (expandTimer.current) clearTimeout(expandTimer.current);
    expandTimer.current = null;
  };
  const scheduleCollapse = () => {
    cancelCollapse();
    expandTimer.current = setTimeout(() => setExpanded(false), 340);
  };
  useEffect(
    () => () => {
      cancelClose();
      cancelCollapse();
    },
    [],
  );

  const open = (tab: NavTab, el: HTMLElement) => {
    cancelClose();
    if (tab.sub.length === 0) return close();
    const r = el.getBoundingClientRect();
    setAnchor({ left: r.left, top: r.bottom });
    setOpenId(tab.id);
  };

  const renderTab = (tab: NavTab) => {
    const active = isActive(tab.href);
    return (
      <Link
        key={tab.id}
        href={tab.href}
        data-active={active}
        aria-current={active ? "page" : undefined}
        onMouseEnter={(e) => open(tab, e.currentTarget)}
        onFocus={(e) => open(tab, e.currentTarget)}
        className="group relative shrink-0 truncate whitespace-nowrap px-3 py-2.5 text-center text-[12px] transition-colors lg:min-w-0 lg:px-1"
        style={{ color: active ? GOLD : GOLD_DIM }}
      >
        <span className="group-hover:!text-[var(--gold)]" style={{ ["--gold" as string]: GOLD }}>
          {t(`tab.${tab.id}`, tab.label)}
        </span>
        {/* The current section is the only lit thing on the bar. */}
        <span
          aria-hidden
          className={`absolute inset-x-2 bottom-0 h-[2px] rounded-full transition-opacity duration-200 ${
            active ? "opacity-100" : "opacity-0 group-hover:opacity-50"
          }`}
          style={{ background: GOLD }}
        />
      </Link>
    );
  };

  return (
    <div className="relative" style={{ background: BAND }} onMouseLeave={scheduleClose}>
      <nav aria-label="Sections">
        {/* THE FIRST ROW — the sheet's Tab 1 to Tab 15. */}
        <div className="classic-tabs-nav flex w-full items-stretch overflow-x-auto px-3 sm:px-5 lg:grid lg:grid-cols-[repeat(15,minmax(0,1fr))] lg:overflow-visible lg:px-6">
          {TABS_VISIBLE.map(renderTab)}
        </div>

        {/* THE CHEVRON, centred under them. */}
        <div
          className="flex justify-center"
          onMouseEnter={() => {
            cancelCollapse();
            setExpanded(true);
          }}
          onMouseLeave={scheduleCollapse}
        >
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="more-sections"
            aria-label={expanded ? "Hide the other sections" : "Show the other sections"}
            className="grid h-5 w-20 place-items-center rounded-b-lg transition-colors"
            style={{ color: GOLD }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* THE SECOND ROW — Tab 16 to Tab 27. */}
        <div
          id="more-sections"
          hidden={!expanded}
          onMouseEnter={cancelCollapse}
          onMouseLeave={scheduleCollapse}
          className="classic-tabs-nav flex w-full items-stretch overflow-x-auto border-t px-3 pb-1 sm:px-5 lg:grid lg:grid-cols-[repeat(12,minmax(0,1fr))] lg:overflow-visible lg:px-6"
          style={{ borderColor: "rgba(208,174,85,0.18)" }}
        >
          {TABS_COLLAPSED.map(renderTab)}
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
    /* The outer element starts at the BAR and the gap is its padding, so the
       pointer never leaves everything at once on the way down. Without that
       strip, crossing the gap fires the bar's mouseleave with nothing yet
       entered and the menu dismisses itself under a pointer heading for it. */
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
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-subtle" aria-hidden>
                  <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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
