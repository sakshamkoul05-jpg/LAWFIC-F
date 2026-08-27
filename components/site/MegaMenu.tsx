"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { categories, liveServices, totalServices } from "@/lib/catalogue";
import CategoryIcon from "./CategoryIcon";

/**
 * Two-level mega-menu: a category rail on the left, that category's services
 * on the right.
 *
 * A flat list stops working somewhere around eight items, and the catalogue is
 * already at thirty-nine. Splitting it in two means the panel never grows —
 * adding a service lengthens one column, adding a category lengthens the rail,
 * and neither changes the shape of the thing.
 *
 * Hover opens it, but with intent delays on both edges: without them, dragging
 * the pointer diagonally toward a service flickers the panel shut as it crosses
 * a gap. Click also works, and so does the keyboard — the trigger is a real
 * button, Escape closes and returns focus, and every row is tabbable.
 */

const OPEN_DELAY = 90;
const CLOSE_DELAY = 220;

export default function MegaMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0].id);
  const reduced = useReducedMotion();

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const category = categories.find((c) => c.id === categoryId) ?? categories[0];

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  useEffect(() => clearTimers, []);

  function scheduleOpen() {
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY);
  }

  function scheduleClose() {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  }

  // Escape closes and hands focus back, which is where a keyboard user expects
  // to be rather than adrift at the top of the document.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onFocusCapture={() => {
        clearTimers();
        setOpen(true);
      }}
      onBlurCapture={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) scheduleClose();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded px-3 py-2 text-sm transition-colors ${
          active || open ? "text-brass" : "text-ash hover:text-bone"
        }`}
      >
        Services
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="m2 4 3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.2, 0.7, 0.3, 1] }}
            // Anchored to the header, not the trigger: a 900px panel hanging
            // off a 90px button would run off the right edge.
            className="fixed left-1/2 top-18 z-50 w-[min(1120px,calc(100vw-2.5rem))] -translate-x-1/2"
          >
            <div className="grain overflow-hidden rounded-xl border border-line-2 bg-ink-2/97 shadow-2xl shadow-black/70 backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />

              <div className="relative z-2 grid md:grid-cols-[266px_1fr]">
                {/* category rail */}
                <div className="border-b border-line bg-ink/40 p-3 md:border-b-0 md:border-r">
                  <p className="label px-3 py-2 text-slate">Categories</p>
                  <ul className="flex flex-col gap-0.5">
                    {categories.map((c) => {
                      const on = c.id === categoryId;
                      const live = c.services.filter((s) => s.status === "live").length;
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setCategoryId(c.id)}
                            onFocus={() => setCategoryId(c.id)}
                            onClick={() => setCategoryId(c.id)}
                            aria-current={on}
                            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                              on ? "bg-brass/10 text-brass-hi" : "text-ash hover:bg-surface/60 hover:text-bone"
                            }`}
                          >
                            <CategoryIcon name={c.icon} className={on ? "text-brass" : "text-slate"} />
                            <span className="flex-1 text-[13.5px] leading-tight">{c.name}</span>
                            {live > 0 && (
                              <span className="size-1.5 rounded-full bg-jade" title={`${live} live`} />
                            )}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden
                              className={`transition-opacity ${on ? "opacity-100" : "opacity-0"}`}>
                              <path d="m4.5 2.5 3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* services for the active category */}
                <div className="p-6">
                  <motion.div
                    key={category.id}
                    initial={reduced ? false : { opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="mb-5 flex items-start gap-3.5">
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md border border-line-2 bg-surface/60 text-brass">
                        <CategoryIcon name={category.icon} />
                      </span>
                      <div>
                        <h3 className="font-display text-[19px] leading-tight text-bone">
                          {category.name}
                        </h3>
                        <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-slate">
                          {category.summary}
                        </p>
                      </div>
                    </div>

                    <ul className="grid gap-1 sm:grid-cols-2">
                      {category.services.map((s) =>
                        s.status === "live" ? (
                          <li key={s.slug}>
                            <Link
                              href={`/services/${s.slug}`}
                              onClick={() => setOpen(false)}
                              className="group flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-surface/70"
                            >
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brass" aria-hidden />
                              <span className="min-w-0">
                                <span className="flex items-center gap-2">
                                  <span className="text-[14px] text-bone group-hover:text-brass-hi">
                                    {s.name}
                                  </span>
                                  <span className="label rounded-sm border border-jade/40 px-1.5 py-0.5 text-[9px] text-jade">
                                    Live
                                  </span>
                                </span>
                                <span className="mt-0.5 block text-[12.5px] leading-snug text-slate">
                                  {s.blurb}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ) : (
                          // Not a link. A menu must not promise a page that
                          // does not exist.
                          <li
                            key={s.slug}
                            className="flex cursor-default items-start gap-3 rounded-md px-3 py-2.5 opacity-55"
                          >
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line-3" aria-hidden />
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="text-[14px] text-ash">{s.name}</span>
                                <span className="label rounded-sm border border-line-3 px-1.5 py-0.5 text-[9px] text-slate">
                                  Soon
                                </span>
                              </span>
                              <span className="mt-0.5 block text-[12.5px] leading-snug text-slate">
                                {s.blurb}
                              </span>
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </motion.div>
                </div>
              </div>

              {/* footer bar */}
              <div className="relative z-2 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-ink/50 px-6 py-3.5">
                <p className="text-[12.5px] text-slate">
                  <span className="font-mono text-brass tnum">{totalServices}</span> services ·{" "}
                  <span className="font-mono text-jade tnum">{liveServices.length}</span> live today
                </p>
                <div className="flex items-center gap-5">
                  <span className="hidden items-center gap-2 text-[12.5px] text-slate sm:flex">
                    Search
                    <kbd className="rounded border border-line-3 bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ash">
                      ⌘K
                    </kbd>
                  </span>
                  <Link
                    href="/services"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1.5 text-[13px] text-brass transition-colors hover:text-brass-hi"
                  >
                    All services
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 6h7M6.5 3.5 9 6l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
