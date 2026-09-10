"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchSuggest, type SearchHit } from "@/lib/search-index";
import { categories } from "@/lib/catalogue";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The header search, with suggestions.
 *
 * The site sells thirty-nine services across twenty-one sections, so typing a
 * name will almost always beat hunting for it — but only if the field answers
 * while you type. A plain box that does nothing until you press Enter and then
 * dumps you on a results page is a worse experience than the navigation it was
 * meant to shortcut.
 *
 * Everything is matched locally against an index built from the catalogue. No
 * request per keystroke, nothing to rate-limit, and it works with the network
 * off. The index is a few kilobytes; a round trip to rank thirty-nine rows
 * would be an absurd thing to ask a server for.
 *
 * Keyboard first: arrows move, Enter opens the highlighted row or falls through
 * to the full results page, Escape closes without clearing what was typed. A
 * suggestion list you can only use with a mouse is an accessibility problem
 * dressed as a feature.
 */
export default function HeaderSearch({
  className = "",
  autoFocus = false,
  onNavigate,
}: {
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const { t, tx } = useLocale();
  /* Scoping the search to a category, the way a storefront does. With
     thirty-nine services across seven categories it is the difference between
     "GST" returning one obvious answer and returning everything that mentions
     tax. */
  const [scope, setScope] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  /* Only so the running placeholder knows to get out of the way. */
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => searchSuggest(query, 8, scope || undefined), [query, scope]);

  useEffect(() => setCursor(-1), [query]);

  /* Clicking anywhere else puts the list away. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cursor >= 0 && hits[cursor]) return go(hits[cursor].href);
    const q = query.trim();
    setOpen(false);
    onNavigate?.();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (scope) params.set("cat", scope);
    const qs = params.toString();
    router.push(qs ? `/services?${qs}` : "/services");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c <= 0 ? hits.length - 1 : c - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && hits.length > 0;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form onSubmit={submit} role="search">
        <div className="search-shell flex w-full items-center gap-2 rounded-full border border-border bg-surface-2/60 pr-4 transition-colors focus-within:border-primary/50 focus-within:bg-surface">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            aria-label={t("nav.searchIn")}
            /* NARROW, BECAUSE THE FIELD BESIDE IT IS THE POINT
               This was 136px, sized so "Intellectual Property" could show in
               full while closed. But the closed state reads "All" nine times
               out of ten, and the OPEN list is not clipped by this width at
               all — the browser draws the popup as wide as its longest option
               regardless. The width was being spent on a case that barely
               happens, next to the one control on the page that wanted every
               pixel. 84 holds "All" and its chevron, truncates a long category
               name once one is chosen, and hands fifty back to the field. */
            className="w-[84px] shrink-0 cursor-pointer truncate rounded-l-full border-r border-border bg-transparent py-2 pl-3.5 pr-1 text-[12px] text-muted-foreground outline-none"
          >
            <option value="">{tx("All")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {tx(c.name)}
              </option>
            ))}
          </select>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="shrink-0 text-subtle" aria-hidden>
            <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.7" />
            <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          {/* The field and its running placeholder share one box, so the
              banner is positioned against the FIELD and not against the
              rounded shell. Anchoring it to the shell would mean a hand-counted
              offset — select width plus gap plus icon plus gap — that goes
              wrong the next time any of those four changes, silently and only
              on screen. */}
          <span className="relative min-w-0 flex-1 self-stretch">
            <input
              type="search"
              value={query}
              autoFocus={autoFocus}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setOpen(true);
                setFocused(true);
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={onKeyDown}
              /* NO `placeholder` ATTRIBUTE. A real placeholder cannot move, and
                 the client's line runs to about a hundred and fifty characters
                 — in a 500px field it stopped dead at "51000+ S". The copy is
                 drawn as a running banner underneath instead.

                 The ACCESSIBLE NAME stays the short one. A screen reader
                 announces a field's name every time focus lands on it, and a
                 hundred and fifty characters of marketing read out on every
                 visit is not a label, it is an obstacle. */
              aria-label={t("nav.searchShort", "Search services and documents")}
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={cursor >= 0 ? `${listId}-${cursor}` : undefined}
              className="absolute inset-0 w-full bg-transparent text-[13.5px] text-foreground outline-none"
            />

            {/* THE PLACEHOLDER, RUNNING.

                Laid over the field rather than set on it, because the attribute
                cannot be animated. `pointer-events-none`, so a click still
                lands on the input beneath; `aria-hidden`, because the input
                already has a name and hearing this sentence as well would be
                the long-label problem arriving by another door.

                It shows only while the field is EMPTY AND UNFOCUSED. Text
                sliding past a blinking caret reads as a fault rather than as a
                prompt, so the moment someone means to type, it leaves.

                `.marquee-clip` is the pair the top strip and the location box
                already use: the copy is held twice and travels exactly -50%, so
                the second arrives as the first leaves and there is no jump. It
                pauses on hover and stops outright under reduced motion, which
                is the whole reason to reuse it rather than write a third. */}
            {!query && !focused && (
              <span
                aria-hidden
                className="marquee-clip pointer-events-none absolute inset-0 flex items-center text-[12.5px] text-subtle"
              >
                <span className="marquee-track">
                  <span className="pr-16">{t("nav.search")}</span>
                  <span className="pr-16">{t("nav.search")}</span>
                </span>
              </span>
            )}
          </span>
        </div>
      </form>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("nav.suggestions")}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[62vh] overflow-y-auto rounded-2xl border border-border bg-surface py-1.5 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.5)]"
        >
          {hits.map((hit, i) => (
            <li key={hit.id} id={`${listId}-${i}`} role="option" aria-selected={i === cursor}>
              <button
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(hit.href)}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === cursor ? "bg-surface-2" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] text-foreground">
                    <Marked text={tx(hit.label)} query={query} />
                  </span>
                  {hit.blurb && (
                    <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                      {tx(hit.blurb)}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 shrink-0 text-[10px] uppercase tracking-[0.12em] text-subtle">
                  {/* Says what it is, and says when it is not open yet — a
                      result you cannot buy should not look like one you can. */}
                  {hit.live ? tx(hit.kind) : t("nav.soon")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The matched run, in bold, so it is obvious why a row is in the list. */
function Marked({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (i < 0 || !query.trim()) return <>{text}</>;
  const end = i + query.trim().length;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-primary">{text.slice(i, end)}</mark>
      {text.slice(end)}
    </>
  );
}
