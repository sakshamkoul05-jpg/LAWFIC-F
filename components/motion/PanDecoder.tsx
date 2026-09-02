"use client";

import { motion, useReducedMotion } from "motion/react";
import { useInViewSafe, useObserverBroken } from "@/lib/use-in-view-safe";
import { useEffect, useRef, useState } from "react";

const PAN = "AAPFU0939F";

const parts = [
  {
    from: 0,
    to: 3,
    title: "Series",
    body: "Three letters from a running alphabetic series. They carry no information about you — they are simply where the department had reached.",
  },
  {
    from: 3,
    to: 4,
    title: "Holder type — the fourth character",
    body: "P is an individual, C a company, F a firm, H a Hindu Undivided Family, T a trust. This one letter tells you what kind of taxpayer the PAN belongs to.",
  },
  {
    from: 4,
    to: 5,
    title: "Surname initial — the fifth character",
    body: "The first letter of the holder's surname, or of the entity's name. Check yours: if the fifth character does not match your surname, your PAN carries a spelling your bank will eventually query.",
  },
  {
    from: 5,
    to: 9,
    title: "Sequence",
    body: "Four digits, 0001 to 9999, running within the series above.",
  },
  {
    from: 9,
    to: 10,
    title: "Check letter",
    body: "A checksum character derived from the other nine. It is what makes a mistyped PAN fail validation before it ever reaches a database.",
  },
];

export default function PanDecoder() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewSafe(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  /* No animation frames means motion cannot apply a target state, so
     start AT the target instead of animating toward it. Same reasoning as
     reduced motion: the content must exist either way. */
  const degraded = useObserverBroken();
  const [active, setActive] = useState(1);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!inView || reduced || !auto) return;
    const t = setInterval(() => setActive((a) => (a + 1) % parts.length), 2600);
    return () => clearInterval(t);
  }, [inView, reduced, auto]);

  const current = parts[active];

  return (
    <div ref={ref} className="flex w-full flex-col items-center gap-7">
      {/* specimen card */}
      <motion.div
        className="relative w-[335px] max-w-full overflow-hidden rounded-xl border border-border-2 bg-gradient-to-br from-surface-2 via-surface to-surface p-5 shadow-2xl shadow-black/60"
        initial={reduced || degraded ? false : { opacity: 0, y: 20, rotateX: 12 }}
        animate={inView || reduced ? { opacity: 1, y: 0, rotateX: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
        style={{ perspective: 800 }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <span
          className="pointer-events-none absolute inset-0 grid place-items-center font-display text-[42px] tracking-[0.3em] text-foreground/[0.045] select-none"
          aria-hidden
        >
          SAMPLE
        </span>

        <div className="relative z-2">
          <div className="flex items-start justify-between">
            <p className="label text-primary">Specimen · Permanent Account Number</p>
            <span className="label rounded-sm border border-border-3 px-1.5 py-1 text-muted">
              NOT VALID
            </span>
          </div>

          <p className="mt-6 font-mono text-[25px] tracking-[0.16em] text-foreground tnum">
            {PAN.split("").map((ch, i) => {
              const on = i >= current.from && i < current.to;
              return (
                <span
                  key={i}
                  className="transition-colors duration-500"
                  style={{ color: on ? "var(--color-primary-hover)" : undefined }}
                >
                  {ch}
                </span>
              );
            })}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <dt className="label text-muted">Name</dt>
              <dd className="text-[13.5px] text-foreground">Anjali R. Deshmukh</dd>
            </div>
            <div>
              <dt className="label text-muted">Date of birth</dt>
              <dd className="text-[13.5px] text-foreground tnum">14 / 08 / 1994</dd>
            </div>
          </dl>
        </div>
      </motion.div>

      {/* character rail */}
      <div className="flex w-full justify-center overflow-x-auto pb-1">
        <div className="flex w-max gap-1.5 px-1">
          {PAN.split("").map((ch, i) => {
            const pi = parts.findIndex((p) => i >= p.from && i < p.to);
            const on = pi === active;
            return (
              <motion.button
                key={i}
                type="button"
                onMouseEnter={() => { setAuto(false); setActive(pi); }}
                onFocus={() => { setAuto(false); setActive(pi); }}
                onClick={() => { setAuto(false); setActive(pi); }}
                aria-label={`${parts[pi].title}, character ${i + 1}`}
                className={`grid size-10 place-items-center rounded border font-mono text-[16px] transition-colors duration-300 ${
                  on
                    ? "border-primary bg-primary/12 text-primary-hover"
                    : "border-border-2 bg-surface/70 text-muted-foreground hover:border-border-3"
                }`}
                initial={reduced || degraded ? false : { opacity: 0, scale: 0.8 }}
                animate={inView || reduced ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.35, delay: reduced ? 0 : 0.5 + i * 0.05 }}
              >
                {ch}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[104px] w-full max-w-lg rounded border border-border bg-surface/45 p-5">
        <motion.div key={active} initial={reduced || degraded ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <p className="label mb-2 text-primary">{current.title}</p>
          <p className="text-[14.5px] leading-relaxed text-muted-foreground">{current.body}</p>
        </motion.div>
      </div>
    </div>
  );
}
