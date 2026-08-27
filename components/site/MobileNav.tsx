"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { categories, searchServices, totalServices } from "@/lib/catalogue";
import CategoryIcon from "./CategoryIcon";

/**
 * Full-height drawer with search and category accordions.
 *
 * A hover mega-menu has no meaning on a touch screen, so this is a different
 * component rather than the same one restyled. Search sits at the top because
 * on a phone it beats scrolling seven accordions.
 */
export default function MobileNav({
  open,
  onClose,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  nav: { href: string; label: string }[];
}) {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState<string | null>(categories[0].id);
  const [query, setQuery] = useState("");

  const results = query.trim() ? searchServices(query).slice(0, 12) : [];

  // Stop the page behind from scrolling while the drawer owns the screen.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-x-0 bottom-0 top-18 z-40 md:hidden"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: [0.2, 0.7, 0.3, 1] }}
        >
          <div className="grain flex h-full flex-col border-t border-line bg-ink/98 backdrop-blur-xl">
            {/* search */}
            <div className="relative z-2 shrink-0 border-b border-line px-5 py-4">
              <div className="flex items-center gap-3 rounded-full border border-line-2 bg-surface/60 px-4 focus-within:border-brass-lo">
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="shrink-0 text-slate" aria-hidden>
                  <circle cx="6.2" cy="6.2" r="4.2" stroke="currentColor" strokeWidth="1.3" />
                  <path d="m9.4 9.4 2.6 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${totalServices} services`}
                  className="w-full bg-transparent py-3 text-[15px] text-bone outline-none placeholder:text-slate/70"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="shrink-0 text-slate">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="m3.5 3.5 7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="relative z-2 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {query.trim() ? (
                <ul className="flex flex-col gap-1">
                  {results.length === 0 && (
                    <li className="py-10 text-center text-[14px] text-ash">
                      Nothing matches “{query}”.
                    </li>
                  )}
                  {results.map((r) =>
                    r.status === "live" ? (
                      <li key={r.slug}>
                        <Link
                          href={`/services/${r.slug}`}
                          onClick={onClose}
                          className="block rounded-md px-3 py-3 transition-colors active:bg-surface"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-[15px] text-bone">{r.name}</span>
                            <span className="label rounded-sm border border-jade/40 px-1.5 py-0.5 text-[9px] text-jade">Live</span>
                          </span>
                          <span className="mt-0.5 block text-[12.5px] text-slate">{r.categoryName}</span>
                        </Link>
                      </li>
                    ) : (
                      <li key={r.slug} className="rounded-md px-3 py-3 opacity-55">
                        <span className="flex items-center gap-2">
                          <span className="text-[15px] text-ash">{r.name}</span>
                          <span className="label rounded-sm border border-line-3 px-1.5 py-0.5 text-[9px] text-slate">Soon</span>
                        </span>
                        <span className="mt-0.5 block text-[12.5px] text-slate">{r.categoryName}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <>
                  <p className="label mb-3 text-slate">Services</p>
                  <ul className="flex flex-col gap-px overflow-hidden rounded-lg border border-line bg-line">
                    {categories.map((c) => {
                      const on = expanded === c.id;
                      return (
                        <li key={c.id} className="bg-ink-2">
                          <button
                            type="button"
                            onClick={() => setExpanded(on ? null : c.id)}
                            aria-expanded={on}
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                          >
                            <CategoryIcon name={c.icon} className={on ? "text-brass" : "text-slate"} />
                            <span className={`flex-1 text-[14.5px] ${on ? "text-brass-hi" : "text-bone"}`}>
                              {c.name}
                            </span>
                            <span className="font-mono text-[11px] text-slate tnum">
                              {c.services.length}
                            </span>
                            <svg
                              width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden
                              className={`text-slate transition-transform duration-300 ${on ? "rotate-180" : ""}`}
                            >
                              <path d="m2.5 4.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>

                          <AnimatePresence initial={false}>
                            {on && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.24, ease: "easeOut" }}
                                className="overflow-hidden"
                              >
                                <ul className="border-t border-line px-4 pb-3 pt-2">
                                  {c.services.map((s) =>
                                    s.status === "live" ? (
                                      <li key={s.slug}>
                                        <Link
                                          href={`/services/${s.slug}`}
                                          onClick={onClose}
                                          className="flex items-center gap-2.5 py-2.5"
                                        >
                                          <span className="size-1.5 rounded-full bg-brass" aria-hidden />
                                          <span className="text-[14px] text-bone">{s.name}</span>
                                          <span className="label rounded-sm border border-jade/40 px-1.5 py-0.5 text-[9px] text-jade">
                                            Live
                                          </span>
                                        </Link>
                                      </li>
                                    ) : (
                                      <li key={s.slug} className="flex items-center gap-2.5 py-2.5 opacity-55">
                                        <span className="size-1.5 rounded-full bg-line-3" aria-hidden />
                                        <span className="text-[14px] text-ash">{s.name}</span>
                                        <span className="label rounded-sm border border-line-3 px-1.5 py-0.5 text-[9px] text-slate">
                                          Soon
                                        </span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="label mb-3 mt-8 text-slate">More</p>
                  <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-line bg-line">
                    {[{ href: "/services", label: "All services" }, ...nav].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className="flex items-center justify-between bg-ink-2 px-4 py-3.5 text-[14.5px] text-bone"
                      >
                        {item.label}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate" aria-hidden>
                          <path d="m4.5 2.5 3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
