"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { STUDIO_SERVICES, type ServiceId } from "@/lib/branding";
import QuoteButton from "./QuoteButton";

/**
 * What the studio does, as one list that opens a row at a time.
 *
 * The menu links to /branding#web-apps, #marketing … and to older anchors
 * (#static-site, #apps, #advertising). Arriving on any of them — or following
 * one while already on the page — opens the matching row.
 */

export default function ServiceList() {
  const reduced = !!useReducedMotion();
  const [open, setOpen] = useState<ServiceId | null>("web");

  useEffect(() => {
    const sync = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      const s = STUDIO_SERVICES.find((x) => x.anchor === h || x.aliases?.includes(h));
      if (s) setOpen(s.id);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <div className="border-t border-foreground">
      {STUDIO_SERVICES.map((s) => {
        const on = open === s.id;
        const panel = `service-${s.id}`;
        return (
          <article key={s.id} id={s.anchor} className="relative scroll-mt-32 border-b border-border">
            {s.aliases?.map((a) => (
              <span key={a} id={a} className="absolute -top-32" aria-hidden />
            ))}
            <h3>
              <button
                type="button"
                aria-expanded={on}
                aria-controls={panel}
                onClick={() => setOpen(on ? null : s.id)}
                className="group flex w-full items-center justify-between gap-6 py-7 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:py-8"
              >
                <span
                  className={`text-[clamp(1.5rem,3.4vw,3rem)] font-medium leading-none tracking-[-0.045em] transition-colors ${
                    on ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                  }`}
                >
                  {s.name}
                </span>
                <span
                  className={`relative flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    on ? "border-foreground bg-foreground text-background" : "border-border-3 text-foreground group-hover:border-foreground"
                  }`}
                  aria-hidden
                >
                  <span className="absolute h-px w-4 bg-current" />
                  <motion.span
                    className="absolute h-4 w-px bg-current"
                    initial={false}
                    animate={{ rotate: on ? 90 : 0 }}
                    transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div
                  id={panel}
                  key="panel"
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-8 pb-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div>
                      <p className="max-w-[40ch] text-[17px] leading-relaxed text-foreground">{s.line}</p>
                      <div className="mt-6">
                        <QuoteButton service={s.id} label={`Ask about ${s.name.toLowerCase()}`} />
                      </div>
                    </div>
                    <ul className="grid gap-x-8 sm:grid-cols-2">
                      {s.includes.map((x) => (
                        <li key={x} className="border-t border-border py-3 text-[15px] leading-snug text-muted">
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </article>
        );
      })}
    </div>
  );
}
