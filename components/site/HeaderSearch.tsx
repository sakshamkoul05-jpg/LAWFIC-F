"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchSuggest, type SearchHit } from "@/lib/search-index";

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
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => searchSuggest(query), [query]);

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
    router.push(q ? `/services?q=${encodeURIComponent(q)}` : "/services");
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
        <div className="flex w-full items-center gap-2.5 rounded-full border border-border bg-surface-2/60 px-4 transition-colors focus-within:border-primary/50 focus-within:bg-surface">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="shrink-0 text-subtle" aria-hidden>
            <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.7" />
            <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search services and documents"
            aria-label="Search services and documents"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={cursor >= 0 ? `${listId}-${cursor}` : undefined}
            className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] text-foreground outline-none placeholder:text-subtle"
          />
        </div>
      </form>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
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
                    <Marked text={hit.label} query={query} />
                  </span>
                  {hit.blurb && (
                    <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                      {hit.blurb}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 shrink-0 text-[10px] uppercase tracking-[0.12em] text-subtle">
                  {/* Says what it is, and says when it is not open yet — a
                      result you cannot buy should not look like one you can. */}
                  {hit.live ? hit.kind : "Soon"}
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
