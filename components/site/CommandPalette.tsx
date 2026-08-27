"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { liveServices, searchServices, totalServices } from "@/lib/catalogue";
import CategoryIcon from "./CategoryIcon";
import { categories } from "@/lib/catalogue";

/**
 * ⌘K search over the whole catalogue.
 *
 * At thirty-nine services this is the honest answer to "where is X" — a menu
 * is for browsing when you do not know what you want, and search is for the
 * far more common case where you do. Someone who knows they need FSSAI should
 * not have to work out which category it lives in.
 *
 * Keyboard-first: ⌘K or Ctrl+K opens, arrows move, Enter opens, Escape closes.
 * A `soon` result is selectable but explains itself rather than navigating,
 * because silently doing nothing on Enter reads as a broken app.
 */

const QUICK = [
  { label: "All services", href: "/services" },
  { label: "Your wallet", href: "/wallet" },
  { label: "Your filings", href: "/orders" },
  { label: "Jobs for you", href: "/jobs" },
  { label: "About LAWFIC", href: "/about" },
];

export default function CommandPalette() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const iconFor = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId)?.icon ?? "legal",
    []
  );

  const results = useMemo(() => {
    if (!query.trim()) {
      return liveServices.slice(0, 6).map((s) => ({ ...s, score: 0 }));
    }
    return searchServices(query).slice(0, 8);
  }, [query]);

  const quick = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK;
    return QUICK.filter((x) => x.label.toLowerCase().includes(q));
  }, [query]);

  const rows = useMemo(
    () => [
      ...results.map((r) => ({ kind: "service" as const, ...r })),
      ...quick.map((q) => ({ kind: "page" as const, ...q })),
    ],
    [results, quick]
  );

  // Open with ⌘K / Ctrl+K from anywhere, and close with the same chord.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      setNote("");
      // Wait for the panel to mount before reaching for the field.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${index}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [index]);

  function choose(row: (typeof rows)[number]) {
    if (row.kind === "page") {
      setOpen(false);
      router.push(row.href);
      return;
    }
    if (row.status === "soon") {
      setNote(`${row.name} is not live yet — tell us you need it and we will prioritise it.`);
      return;
    }
    setOpen(false);
    router.push(`/services/${row.slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (rows.length ? (i + 1) % rows.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[index]) choose(rows[index]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <>
      {/* The trigger doubles as the discoverability hint for the shortcut. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search services"
        className="hidden items-center gap-2.5 rounded-full border border-line-2 bg-surface/50 py-1.5 pl-3.5 pr-2 text-slate transition-colors hover:border-brass-lo hover:text-ash lg:flex"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="6.2" cy="6.2" r="4.2" stroke="currentColor" strokeWidth="1.3" />
          <path d="m9.4 9.4 2.6 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span className="text-[13px]">Search</span>
        <kbd className="rounded border border-line-3 bg-ink/60 px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-100 flex items-start justify-center px-4 pt-[12vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search services"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.18, ease: [0.2, 0.7, 0.3, 1] }}
              className="relative z-2 w-full max-w-xl overflow-hidden rounded-xl border border-line-2 bg-ink-2 shadow-2xl shadow-black/70"
              onKeyDown={onKeyDown}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />

              <div className="flex items-center gap-3 border-b border-line px-5">
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="shrink-0 text-slate" aria-hidden>
                  <circle cx="6.2" cy="6.2" r="4.2" stroke="currentColor" strokeWidth="1.3" />
                  <path d="m9.4 9.4 2.6 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setNote(""); }}
                  placeholder={`Search ${totalServices} services — try "gst", "trademark", "food licence"`}
                  className="w-full bg-transparent py-4 text-[15px] text-bone outline-none placeholder:text-slate/70"
                />
                <kbd className="shrink-0 rounded border border-line-3 bg-surface px-1.5 py-0.5 font-mono text-[10px] text-slate">
                  ESC
                </kbd>
              </div>

              <ul ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
                {rows.length === 0 && (
                  <li className="px-4 py-10 text-center">
                    <p className="text-[14px] text-ash">Nothing matches “{query}”.</p>
                    <p className="mt-2 text-[13px] text-slate">
                      We may still handle it — ask and we will tell you.
                    </p>
                  </li>
                )}

                {rows.map((row, i) => {
                  const on = i === index;
                  const isService = row.kind === "service";

                  return (
                    <li key={isService ? `s-${row.slug}` : `p-${row.href}`} data-row={i}>
                      <button
                        type="button"
                        onMouseEnter={() => setIndex(i)}
                        onClick={() => choose(row)}
                        className={`flex w-full items-center gap-3.5 rounded-md px-3 py-2.5 text-left transition-colors ${
                          on ? "bg-brass/10" : ""
                        }`}
                      >
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded border ${
                            on ? "border-brass-lo text-brass" : "border-line-2 text-slate"
                          }`}
                        >
                          {isService ? (
                            <CategoryIcon name={iconFor(row.categoryId)} size={16} />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className={`truncate text-[14px] ${on ? "text-brass-hi" : "text-bone"}`}>
                              {isService ? row.name : row.label}
                            </span>
                            {isService && row.status === "soon" && (
                              <span className="label shrink-0 rounded-sm border border-line-3 px-1.5 py-0.5 text-[9px] text-slate">
                                Soon
                              </span>
                            )}
                          </span>
                          {isService && (
                            <span className="mt-0.5 block truncate text-[12.5px] text-slate">
                              {row.categoryName} · {row.blurb}
                            </span>
                          )}
                        </span>

                        {on && (
                          <kbd className="hidden shrink-0 rounded border border-line-3 bg-surface px-1.5 py-0.5 font-mono text-[10px] text-slate sm:block">
                            ↵
                          </kbd>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between gap-4 border-t border-line bg-ink/50 px-5 py-3">
                {note ? (
                  <p className="text-[12.5px] leading-snug text-brass">{note}</p>
                ) : (
                  <p className="flex items-center gap-3 text-[11.5px] text-slate">
                    <span className="flex items-center gap-1.5">
                      <Key>↑</Key>
                      <Key>↓</Key> move
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Key>↵</Key> open
                    </span>
                  </p>
                )}
                <p className="shrink-0 font-mono text-[11px] text-slate tnum">
                  {results.length}/{totalServices}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line-3 bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ash">
      {children}
    </kbd>
  );
}
