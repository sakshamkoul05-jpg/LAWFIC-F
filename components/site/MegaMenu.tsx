"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { categories, liveServices, totalServices } from "@/lib/catalogue";
import CategoryIcon from "./CategoryIcon";

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
        className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
          active || open ? "bg-primary-light text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground"
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
            className="fixed left-1/2 top-[calc(var(--header-h,82px))] z-50 w-[min(1120px,calc(100vw-2.5rem))] -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
              <div className="relative grid md:grid-cols-[266px_1fr]">
                {/* category rail */}
                <div className="border-b border-border bg-surface-2 p-3 md:border-b-0 md:border-r">
                  <p className="label px-3 py-2">Categories</p>
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
                            className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left transition-colors ${
                              on ? "bg-primary-light text-primary" : "text-muted hover:bg-surface hover:text-foreground"
                            }`}
                          >
                            <CategoryIcon name={c.icon} className={on ? "text-primary" : "text-subtle"} />
                            <span className="flex-1 text-[13.5px] leading-tight">{c.name}</span>
                            {live > 0 && (
                              <span className="size-1.5 rounded-full bg-success" title={`${live} live`} />
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
                <div className="p-5">
                  <motion.div
                    key={category.id}
                    initial={reduced ? false : { opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="mb-4 flex items-start gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded border border-border bg-surface-2 text-primary">
                        <CategoryIcon name={category.icon} />
                      </span>
                      <div>
                        <h3 className="text-[17px] font-bold text-foreground">
                          {category.name}
                        </h3>
                        <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-subtle">
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
                              className="group flex items-start gap-3 rounded px-3 py-2.5 transition-colors hover:bg-surface-2"
                            >
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                              <span className="min-w-0">
                                <span className="flex items-center gap-2">
                                  <span className="text-[14px] text-foreground group-hover:text-primary">
                                    {s.name}
                                  </span>
                                  <span className="label rounded-sm border border-success/30 px-1.5 py-0.5 text-[9px] text-success">
                                    Live
                                  </span>
                                </span>
                                <span className="mt-0.5 block text-[12.5px] leading-snug text-subtle">
                                  {s.blurb}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ) : (
                          <li
                            key={s.slug}
                            className="flex cursor-default items-start gap-3 rounded px-3 py-2.5 opacity-50"
                          >
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border-3" aria-hidden />
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="text-[14px] text-muted">{s.name}</span>
                                <span className="label rounded-sm border border-border px-1.5 py-0.5 text-[9px] text-subtle">
                                  Soon
                                </span>
                              </span>
                              <span className="mt-0.5 block text-[12.5px] leading-snug text-subtle">
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-2 px-5 py-3">
                <p className="text-[12.5px] text-subtle">
                  <span className="font-mono text-primary tabular-nums">{totalServices}</span> services ·{" "}
                  <span className="font-mono text-success tabular-nums">{liveServices.length}</span> live today
                </p>
                <div className="flex items-center gap-5">
                  <span className="hidden items-center gap-2 text-[12.5px] text-subtle sm:flex">
                    Search
                    <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">
                      ⌘K
                    </kbd>
                  </span>
                  <Link
                    href="/services"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1.5 text-[13px] text-primary hover:text-primary-hover"
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
