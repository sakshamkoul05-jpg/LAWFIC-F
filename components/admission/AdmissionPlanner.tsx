"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { STREAMS, docsFor, nextSessionYear, plan, type CategoryId, type StreamId } from "@/lib/admission";

/**
 * The admission planner.
 *
 * Pick a stream and the four names become the page's headline — the chosen one
 * lit, the rest receding. Pick a category and the certificates you need are
 * dealt onto a timeline that runs backwards from counselling, each bar ending
 * where it must be in hand and starting on the date to apply. Certificates that
 * only count if issued after 1 April show that wall on the timeline.
 */

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "ews", label: "EWS" },
  { id: "obc", label: "OBC (non-creamy layer)" },
  { id: "scst", label: "SC / ST" },
];

const DAY = 86_400_000;
const fmt = (d: Date, withYear = false) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });

function todayUTC(): Date {
  const ist = new Date(Date.now() + 330 * 60_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

export default function AdmissionPlanner() {
  const reduced = !!useReducedMotion();
  const [stream, setStream] = useState<StreamId>("engineering");
  const [category, setCategory] = useState<CategoryId>("obc");
  const [stateQuota, setStateQuota] = useState(true);
  const [gapYear, setGapYear] = useState(false);
  const [scholarship, setScholarship] = useState(false);
  const [dobMismatch, setDobMismatch] = useState(false);

  /* Arriving at /admission#medical from the menu opens on that stream. */
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "");
      if (STREAMS.some((s) => s.id === h)) setStream(h as StreamId);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const s = STREAMS.find((x) => x.id === stream)!;
  const today = todayUTC();
  const year = nextSessionYear(s, today);
  const docs = docsFor(category, { stateQuota, gapYear, scholarship, dobMismatch });
  const { needBy, items } = plan(s, year, docs);

  /* The axis: from a little before the earliest start (or today) to just after need-by. */
  const axis = useMemo(() => {
    const starts = items.map((i) => Math.min(i.startBy.getTime(), i.opensOn?.getTime() ?? Infinity));
    const from = Math.min(needBy.getTime() - 60 * DAY, ...starts) - 10 * DAY;
    const to = needBy.getTime() + 8 * DAY;
    const pct = (t: number) => ((t - from) / (to - from)) * 100;
    const months: { label: string; at: number }[] = [];
    const d = new Date(from);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + 1);
    while (d.getTime() < to) {
      months.push({ label: d.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }), at: pct(d.getTime()) });
      d.setUTCMonth(d.getUTCMonth() + 1);
    }
    return { from, to, pct, months };
  }, [items, needBy]);

  const todayPct = axis.pct(today.getTime());
  const april = items.find((i) => i.opensOn)?.opensOn;
  const late = items.filter((i) => i.startBy < today);

  return (
    <div>
      {/* stream: the four names are the headline */}
      <div role="radiogroup" aria-label="Your stream" className="flex flex-wrap gap-x-6 gap-y-1">
        {STREAMS.map((x) => {
          const on = x.id === stream;
          return (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setStream(x.id);
                history.replaceState(null, "", `#${x.id}`);
              }}
              className={`text-left text-[clamp(2rem,6.4vw,4.6rem)] font-bold leading-[1.04] tracking-[-0.045em] transition-[color,opacity] duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
                on ? "text-foreground" : "text-foreground/20 hover:text-foreground/45"
              }`}
            >
              {x.name.replace(" (MBA)", "")}
              {on && <motion.span layoutId="stream-dot" className="ml-1 inline-block size-[0.18em] rounded-full bg-primary align-baseline" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={s.id}
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0 }}
          className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted"
        >
          {s.blurb} {s.exams.map((e) => `${e.name}: ${e.when}`).join("; ")}. {s.counselling} — so for the {year} session, have
          your certificates in hand by <span className="text-foreground">{fmt(needBy, true)}</span>.
        </motion.p>
      </AnimatePresence>

      {/* category and situation */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-12">
        <fieldset>
          <legend className="text-[13px] text-muted">Category</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = c.id === category;
              return (
                <label
                  key={c.id}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-[13.5px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50 ${
                    on ? "border-primary bg-primary text-background" : "border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  <input type="radio" name="category" className="sr-only" checked={on} onChange={() => setCategory(c.id)} />
                  {c.label}
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-[13px] text-muted">Also</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { v: stateQuota, set: setStateQuota, label: "Applying for state-quota seats" },
              { v: scholarship, set: setScholarship, label: "Applying for a scholarship or fee waiver" },
              { v: gapYear, set: setGapYear, label: "A gap year after school" },
              { v: dobMismatch, set: setDobMismatch, label: "Date of birth differs between records" },
            ].map((o) => (
              <label
                key={o.label}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50 ${
                  o.v ? "border-accent bg-accent-light text-foreground" : "border-border text-muted hover:text-foreground"
                }`}
              >
                <input type="checkbox" className="sr-only" checked={o.v} onChange={(e) => o.set(e.target.checked)} />
                <span className={`size-3 rounded-[4px] border ${o.v ? "border-accent bg-accent" : "border-border"}`} aria-hidden />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* the timeline */}
      <div className="mt-10 rounded-[28px] border border-border bg-surface p-5 sm:p-8">
        {items.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted">
            Nothing extra to prepare — your school certificates and marksheets will do. Tick anything above that applies to you.
          </p>
        ) : (
          <>
            <div className="relative h-6 text-[11px] text-subtle" aria-hidden>
              {axis.months.map((m) => (
                <span key={m.label + m.at} className="absolute -translate-x-1/2" style={{ left: `${m.at}%` }}>
                  {m.label}
                </span>
              ))}
            </div>

            <div className="relative mt-2">
              {/* month gridlines */}
              {axis.months.map((m) => (
                <span key={`g${m.at}`} className="absolute inset-y-0 w-px bg-border" style={{ left: `${m.at}%` }} aria-hidden />
              ))}
              {/* the 1 April wall */}
              {april && (
                <span
                  className="absolute inset-y-0 left-0 bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--color-destructive-light)_6px_12px)]"
                  style={{ width: `${Math.max(0, axis.pct(april.getTime()))}%` }}
                  aria-hidden
                />
              )}
              {/* today */}
              {todayPct > 0 && todayPct < 100 && (
                <span className="absolute inset-y-0 z-10 w-0.5 bg-foreground/70" style={{ left: `${todayPct}%` }} aria-hidden>
                  <span className="absolute -top-5 -translate-x-1/2 text-[10.5px] text-foreground">today</span>
                </span>
              )}
              {/* need-by */}
              <span className="absolute inset-y-0 z-10 w-0.5 bg-primary" style={{ left: `${axis.pct(needBy.getTime())}%` }} aria-hidden />

              <LayoutGroup>
                <ul className="relative grid gap-3 py-3">
                  <AnimatePresence initial={false}>
                    {items.map((it, i) => {
                      const left = axis.pct(it.startBy.getTime());
                      const workEnd = axis.pct(it.startBy.getTime() + it.leadDays * DAY);
                      const end = axis.pct(needBy.getTime());
                      return (
                        <motion.li
                          key={it.id}
                          layout
                          initial={reduced ? false : { opacity: 0, x: 80, rotate: 3 }}
                          animate={{ opacity: 1, x: 0, rotate: 0 }}
                          exit={reduced ? undefined : { opacity: 0, x: -40, transition: { duration: 0.2 } }}
                          transition={{ type: "spring", stiffness: 260, damping: 26, delay: reduced ? 0 : i * 0.07 }}
                          className="relative h-[58px]"
                        >
                          <motion.div
                            layout
                            className="absolute inset-y-0 flex overflow-hidden rounded-2xl"
                            style={{ left: `${left}%`, width: `${Math.max(end - left, 4)}%` }}
                          >
                            <span className="h-full bg-primary/85" style={{ width: `${((workEnd - left) / Math.max(end - left, 0.001)) * 100}%` }} />
                            <span className="h-full flex-1 bg-[repeating-linear-gradient(90deg,var(--color-primary-light)_0_4px,transparent_4px_8px)]" />
                          </motion.div>
                          {/* The name sits in the empty time before the bar when there is room,
                              and rides on the bar when the bar starts near the left edge. */}
                          <div
                            className={`absolute inset-y-0 flex items-center ${left > 38 ? "justify-end" : ""}`}
                            style={left > 38 ? { left: 0, right: `calc(${100 - left}% + 10px)` } : { left: `calc(${left}% + 10px)`, right: 0 }}
                          >
                            <div className="max-w-full rounded-xl bg-surface/95 px-3 py-1.5 shadow-sm ring-1 ring-border backdrop-blur">
                              {it.href ? (
                                <Link href={it.href} className="block truncate text-[13.5px] font-medium text-foreground hover:text-primary">
                                  {it.name}
                                </Link>
                              ) : (
                                <p className="truncate text-[13.5px] font-medium text-foreground">{it.name}</p>
                              )}
                              <p className={`truncate text-[11.5px] ${it.startBy < today ? "text-destructive" : "text-muted"}`}>
                                {it.startBy < today ? "Start now" : `Start by ${fmt(it.startBy)}`}
                                {it.opensOn ? ` — not before ${fmt(it.opensOn)}` : ""}
                                {it.lasts ? ` — ${it.lasts.toLowerCase()}` : ""}
                              </p>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </LayoutGroup>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-muted">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded bg-primary/85" aria-hidden /> Getting it issued
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded bg-[repeating-linear-gradient(90deg,var(--color-primary-light)_0_4px,transparent_4px_8px)] ring-1 ring-primary/30" aria-hidden />
                Spare days, in case something needs correcting
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-0.5 bg-primary" aria-hidden /> Needed by {fmt(needBy, true)}
              </span>
              {april && (
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-6 rounded bg-[repeating-linear-gradient(135deg,transparent_0_3px,var(--color-destructive-light)_3px_6px)] ring-1 ring-destructive/30" aria-hidden />
                  Issued before 1 April, it will not count
                </span>
              )}
            </div>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {items.map((it) => (
                <li key={it.id} className="text-[13.5px] leading-relaxed text-muted">
                  <span className="text-foreground">{it.name}.</span> {it.why}
                </li>
              ))}
            </ul>
            {late.length > 0 && (
              <p className="mt-6 rounded-2xl bg-destructive-light px-4 py-3 text-[13px] text-destructive">
                {late.length === 1 ? "One certificate is" : `${late.length} certificates are`} already past the comfortable start date. Start today — we
                can still usually make it.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
