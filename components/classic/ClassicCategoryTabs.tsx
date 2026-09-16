"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
 * THE KEYBOARD
 *
 * The bar is ONE tab stop, not twenty-seven. A roving tabindex keeps exactly
 * one tab in the tab order and the arrow keys move between them, which is the
 * difference between skipping past the navigation in one keystroke and
 * pressing Tab twenty-seven times to reach the page.
 *
 *   ← →        move along the bar, wrapping
 *   Home End   the first and last section
 *   ↓          open the section's menu and go into it
 *   ↑ ↓        move inside the menu
 *   Esc        close it and come back to the tab you opened it from
 *   Tab        leave the bar entirely
 *
 * FOCUS DOES NOT OPEN THE MENU, AND THAT IS THE FIX
 *
 * It used to. Combined with the panel rendering after the whole <nav> in DOM
 * order, that made every submenu link unreachable: Tab from a tab went to the
 * NEXT TAB rather than into the open panel, and arriving at that tab fired its
 * own focus handler, which replaced the panel you were heading for. Two
 * mechanisms, one outcome — the panel could be seen and never entered. A
 * WCAG 2.1.1 failure, and invisible to anyone testing with a mouse.
 *
 * So focus only moves the roving index now; ↓ opens. `aria-haspopup` and
 * `aria-expanded` are what tell a screen reader the key is there, which is the
 * same affordance every menubar uses.
 *
 * Hover behaviour is untouched. It worked.
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

  /* One flat order across both rows, because the arrow keys do not care that
     twelve of the twenty-seven happen to be behind a chevron. */
  const ORDERED = useMemo(() => [...TABS_VISIBLE, ...TABS_COLLAPSED], []);

  const tabEls = useRef(new Map<string, HTMLAnchorElement>());
  /** null means "nobody has arrowed yet" — see rovingId below. */
  const [roving, setRoving] = useState<string | null>(null);
  /* Set when a tab in the collapsed row is arrowed to: the row has to un-hide
     before the element can take focus, so the focus waits a render. */
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  /* Handed to the panel to say "you were opened by a keypress, take focus".
     A panel opened by hover must NOT steal it. */
  const [focusPanel, setFocusPanel] = useState(false);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname],
  );

  /**
   * Which tab currently holds the tab stop.
   *
   * The CURRENT section by default, so Tab lands where you already are rather
   * than at the far left every time. Once the arrows have been used, that
   * choice wins until the page changes.
   */
  const rovingId =
    roving ?? ORDERED.find((tb) => isActive(tb.href))?.id ?? ORDERED[0]?.id ?? "";

  /**
   * `close` MUST keep a stable identity.
   *
   * It needs to know which tab to hand focus back to, and the obvious way to
   * get that — putting `openId` in the dependency array — is a trap that cost
   * an hour. Two effects below list `close` as a dependency, including
   * `[pathname, close]`, which closes the menu on navigation. Give `close` a
   * new identity whenever `openId` changes and that effect re-runs on every
   * open, closing the panel in the same breath it was opened. The visible
   * symptom is not "the menu will not open" — it is the menu opening, taking
   * focus, and vanishing, leaving focus on <body>.
   *
   * So the id is read through a ref that mirrors the state during render. The
   * callback sees the latest value and never changes identity.
   */
  const openIdRef = useRef<string | null>(null);
  openIdRef.current = openId;

  const close = useCallback((returnFocus = false) => {
    const id = openIdRef.current;
    setOpenId(null);
    setAnchor(null);
    setFocusPanel(false);
    /* Escape has to put focus back on the tab it came from. Without this it
       lands on <body> and the next Tab starts from the top of the document —
       which is how a menu that closes correctly still loses somebody. */
    if (returnFocus && id) tabEls.current.get(id)?.focus();
  }, []);

  /* The collapsed row is `hidden` until it is expanded, and a hidden element
     cannot take focus. So expanding and focusing are two renders, not one. */
  useEffect(() => {
    if (!pendingFocus) return;
    const el = tabEls.current.get(pendingFocus);
    if (!el) return;
    el.focus();
    setPendingFocus(null);
  }, [pendingFocus, expanded]);

  const focusTabAt = useCallback(
    (index: number) => {
      const n = ORDERED.length;
      if (n === 0) return;
      const next = ORDERED[((index % n) + n) % n];
      setRoving(next.id);

      const collapsed = TABS_COLLAPSED.some((tb) => tb.id === next.id);
      if (collapsed && !expanded) {
        setExpanded(true);
        setPendingFocus(next.id);
        return;
      }
      tabEls.current.get(next.id)?.focus();
    },
    [ORDERED, expanded],
  );

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
      /* No focus return here. This is the global handler — it fires for an
         Escape pressed anywhere on the page, including in a form halfway down
         it, and yanking focus up to the navigation from there would be worse
         than leaving it. The panel's own handler does the focus return. */
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

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, tab: NavTab, index: number) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        focusTabAt(index + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusTabAt(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusTabAt(0);
        break;
      case "End":
        e.preventDefault();
        focusTabAt(ORDERED.length - 1);
        break;
      case "ArrowDown":
        /* A tab with no submenu is just a link. Swallowing the key there would
           stop the page scrolling for no reason. */
        if (tab.sub.length === 0) return;
        e.preventDefault();
        open(tab, e.currentTarget);
        setFocusPanel(true);
        break;
      case "Escape":
        if (!openId) return;
        e.preventDefault();
        close();
        break;
      default:
        break;
    }
  };

  const renderTab = (tab: NavTab) => {
    const active = isActive(tab.href);
    const index = ORDERED.findIndex((tb) => tb.id === tab.id);
    const hasMenu = tab.sub.length > 0;
    return (
      <Link
        key={tab.id}
        href={tab.href}
        ref={(el) => {
          if (el) tabEls.current.set(tab.id, el);
          else tabEls.current.delete(tab.id);
        }}
        data-active={active}
        aria-current={active ? "page" : undefined}
        /* What tells a screen reader the down arrow does something. Without
           these the menu is not merely hard to find, it is unannounced. */
        aria-haspopup={hasMenu || undefined}
        aria-expanded={hasMenu ? openId === tab.id : undefined}
        /* THE ROVING TABINDEX. One tab in the tab order; the arrows do the
           rest. See the keyboard note at the top of this file. */
        tabIndex={tab.id === rovingId ? 0 : -1}
        onKeyDown={(e) => onTabKeyDown(e, tab, index)}
        onMouseEnter={(e) => open(tab, e.currentTarget)}
        /* Focus MOVES the tab stop. It does not open the menu — that was the
           bug. See the header. */
        onFocus={() => setRoving(tab.id)}
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
          /* Keyed by tab, so arrowing along the bar with a menu open mounts a
             fresh panel rather than reusing one whose item refs point at the
             previous section's links. */
          key={openTab.id}
          tab={openTab}
          anchor={anchor}
          takeFocus={focusPanel}
          onEnter={cancelClose}
          onLeave={scheduleClose}
          onNavigate={close}
          onClose={close}
        />
      )}
    </div>
  );
}

