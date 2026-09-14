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
 * The section bar: the blueprint's fifteen on a dark band, and its other twelve
 * behind a chevron.
 *
 * WHY FIFTEEN AND NOT TWENTY-SEVEN
 *
 * It used to be all twenty-seven at once, each tab carrying its own accent
 * colour. Twenty-seven items in a permanent block is a wall a reader scans
 * rather than reads, and twenty-seven colours is a toy shelf. One ground and
 * one ink makes the row read as a set, and the current section is then the
 * only lit thing on the bar — which is the whole job of a nav bar.
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
 * The band is dark in light mode and dark mode alike, by instruction. The
 * colours therefore come from the --band-* constants in globals.css rather
 * than from the theme tokens — see the note above them for why a value that
 * never varies should not be written as a variable that could.
 */

/**
 * The bar's colours come from the band tokens in globals.css, so the ticker
 * above it and the strips further down the page cannot drift away from it.
 *
 * WHAT CHANGED, AND WHY IT WAS NOT JUST "TOO DARK"
 *
 * It was #9A803C lettering on #0B0B0C — dim gold on near-black. That measures
 * 5.2:1, which passes AA on paper, and still read as faint, because a contrast
 * ratio says nothing about a 13.5px label in a fifteen-across grid sitting
 * under a bright page. Two things were wrong at once and only one of them was
 * the colour.
 *
 * So the scheme is inverted rather than brightened. The resting label is now
 * warm light on navy (about 8.7:1) and GOLD IS RESERVED for the tab you are
 * on. Before, everything was gold and the current tab was slightly more gold
 * than the rest — which is no signal at all. Now the bar reads as a row of
 * legible labels with exactly one lit.
 */
const BAND = "var(--band)";
const GOLD = "var(--band-gold)";
const INK = "var(--band-ink-dim)";

export default function ClassicCategoryTabs() {
  const pathname = usePathname();
  const { t } = useLocale();

  const [openId, setOpenId] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* The tab the panel hangs off, kept so it can be re-measured on scroll. */
  const anchorEl = useRef<HTMLElement | null>(null);
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

  /**
   * THE PANEL FOLLOWS THE BAR. IT DOES NOT DISMISS ITSELF.
   *
   * This used to be `addEventListener("scroll", close, true)`, and the `true`
   * is the whole bug: a capture-phase scroll listener fires for a scroll in ANY
   * element, not just the page. The panel's own list is scrollable — Document
   * alone carries dozens of services — so scrolling it to read it closed it.
   * The menu vanished out from under the pointer at exactly the moment someone
   * was using it, which is the report.
   *
   * Closing was the wrong response to scrolling anyway. The panel is anchored
   * to a tab, that tab is a real element, and the honest answer to the page
   * moving is to move with it. It only gives up when the tab itself has left
   * the screen, at which point there is genuinely nothing to point at.
   *
   * Positions are recomputed on a frame and written back only when they have
   * actually changed, so a scroll inside the list — where the tab has not
   * moved at all — costs one measurement and no re-render.
   */
  useEffect(() => {
    if (!openId) return;
    let frame = 0;

    const reposition = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = anchorEl.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return close();
        setAnchor((prev) =>
          prev && prev.left === r.left && prev.top === r.bottom
            ? prev
            : { left: r.left, top: r.bottom },
        );
      });
    };

    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [openId, close]);

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
    anchorEl.current = el;
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
        /* 15px, and 500 weight. This row is how someone reaches any of
           twenty-seven sections — it is the site's main navigation, not a
           caption, and at 13.5px in a fifteen-across grid it was being read as
           the latter. The weight does as much work as the size: a half-step up
           in weight buys legibility on a dark ground that another point of
           size does not. */
        className="tab-link group shrink-0 grow-0 truncate whitespace-nowrap px-3 py-4 text-center text-[15px] font-medium lg:grow lg:px-2"
      >
        <span
          className="tab-label group-hover:!text-[var(--band-gold)]"
          style={{ color: active ? GOLD : INK }}
        >
          {t(`tab.${tab.id}`, tab.label)}
        </span>
        {/* The frame stands up out of the rule on hover. Both are decoration
            and both are aria-hidden; the state they describe is already on the
            link as aria-current. See the .tab-frame note in globals.css. */}
        <span aria-hidden className="tab-frame" />
        {/* One rule, drawn for the hovered tab and the current one alike —
            see the .tab-rule note in globals.css for why they share it. */}
        <span
          aria-hidden
          className="tab-rule absolute inset-x-2 bottom-0 h-[2.5px] rounded-full"
          style={{ background: GOLD }}
        />
      </Link>
    );
  };

  return (
    /* The hairline is what stops a dark band from simply running out into the
       page below it. One line of gold at low alpha, the same edge the second
       row uses, so the bar has a bottom. */
    <div
      className="relative border-b"
      style={{ background: BAND, borderColor: "var(--band-edge)" }}
      onMouseLeave={scheduleClose}
    >
      <nav aria-label="Sections">
        {/* THE FIRST ROW — the sheet's Tab 1 to Tab 15. */}
        {/* Content-sized, and it GROWS but never SHRINKS.
            Fifteen equal columns capped every cell at 1/15th of the bar and
            truncated "Instant Help"; no font size fixes that, because the
            constraint was the grid rather than the type. But `flex-auto` —
            the first fix — allows shrinking, so between 1024px and about
            1420px all fifteen squeezed and every one of them truncated. Grow
            with shrink off is the honest version: each label keeps the room
            its own words need, spare space is shared out, and when there is
            not enough the row scrolls rather than cutting anything.

            Which is why overflow-x-auto is no longer lifted at lg. The
            dropdown is position:fixed and no ancestor here establishes a
            containing block for it, so a scroll container cannot clip it. */}
        <div className="classic-tabs-nav flex w-full items-stretch overflow-x-auto px-3 sm:px-5 lg:px-6">
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
            className="grid h-6 w-24 place-items-center rounded-b-lg transition-colors hover:bg-white/5"
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
          className="classic-tabs-nav flex w-full items-stretch overflow-x-auto border-t px-3 pb-1 sm:px-5 lg:px-6"
          style={{ borderColor: "var(--band-edge)" }}
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
  const { t, tx } = useLocale();

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
        aria-label={t(`tab.${tab.id}`, tab.label)}
        className="max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-surface py-1.5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.35)]"
      >
        {groups.map((group, gi) => (
          <div key={group.name ?? `g${gi}`}>
            {group.name && (
              <p className="type-label px-3.5 pb-1 pt-2.5 text-subtle">{tx(group.name)}</p>
            )}
            {group.items.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                role="menuitem"
                onClick={onNavigate}
                className="flex items-center justify-between gap-3 rounded-lg px-3.5 py-2 text-[12.5px] text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <span className="truncate">{tx(item.label)}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-subtle" aria-hidden>
                  <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        ))}

        {!tab.live && (
          <p className="mt-1 border-t border-border px-3.5 pb-1 pt-2 text-[10.5px] text-subtle">
            {tx("This section is still being written.")}
          </p>
        )}
      </div>
    </div>
  );
}
