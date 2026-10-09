"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  BOUNDARIES,
  MAX_DAYS,
  SINGLE_PROOF_FROM,
  SINGLE_PROOF_USES,
  TIERS,
  daysFromT,
  describeDays,
  tFromDays,
  tierFor,
  type Tier,
} from "@/lib/birth-registration";

/**
 * The birth-registration dial.
 *
 * One idea: the rule that applies to a birth certificate depends on nothing
 * but how long ago the birth was. So the page is a clock you can drag — and
 * as the hand crosses 21 days, a month, a year, two years, the authority, the
 * papers and the stamp change under it. Or type the date of birth and the hand
 * swings to it.
 *
 * The visible dial is pointer-driven; keyboard and screen-reader users get the
 * same control as a real range input laid over it, so nothing here depends on
 * being able to drag.
 */

const SIZE = 400;
const C = SIZE / 2;
const R = 140;
const SWEEP = 300; // degrees; the gap sits at the bottom
const START = -SWEEP / 2;

const TONE: Record<Tier["tone"], string> = {
  good: "var(--color-success)",
  warn: "var(--color-primary)",
  info: "var(--color-accent)",
  bad: "var(--color-destructive)",
};

function polar(t: number, r = R) {
  const a = ((START + t * SWEEP) * Math.PI) / 180;
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) };
}

function arc(t0: number, t1: number, r = R) {
  const p0 = polar(t0, r);
  const p1 = polar(t1, r);
  const large = (t1 - t0) * SWEEP > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
}

function todayIST(): string {
  const d = new Date(Date.now() + 330 * 60_000);
  return d.toISOString().slice(0, 10);
}

function daysSince(dob: string): number {
  const [y, m, d] = dob.split("-").map(Number);
  const [ty, tm, td] = todayIST().split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86_400_000);
}