/**
 * The panel, and the half of the keyboard contract that lives inside it.
 *
 * Its items are NOT in the tab order — `tabIndex={-1}` throughout, moved
 * between with the arrows. That is deliberate and it is what makes Tab mean
 * "leave the navigation" rather than "walk through another six links you did
 * not ask for". The menu is entered on purpose, with ↓, and left on purpose,
 * with Escape or Tab.
 */
function DropdownPanel({
  tab,
  anchor,
  takeFocus,
  onEnter,
  onLeave,
  onNavigate,
  onClose,
}: {
  tab: NavTab;
  anchor: { left: number; top: number };
  /** Opened by a keypress rather than by a pointer, so focus belongs here. */
  takeFocus: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onNavigate: () => void;
  onClose: (returnFocus?: boolean) => void;
}) {
  const { t, tx } = useLocale();
  const itemEls = useRef<(HTMLAnchorElement | null)[]>([]);

  /* A panel opened by hover must not steal focus from whatever the reader was
     doing — moving a pointer across a nav bar is not a request to be moved. */
  useEffect(() => {
    if (!takeFocus) return;
    itemEls.current.find(Boolean)?.focus();
  }, [takeFocus]);

  const moveTo = (index: number) => {
    const items = itemEls.current.filter((el): el is HTMLAnchorElement => Boolean(el));
    if (items.length === 0) return;
    items[((index % items.length) + items.length) % items.length].focus();
  };

  const onItemKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveTo(index + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveTo(index - 1);
        break;
      case "Home":
        e.preventDefault();
        moveTo(0);
        break;
      case "End":
        e.preventDefault();
        moveTo(itemEls.current.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        /* Back to the tab this was opened from. The one key everybody tries. */
        onClose(true);
        break;
      case "Tab":
        /* NOT prevented. Tab means "I am done with the navigation", so the
           menu gets out of the way and lets focus carry on into the page. */
        onClose();
        break;
      default:
        break;
    }
  };

  /* A running index across groups, because the arrow keys move through the
     whole list and have no idea it is divided into "Identity" and "Tax". */
  let itemIndex = -1;

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
            {/* The group heading takes the brand colour rather than grey.
                It is the only other text in the panel, and gold on it makes
                the whole menu read as part of the bar it hangs off instead of
                as a generic dropdown that happens to be attached. */}
            {group.name && (
              <p className="type-label sub-group-label px-3.5 pb-1 pt-2.5">{tx(group.name)}</p>
            )}
            {group.items.map((item) => {
              const i = (itemIndex += 1);
              return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                role="menuitem"
                ref={(el) => {
                  itemEls.current[i] = el;
                }}
                tabIndex={-1}
                onKeyDown={(e) => onItemKeyDown(e, i)}
                onClick={onNavigate}
                className="sub-item flex items-center justify-between gap-3 rounded-lg px-3.5 py-2 text-[12.5px] text-muted"
              >
                <span className="truncate">{tx(item.label)}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  className="sub-item-arrow shrink-0 text-subtle"
                  aria-hidden
                >
                  <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              );
            })}
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
