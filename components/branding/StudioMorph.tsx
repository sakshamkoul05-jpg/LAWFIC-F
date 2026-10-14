"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { STUDIO_SERVICES, type ServiceId } from "@/lib/branding";

/**
 * The studio's one big moving piece: a single frame that becomes whatever you
 * point at. Website → a browser assembles itself with a phone sliding in.
 * Marketing → a post whose reach counts up. Photoshoot → a viewfinder that
 * focuses and fires. Leads → a funnel with visitors falling through it.
 * SaaS → a dashboard whose chart draws itself.
 *
 * It cycles on its own until someone touches it, then it is theirs. Every
 * figure inside is an illustration and is labelled as one.
 */

const CYCLE_MS = 4800;

export default function StudioMorph() {
  const reduced = !!useReducedMotion();
  const [active, setActive] = useState<ServiceId>("web");
  const [auto, setAuto] = useState(true);
  const idx = STUDIO_SERVICES.findIndex((s) => s.id === active);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!auto || reduced) return;
    timer.current = setInterval(() => {
      setActive((cur) => {
        const i = STUDIO_SERVICES.findIndex((s) => s.id === cur);
        return STUDIO_SERVICES[(i + 1) % STUDIO_SERVICES.length].id;
      });
    }, CYCLE_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [auto, reduced]);

  const pick = (id: ServiceId) => {
    setAuto(false);
    setActive(id);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14">
      <div role="tablist" aria-label="Studio services" className="flex flex-col">
        {STUDIO_SERVICES.map((s, i) => {
          const on = s.id === active;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={on}
              aria-controls="studio-stage"
              onClick={() => pick(s.id)}
              onMouseEnter={() => pick(s.id)}
              onFocus={() => pick(s.id)}
              className="group relative border-t border-border py-4 text-left last:border-b focus-visible:outline-none"
            >
              {/* progress bar for the auto-cycle */}
              {on && auto && !reduced && (
                <motion.span
                  key={`bar-${s.id}`}
                  className="absolute left-0 top-[-1px] h-[2px] bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: CYCLE_MS / 1000, ease: "linear" }}
                  aria-hidden
                />
              )}
              {on && (!auto || reduced) && <span className="absolute left-0 top-[-1px] h-[2px] w-full bg-primary" aria-hidden />}
              <span className="flex items-baseline gap-4">
                <span className={`font-mono text-[12px] tabular-nums ${on ? "text-primary" : "text-subtle"}`}>0{i + 1}</span>
                <span
                  className={`text-[clamp(1.25rem,2.4vw,1.8rem)] font-semibold leading-tight tracking-[-0.025em] transition-colors duration-300 group-focus-visible:underline ${
                    on ? "text-foreground" : "text-foreground/35 group-hover:text-foreground/70"
                  }`}
                >
                  {s.name}
                </span>
              </span>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.p
                    initial={reduced ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduced ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden pl-9 text-[14px] leading-relaxed text-muted"
                  >
                    <span className="block pt-2">{s.line}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      <div
        id="studio-stage"
        role="tabpanel"
        aria-label={STUDIO_SERVICES[idx].name}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-border bg-surface"
        onMouseEnter={() => setAuto(false)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-primary-light),transparent_60%)]" aria-hidden />
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="absolute inset-0 p-[6%]"
            initial={reduced ? false : { opacity: 0, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={reduced ? undefined : { opacity: 0, scale: 1.03, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {active === "web" && <WebScene reduced={reduced} />}
            {active === "marketing" && <MarketingScene reduced={reduced} />}
            {active === "photoshoot" && <PhotoScene reduced={reduced} />}
            {active === "leads" && <LeadsScene reduced={reduced} />}
            {active === "saas" && <SaasScene reduced={reduced} />}
          </motion.div>
        </AnimatePresence>
        <span className="absolute bottom-3 right-4 text-[10.5px] text-subtle">Illustration</span>
      </div>
    </div>
  );
}

/* ── scenes ────────────────────────────────────────────────────────────── */

const pop = (reduced: boolean, delay: number) =>
  reduced ? { initial: false as const } : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, type: "spring" as const, stiffness: 260, damping: 22 } };

function WebScene({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative h-full">
      <motion.div {...pop(reduced, 0)} className="absolute inset-y-[4%] left-0 right-[18%] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
          {[0, 1, 2].map((d) => (
            <span key={d} className="size-2 rounded-full bg-border" />
          ))}
          <motion.span
            className="ml-3 h-4 rounded-full bg-surface-2 px-2 font-mono text-[9px] leading-4 text-subtle"
            initial={reduced ? false : { width: 0 }}
            animate={{ width: "52%" }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            yourbrand.in
          </motion.span>
        </div>
        <div className="grid gap-[5%] p-[5%]">
          <motion.div {...pop(reduced, 0.25)} className="flex items-center justify-between">
            <span className="h-3 w-16 rounded bg-primary" />
            <span className="flex gap-2">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-2 w-8 rounded bg-border" />
              ))}
            </span>
          </motion.div>
          <motion.div {...pop(reduced, 0.4)} className="rounded-xl bg-primary-light p-[6%]">
            <span className="block h-3.5 w-3/5 rounded bg-foreground/70" />
            <span className="mt-2 block h-2 w-4/5 rounded bg-foreground/20" />
            <span className="mt-3 block h-5 w-20 rounded-full bg-primary" />
          </motion.div>
          <div className="grid grid-cols-3 gap-[4%]">
            {[0, 1, 2].map((c) => (
              <motion.div key={c} {...pop(reduced, 0.55 + c * 0.1)} className="aspect-[4/3] rounded-lg bg-surface-2" />
            ))}
          </div>
        </div>
      </motion.div>
      <motion.div
        className="absolute bottom-0 right-0 top-[14%] w-[30%] overflow-hidden rounded-[22px] border-4 border-foreground/85 bg-background shadow-2xl"
        initial={reduced ? false : { x: 60, opacity: 0, rotate: 6 }}
        animate={{ x: 0, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 160, damping: 18 }}
      >
        <div className="mx-auto mt-1.5 h-1.5 w-1/3 rounded-full bg-foreground/80" />
        <div className="grid gap-2 p-2.5">
          <span className="h-14 rounded-lg bg-primary-light" />
          {[0, 1, 2].map((r) => (
            <span key={r} className="flex items-center gap-1.5">
              <span className="size-5 rounded-md bg-surface-2" />
              <span className="h-1.5 flex-1 rounded bg-border" />
            </span>
          ))}
          <span className="mt-1 h-5 rounded-full bg-primary" />
        </div>
      </motion.div>
    </div>
  );
}

function Counter({ to, reduced, prefix = "", suffix = "" }: { to: number; reduced: boolean; prefix?: string; suffix?: string }) {
  const [v, setV] = useState(reduced ? to : 0);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1400);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, reduced]);
  return (
    <span className="tabular-nums">
      {prefix}
      {v.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

function MarketingScene({ reduced }: { reduced: boolean }) {
  return (
    <div className="grid h-full grid-cols-[1fr_0.9fr] gap-[5%]">
      <motion.div {...pop(reduced, 0)} className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-center gap-2 p-3">
          <span className="size-7 rounded-full bg-primary" />
          <span className="h-2 w-20 rounded bg-border" />
        </div>
        <div className="relative flex-1 bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-accent-light))]">
          {!reduced &&
            [0, 1, 2, 3, 4].map((h) => (
              <motion.span
                key={h}
                className="absolute bottom-2 text-[18px] text-destructive"
                style={{ left: `${15 + h * 16}%` }}
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: -120, opacity: [0, 1, 0] }}
                transition={{ delay: 0.4 + h * 0.35, duration: 1.8, repeat: Infinity, repeatDelay: 1.2 }}
                aria-hidden
              >
                ♥
              </motion.span>
            ))}
        </div>
        <div className="flex gap-3 p-3 text-[11px] text-muted">
          <span>♥ <Counter to={2148} reduced={reduced} /></span>
          <span>↗ <Counter to={312} reduced={reduced} /></span>
        </div>
      </motion.div>
      <div className="flex flex-col justify-center gap-4">
        {[
          { k: "Reach", to: 48200 },
          { k: "Website visits", to: 3940 },
          { k: "Enquiries", to: 186 },
        ].map((m, i) => (
          <motion.div key={m.k} {...pop(reduced, 0.2 + i * 0.12)} className="rounded-2xl border border-border bg-background p-3">
            <p className="text-[11px] text-subtle">{m.k}</p>
            <p className="font-mono text-[clamp(1rem,2.4vw,1.5rem)] text-foreground">
              <Counter to={m.to} reduced={reduced} />
            </p>
            <div className="mt-1.5 flex h-6 items-end gap-1">
              {[0.3, 0.45, 0.4, 0.62, 0.7, 0.85, 1].map((h, b) => (
                <motion.span
                  key={b}
                  className="flex-1 rounded-sm bg-primary/70"
                  initial={reduced ? false : { height: 0 }}
                  animate={{ height: `${h * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.1 + b * 0.05 }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PhotoScene({ reduced }: { reduced: boolean }) {
  const [shot, setShot] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setShot(true), 1500);
    return () => clearTimeout(t);
  }, [reduced]);
  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-[#14161a]">
      {/* the "scene": a product on a plinth */}
      <motion.div
        className="absolute inset-0"
        initial={reduced ? false : { filter: "blur(10px)" }}
        animate={{ filter: "blur(0px)" }}
        transition={{ delay: 0.5, duration: 0.9 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#3a3326,#14161a_70%)]" />
        <div className="absolute bottom-[18%] left-1/2 h-[12%] w-[46%] -translate-x-1/2 rounded-[50%] bg-black/50 blur-md" />
        <div className="absolute bottom-[22%] left-1/2 h-[44%] w-[22%] -translate-x-1/2 rounded-t-[40%] rounded-b-xl bg-[linear-gradient(160deg,#e8cf86,#8a6a0b)] shadow-2xl" />
        <div className="absolute bottom-[56%] left-1/2 h-[8%] w-[12%] -translate-x-1/2 rounded-md bg-[#2b2b2b]" />
      </motion.div>
      {/* viewfinder */}
      {[
        "left-[8%] top-[8%] border-l-2 border-t-2",
        "right-[8%] top-[8%] border-r-2 border-t-2",
        "left-[8%] bottom-[8%] border-l-2 border-b-2",
        "right-[8%] bottom-[8%] border-r-2 border-b-2",
      ].map((c) => (
        <span key={c} className={`absolute size-[10%] border-white/80 ${c}`} aria-hidden />
      ))}
      <motion.span
        className="absolute left-1/2 top-[44%] size-[18%] -translate-x-1/2 -translate-y-1/2 rounded-md border-2"
        initial={reduced ? false : { scale: 1.6, borderColor: "rgba(255,255,255,0.7)" }}
        animate={{ scale: 1, borderColor: "rgba(111,191,149,1)" }}
        transition={{ delay: 0.5, duration: 0.8 }}
        aria-hidden
      />
      <div className="absolute left-[10%] top-[11%] flex items-center gap-2 font-mono text-[10px] text-white/80">
        <span className="size-2 rounded-full bg-destructive" /> f/2.8 · 1/250 · ISO 200
      </div>
      {/* shutter flash */}
      <AnimatePresence>
        {shot && !reduced && (
          <motion.span
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            aria-hidden
          />
        )}
      </AnimatePresence>
      {/* contact strip */}
      <div className="absolute bottom-3 right-3 flex gap-1.5">
        {[0, 1, 2].map((p) => (
          <motion.span
            key={p}
            className="h-10 w-8 rounded-[4px] border-2 border-white bg-[linear-gradient(160deg,#e8cf86,#3a3326)] shadow-lg"
            initial={reduced ? false : { y: 30, opacity: 0, rotate: 0 }}
            animate={shot ? { y: 0, opacity: 1, rotate: (p - 1) * 8 } : { y: 30, opacity: 0 }}
            transition={{ delay: 0.15 + p * 0.12, type: "spring", stiffness: 300, damping: 18 }}
          />
        ))}
      </div>
    </div>
  );
}

function LeadsScene({ reduced }: { reduced: boolean }) {
  const stages = [
    { k: "Visitors", n: 4200, w: 100 },
    { k: "Engaged", n: 960, w: 74 },
    { k: "Enquiries", n: 210, w: 50 },
    { k: "Customers", n: 64, w: 30 },
  ];
  return (
    <div className="relative grid h-full grid-cols-[1fr_auto] items-center gap-[4%]">
      <div className="relative flex h-full flex-col items-center justify-center gap-[3%]">
        {stages.map((s, i) => (
          <motion.div
            key={s.k}
            className="flex h-[19%] items-center justify-center rounded-xl text-[11px] font-medium text-background"
            style={{ width: `${s.w}%`, background: `color-mix(in oklab, var(--color-primary) ${100 - i * 18}%, var(--color-accent))` }}
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.15, type: "spring", stiffness: 200, damping: 20 }}
          >
            {s.k}
          </motion.div>
        ))}
        {!reduced &&
          Array.from({ length: 14 }, (_, d) => (
            <motion.span
              key={d}
              className="absolute size-2 rounded-full bg-foreground"
              style={{ left: `${30 + ((d * 37) % 40)}%`, top: "-4%" }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: [0, 80, 160, 240], x: [0, ((d % 5) - 2) * 6, 0, 0], opacity: [0, 1, 1, d % 3 === 0 ? 1 : 0] }}
              transition={{ delay: 0.6 + d * 0.22, duration: 2.4, repeat: Infinity, repeatDelay: 1 }}
              aria-hidden
            />
          ))}
      </div>
      <div className="flex h-full flex-col justify-center gap-[3%]">
        {stages.map((s) => (
          <p key={s.k} className="flex h-[19%] items-center font-mono text-[clamp(0.8rem,1.6vw,1.05rem)] text-foreground">
            <Counter to={s.n} reduced={reduced} />
          </p>
        ))}
      </div>
    </div>
  );
}

function SaasScene({ reduced }: { reduced: boolean }) {
  const path = "M0 80 C 20 70, 30 72, 45 58 S 70 50, 85 34 S 110 30, 130 16 S 150 14, 160 6";
  return (
    <div className="grid h-full grid-cols-[18%_1fr] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
      <div className="flex flex-col gap-2 border-r border-border bg-surface-2 p-3">
        <span className="mb-2 h-3 w-10 rounded bg-primary" />
        {[0, 1, 2, 3, 4].map((r) => (
          <motion.span key={r} {...pop(reduced, r * 0.06)} className={`h-2 rounded ${r === 1 ? "bg-primary/60" : "bg-border"}`} />
        ))}
      </div>
      <div className="grid grid-rows-[auto_1fr] gap-3 p-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { k: "Bookings", to: 128 },
            { k: "Revenue", to: 84250, prefix: "₹" },
            { k: "Active", to: 37 },
          ].map((m, i) => (
            <motion.div key={m.k} {...pop(reduced, 0.15 + i * 0.1)} className="rounded-xl border border-border p-2.5">
              <p className="text-[10px] text-subtle">{m.k}</p>
              <p className="font-mono text-[clamp(0.85rem,1.8vw,1.2rem)] text-foreground">
                <Counter to={m.to} reduced={reduced} prefix={m.prefix} />
              </p>
            </motion.div>
          ))}
        </div>
        <div className="relative rounded-xl border border-border p-3">
          <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
            {[20, 45, 70].map((y) => (
              <line key={y} x1="0" x2="160" y1={y} y2={y} stroke="var(--color-border)" strokeWidth="0.5" />
            ))}
            <motion.path
              d={`${path} L160 90 L0 90 Z`}
              fill="var(--color-primary-light)"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            />
            <motion.path
              d={path}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 1.2, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