export default function BirthClock() {
  const reduced = useReducedMotion();
  /* The dial position is the state; days are derived from it. Storing days
     instead would round every small keyboard step back to the same day and
     the arrow keys would never move the hand. */
  const [t, setT] = useState(() => tFromDays(12));
  const days = daysFromT(t);
  const setDays = (d: number) => setT(tFromDays(d));
  const [dob, setDob] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const rangeId = useId();

  const tier = tierFor(days);
  const label = describeDays(days);
  const hand = polar(t);
  const singleProof = dob !== "" && dob >= SINGLE_PROOF_FROM;

  const setFromPointer = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const x = ((clientX - box.left) / box.width) * SIZE - C;
    const y = ((clientY - box.top) / box.height) * SIZE - C;
    let a = (Math.atan2(x, -y) * 180) / Math.PI; // 0 at top, clockwise
    if (a > SWEEP / 2) a = SWEEP / 2;
    if (a < -SWEEP / 2) a = -SWEEP / 2;
    setT((a - START) / SWEEP);
    setDob("");
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => dragging.current && setFromPointer(e.clientX, e.clientY);
    const up = () => (dragging.current = false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [setFromPointer]);

  /* Tier segments drawn as the ring's own colour bands. */
  const bands = useMemo(() => {
    const edges = [0, ...BOUNDARIES.map((b) => b.t), 1];
    return edges.slice(0, -1).map((t0, i) => ({ t0, t1: edges[i + 1], tier: TIERS[i] }));
  }, []);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16">
      {/* ── the dial ── */}
      <div className="relative mx-auto w-full max-w-[380px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full touch-none select-none"
          onPointerDown={(e) => {
            dragging.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            setFromPointer(e.clientX, e.clientY);
          }}
          aria-hidden
        >
          {/* faint tier bands */}
          {bands.map((b) => (
            <path key={b.tier.id} d={arc(b.t0 + 0.004, b.t1 - 0.004)} stroke={TONE[b.tier.tone]} strokeOpacity={0.16} strokeWidth={22} fill="none" strokeLinecap="butt" />
          ))}
          {/* travelled */}
          <motion.path
            d={arc(0, Math.max(0.001, t))}
            stroke={TONE[tier.tone]}
            strokeWidth={22}
            fill="none"
            initial={false}
            animate={{ stroke: TONE[tier.tone] }}
            transition={{ duration: reduced ? 0 : 0.35 }}
          />
          {/* boundary ticks with labels */}
          {BOUNDARIES.map((b) => {
            const p0 = polar(b.t, R - 20);
            const p1 = polar(b.t, R + 20);
            const pl = polar(b.t, R + 38);
            const text = b.days === 21 ? "21 d" : b.days === 30 ? "30 d" : b.days === 365 ? "1 yr" : "2 yr";
            return (
              <g key={b.days}>
                <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="var(--color-foreground)" strokeOpacity={0.55} strokeWidth={1.5} />
                <text x={pl.x} y={pl.y} textAnchor="middle" dominantBaseline="middle" className="fill-[var(--color-muted)] font-mono text-[11px]">
                  {text}
                </text>
              </g>
            );
          })}
          {/* the hand */}
          <line x1={C} y1={C} x2={hand.x} y2={hand.y} stroke="var(--color-foreground)" strokeOpacity={0.18} strokeWidth={1} />
          <motion.circle
            cx={hand.x}
            cy={hand.y}
            r={15}
            fill="var(--color-background)"
            stroke={TONE[tier.tone]}
            strokeWidth={5}
            className="cursor-grab active:cursor-grabbing"
            whileHover={reduced ? undefined : { scale: 1.12 }}
          />
          <text x={polar(0, R + 38).x - 6} y={polar(0, R + 38).y + 4} textAnchor="end" className="fill-[var(--color-subtle)] text-[11px]">
            birth
          </text>
        </svg>

        {/* centre readout */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-4 text-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={label.big + label.small}
              initial={reduced ? false : { y: 14, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={reduced ? undefined : { y: -14, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.22 }}
              className="font-mono text-[64px] leading-none tracking-[-0.04em] text-foreground tabular-nums sm:text-[76px]"
            >
              {label.big}
            </motion.span>
          </AnimatePresence>
          <span className="mt-2 text-[13px] text-muted">{label.small}</span>
        </div>

        {/* accessible control */}
        <label htmlFor={rangeId} className="sr-only">
          Time since birth
        </label>
        <input
          id={rangeId}
          type="range"
          min={0}
          max={1000}
          value={Math.round(t * 1000)}
          onChange={(e) => {
            setT(Number(e.target.value) / 1000);
            setDob("");
          }}
          aria-valuetext={`${label.big} ${label.small}: ${tier.title}`}
          className="peer absolute inset-x-0 bottom-0 h-px w-full cursor-pointer opacity-0" step={2}
        />
        <p className="text-center text-[12px] text-subtle peer-focus-visible:text-primary">
          Drag the handle around the dial, or use the arrow keys
        </p>
      </div>

      {/* ── what applies ── */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="block text-[12.5px] text-muted">Or enter the date of birth</span>
            <input
              type="date"
              value={dob}
              max={todayIST()}
              min="1950-01-01"
              onChange={(e) => {
                const v = e.target.value;
                setDob(v);
                if (v) setDays(Math.min(MAX_DAYS, Math.max(0, daysSince(v))));
              }}
              className="mt-1.5 rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-[14px] text-foreground outline-none focus:border-primary/50"
            />
          </label>
          {dob && daysSince(dob) > MAX_DAYS && (
            <span className="pb-2 text-[12px] text-subtle">Over twenty years — the same rule as the end of the dial applies.</span>
          )}
        </div>

        <div className="relative mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <Stamp tier={tier} reduced={!!reduced} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tier.id}
              initial={reduced ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -18 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pr-0 sm:pr-36"
            >
              <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{tier.title}</h3>
              <p className="mt-3 text-[14px] text-muted">
                Decided by <span className="text-foreground">{tier.decides}</span>. {tier.takes} with LAWFIC.
              </p>
              <ul className="mt-5 grid gap-2">
                {tier.need.map((n, i) => (
                  <motion.li
                    key={n}
                    initial={reduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduced ? 0 : 0.05 * i + 0.1 }}
                    className="flex gap-3 text-[14px] leading-relaxed text-muted"
                  >
                    <span className="mt-[9px] size-1.5 shrink-0 rounded-full" style={{ background: TONE[tier.tone] }} aria-hidden />
                    {n}
                  </motion.li>
                ))}
              </ul>
              {tier.pendingChange && <p className="mt-5 border-l-2 border-accent pl-3 text-[12.5px] text-muted">{tier.pendingChange}</p>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* the 2023 rule, lit up when it applies */}
        <div
          className={`mt-5 rounded-3xl border p-5 transition-colors duration-500 ${
            singleProof ? "border-success/40 bg-success-light" : "border-border"
          }`}
        >
          <p className="text-[14px] text-foreground">
            {singleProof
              ? "Born after 1 October 2023 — this one certificate is the proof of date of birth for all of these:"
              : "Born on or after 1 October 2023? The birth certificate is then the single proof of date of birth for:"}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SINGLE_PROOF_USES.map((u, i) => (
              <motion.li
                key={u}
                animate={singleProof && !reduced ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className={`rounded-full px-3 py-1 text-[12.5px] ${singleProof ? "bg-success text-background" : "bg-surface-2 text-muted"}`}
              >
                {u}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** LAWFIC's own mark naming who signs — deliberately not a government seal. */
function Stamp({ tier, reduced }: { tier: Tier; reduced: boolean }) {
  const id = useId().replace(/:/g, "");
  const text = `WHO SIGNS · ${tier.stamp} · `;
  return (
    <div className="pointer-events-none absolute right-5 top-5 hidden size-28 sm:block" aria-hidden>
      <AnimatePresence initial={false}>
        <motion.svg
          key={tier.id}
          viewBox="0 0 120 120"
          className="absolute inset-0"
          initial={reduced ? false : { scale: 1.9, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: -9, opacity: 0.9 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          style={{ color: TONE[tier.tone] }}
        >
          <defs>
            <path id={`ring-${id}`} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
          </defs>
          <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <text className="font-mono" fontSize="8.4" letterSpacing="1.4" fill="currentColor">
            <textPath href={`#ring-${id}`} textLength={272}>
              {text.repeat(Math.max(1, Math.floor(40 / text.length)))}
            </textPath>
          </text>
          <text x="60" y="58" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
            LAWFIC
          </text>
          <text x="60" y="71" textAnchor="middle" className="font-mono" fontSize="7" fill="currentColor">
            route
          </text>
        </motion.svg>
      </AnimatePresence>
    </div>
  );
}
