"use client";

import { motion, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { APPS, SITES, type AppProject, type SiteProject } from "@/lib/branding";
import { AppIcon, SiteShot, usePointerFine } from "./Shared";

/**
 * The work, as an index.
 *
 * Every live site and app is one row, its name set large. With a mouse, a
 * window follows the cursor and slides to whichever row you are over — the
 * site's homepage or the app's icon — so the list reads as type until you
 * want to see. On touch screens there is no hover, so each row carries its own
 * picture instead. Websites and apps are two views of the same index.
 */

type Row =
  | { kind: "site"; key: string; title: string; tag: string; line: string; href: string; site: SiteProject }
  | { kind: "app"; key: string; title: string; tag: string; line: string; href: string; app: AppProject };

const SITE_ROWS: Row[] = SITES.map((s) => ({ kind: "site", key: s.domain, title: s.domain, tag: s.kind, line: s.line, href: s.url, site: s }));
const APP_ROWS: Row[] = APPS.map((a) => ({
  kind: "app",
  key: a.playId,
  title: a.name.replace(/ — .*/, ""),
  tag: a.category,
  line: a.line,
  href: `https://play.google.com/store/apps/details?id=${a.playId}`,
  app: a,
}));

const VIEWS = [
  { id: "sites", label: "Websites", rows: SITE_ROWS },
  { id: "apps", label: "Apps", rows: APP_ROWS },
] as const;

function AppPanel({ app }: { app: AppProject }) {
  return (
    <span className="flex size-full items-center gap-6 bg-surface-2 px-[9%]">
      <AppIcon app={app} className="size-28 shrink-0 text-[34px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]" />
      <span className="min-w-0">
        <span className="block text-[20px] font-medium leading-tight tracking-[-0.02em] text-foreground">{app.name}</span>
        <span className="mt-1 block text-[14px] text-muted">{app.category} on Google Play</span>
      </span>
    </span>
  );
}

export default function WorkIndex() {
  const reduced = !!useReducedMotion();
  const fine = usePointerFine();
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("sites");
  const [active, setActive] = useState<number | null>(null);
  const last = useRef(0);
  if (active !== null) last.current = active;

  const rows = VIEWS.find((v) => v.id === view)!.rows;
  const x = useSpring(0, { stiffness: 300, damping: 32, mass: 0.5 });
  const y = useSpring(0, { stiffness: 300, damping: 32, mass: 0.5 });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-foreground pb-5">
        <h2 className="text-[clamp(2.6rem,7.4vw,7rem)] font-medium leading-[0.95] tracking-[-0.055em] text-foreground">Full index</h2>
        <div role="tablist" aria-label="Show" className="flex gap-1 rounded-full border border-border p-1">
          {VIEWS.map((v) => {
            const on = v.id === view;
            return (
              <button
                key={v.id}
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setView(v.id);
                  setActive(null);
                  last.current = 0;
                }}
                className={`relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
                  on ? "text-background" : "text-muted hover:text-foreground"
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="work-view"
                    className="absolute inset-0 rounded-full bg-foreground"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">
                  {v.label} <span className="tabular-nums opacity-60">{v.rows.length}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ul
        data-cursor="hide"
        onMouseMove={(e) => {
          x.set(e.clientX);
          y.set(e.clientY);
        }}
        onMouseLeave={() => setActive(null)}
      >
        {rows.map((r, i) => {
          const dim = fine && active !== null && active !== i;
          return (
            <li key={`${view}-${r.key}`} className="border-b border-border">
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={`group grid gap-x-10 gap-y-4 py-7 transition-opacity duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:py-9 lg:grid-cols-[minmax(0,1fr)_11rem_19rem] lg:items-center ${
                  dim ? "opacity-25" : "opacity-100"
                }`}
              >
                <span className="flex min-w-0 items-center gap-4">
                  {r.kind === "app" && (
                    <AppIcon app={r.app} className="size-12 shrink-0 text-[15px] [@media(hover:hover)_and_(pointer:fine)]:hidden" />
                  )}
                  <span
                    className={`min-w-0 text-[clamp(1.7rem,4.5vw,4.25rem)] font-medium leading-[1] tracking-[-0.055em] text-foreground ${
                      reduced ? "" : "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-4"
                    }`}
                  >
                    {/* let long domains break after a dot, never mid-word */}
                    {r.title.split(".").map((part, k, all) => (
                      <span key={k}>
                        {part}
                        {k < all.length - 1 && (
                          <>
                            .<wbr />
                          </>
                        )}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="text-[14px] text-muted lg:text-[15px]">{r.tag}</span>
                <span className="hidden text-[14px] leading-snug text-muted lg:block">{r.line}</span>
                {r.kind === "site" && (
                  <SiteShot site={r.site} className="aspect-[16/10] w-full rounded-xl lg:col-span-3 [@media(hover:hover)_and_(pointer:fine)]:hidden" />
                )}
              </a>
            </li>
          );
        })}
      </ul>

      {/* the window that follows the cursor */}
      {fine && (
        <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-50" style={{ x, y }}>
          <motion.div
            initial={false}
            animate={{ scale: active !== null ? 1 : 0, opacity: active !== null ? 1 : 0 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 }}
            className="relative -ml-[200px] -mt-[125px] h-[250px] w-[400px] overflow-hidden rounded-2xl shadow-[0_40px_80px_-30px_rgba(0,0,0,0.55)]"
          >
            <motion.div
              initial={false}
              animate={{ y: -last.current * 250 }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 30 }}
            >
              {rows.map((r) => (
                <span key={r.key} className="block h-[250px] w-[400px]">
                  {r.kind === "site" ? <SiteShot site={r.site} eager className="size-full" /> : <AppPanel app={r.app} />}
                </span>
              ))}
            </motion.div>
            <span className="absolute bottom-4 right-4 flex size-[64px] items-center justify-center rounded-full bg-foreground text-[13px] font-medium text-background">
              {view === "sites" ? "Visit" : "Open"}
            </span>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
