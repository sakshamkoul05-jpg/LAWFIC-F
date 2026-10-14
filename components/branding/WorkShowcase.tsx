"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { APPS, SITES } from "@/lib/branding";
import AppFan from "./AppFan";
import { DomainMarquee } from "./Motion";

/**
 * What has already shipped.
 *
 * Apps are a hand of phones that fans out as you scroll (AppFan). Websites are a list of domains set
 * large — hover or tap one and a browser bar slides out and types its address,
 * with a line about the business.
 */

function Typed({ text, reduced }: { text: string; reduced: boolean }) {
  const [n, setN] = useState(reduced ? text.length : 0);
  useEffect(() => {
    if (reduced) return;
    setN(0);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setN(i);
      if (i >= text.length) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [text, reduced]);
  return (
    <span>
      {text.slice(0, n)}
      {n < text.length && <span className="ml-px inline-block h-3 w-px animate-pulse bg-foreground align-middle" />}
    </span>
  );
}

export default function WorkShowcase() {
  const reduced = !!useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-20">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="text-[clamp(1.5rem,3vw,2.2rem)] font-semibold tracking-[-0.03em] text-foreground">Apps live on Google Play</h3>
          <p className="text-[13px] text-muted">{APPS.length} published apps. Hover one to lift it, tap to open its store page.</p>
        </div>
        <div className="mt-10">
          <AppFan />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="text-[clamp(1.5rem,3vw,2.2rem)] font-semibold tracking-[-0.03em] text-foreground">Websites we have shipped</h3>
          <p className="text-[13px] text-muted">A selection — many more are live for customers.</p>
        </div>
        <div className="mt-6">
          <DomainMarquee rows={[SITES.slice(0, 5).map((x) => x.domain), SITES.slice(5).map((x) => x.domain)]} />
        </div>
        <ul className="mt-8 border-t border-border">
          {SITES.map((s) => {
            const on = open === s.domain;
            return (
              <li key={s.domain} className="border-b border-border" onMouseEnter={() => setOpen(s.domain)} onMouseLeave={() => setOpen(null)}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 sm:py-5">
                  <button
                    type="button"
                    onClick={() => setOpen(on ? null : s.domain)}
                    onFocus={() => setOpen(s.domain)}
                    aria-expanded={on}
                    className={`min-w-0 flex-1 text-left text-[clamp(1.25rem,3.6vw,2.6rem)] font-semibold leading-tight tracking-[-0.035em] transition-colors duration-300 focus-visible:outline-none focus-visible:underline ${
                      on ? "text-primary" : "text-foreground"
                    }`}
                  >
                    <span className="break-all">{s.domain}</span>
                  </button>
                  <span className="rounded-full border border-border px-3 py-1 text-[12px] text-muted">{s.kind}</span>
                </div>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      initial={reduced ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduced ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center gap-4 pb-6">
                        <motion.a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={reduced ? false : { x: -24, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="flex min-w-0 max-w-full items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 font-mono text-[12.5px] text-foreground hover:border-primary/50"
                        >
                          <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-success" aria-hidden>
                            <path fill="currentColor" d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm-2 5V4a2 2 0 1 1 4 0v2H6Z" />
                          </svg>
                          <span className="truncate">
                            <Typed text={`https://${s.domain}`} reduced={reduced} />
                          </span>
                          <span className="shrink-0 text-subtle">Visit</span>
                        </motion.a>
                        <p className="text-[14px] text-muted">{s.line}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
