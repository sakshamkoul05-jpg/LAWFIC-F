"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { APPS, SITES, type AppProject } from "@/lib/branding";

/**
 * What has already shipped.
 *
 * Apps are tiles that tilt toward the cursor like a phone picked up off a
 * table; each opens its Play Store page. Websites are a list of domains set
 * large — hover or tap one and a browser bar slides out and types its address,
 * with a line about the business.
 */

function AppTile({ app, reduced }: { app: AppProject; reduced: boolean }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 220, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 220, damping: 18 });
  const [broken, setBroken] = useState(!app.icon);

  return (
    <motion.a
      href={`https://play.google.com/store/apps/details?id=${app.playId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block [perspective:800px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      onMouseMove={(e) => {
        if (reduced) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div
        style={reduced ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="relative rounded-[26px] border border-border bg-surface p-5 transition-shadow duration-300 group-hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-start gap-4" style={{ transform: "translateZ(30px)" }}>
          {broken ? (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-[22px] font-bold tracking-[-0.04em] text-background">
              {app.mono}
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={app.icon}
              alt=""
              width={64}
              height={64}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setBroken(true)}
              className="size-16 shrink-0 rounded-[18px] object-cover shadow-md"
            />
          )}
          <div className="min-w-0">
            <p className="text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-foreground">{app.name}</p>
            <p className="mt-0.5 text-[12px] text-subtle">{app.category}</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted" style={{ transform: "translateZ(18px)" }}>
          {app.line}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-primary" style={{ transform: "translateZ(24px)" }}>
          <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
            <path fill="currentColor" d="M4 3.5v17l9.2-8.5L4 3.5Zm10.6 9.8 2.6 2.4-11 6.1 8.4-8.5Zm0-2.6L6.2 2.2l11 6.1-2.6 2.4Zm3.9-1.6 2.9 1.6c.8.5.8 1.6 0 2.1l-2.9 1.6-2.8-2.6 2.8-2.7Z" />
          </svg>
          Live on Google Play
        </span>
      </motion.div>
    </motion.a>
  );
}

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
    <div className="grid gap-20">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="text-[clamp(1.5rem,3vw,2.2rem)] font-semibold tracking-[-0.03em] text-foreground">Apps live on Google Play</h3>
          <p className="text-[13px] text-muted">{APPS.length} published apps. Tap one to open its store page.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((a, i) => (
            <motion.div
              key={a.playId}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (i % 3) * 0.08, type: "spring", stiffness: 200, damping: 24 }}
            >
              <AppTile app={a} reduced={reduced} />
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="text-[clamp(1.5rem,3vw,2.2rem)] font-semibold tracking-[-0.03em] text-foreground">Websites we have shipped</h3>
          <p className="text-[13px] text-muted">A selection — many more are live for customers.</p>
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
