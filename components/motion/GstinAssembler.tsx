"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

const GSTIN = "27AAPFU0939F1ZV";

type Segment = {
  from: number;
  to: number;
  label: string;
  title: string;
  body: string;
};

/** Where the fifteen characters actually come from. */
const segments: Segment[] = [
  {
    from: 0,
    to: 2,
    label: "State",
    title: "State code",
    body: "27 is Maharashtra. It is the census state code, which is why a business registered in two states holds two GSTINs against one PAN.",
  },
  {
    from: 2,
    to: 12,
    label: "PAN",
    title: "Your PAN, unchanged",
    body: "The middle ten characters are the entity's PAN, character for character. This is why a GST application fails the moment the PAN name does not match.",
  },
  {
    from: 12,
    to: 13,
    label: "Entity",
    title: "Registration number",
    body: "How many registrations this PAN holds in this state. A first registration is 1; a second business vertical would be 2.",
  },
  {
    from: 13,
    to: 14,
    label: "Default",
    title: "Always Z",
    body: "A fixed character, reserved by design. If you are looking at a GSTIN with anything else in position fourteen, look again.",
  },
  {
    from: 14,
    to: 15,
    label: "Check",
    title: "Checksum",
    body: "Computed from the first fourteen characters. It is what lets a portal reject a mistyped GSTIN instantly, without a lookup.",
  },
];

export default function GstinAssembler() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const [active, setActive] = useState(1);

  const current = segments[active];

  return (
    <div ref={ref} className="w-full">
      {/* the number */}
      <div className="overflow-x-auto pb-1">
        <div className="mx-auto flex w-max gap-1.5 px-1">
          {GSTIN.split("").map((ch, i) => {
            const seg = segments.findIndex((s) => i >= s.from && i < s.to);
            const isActive = seg === active;
            return (
              <motion.button
                key={i}
                type="button"
                onMouseEnter={() => setActive(seg)}
                onFocus={() => setActive(seg)}
                onClick={() => setActive(seg)}
                aria-label={`${segments[seg].title}, character ${i + 1}`}
                className={`grid size-9 place-items-center rounded border font-mono text-[15px] transition-colors duration-300 sm:size-11 sm:text-[17px] ${
                  isActive
                    ? "border-brass bg-brass/12 text-brass-hi"
                    : "border-line-2 bg-surface/70 text-ash hover:border-line-3"
                }`}
                initial={reduced ? false : { opacity: 0, y: -14, rotateX: -60 }}
                animate={inView || reduced ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{
                  duration: 0.4,
                  delay: reduced ? 0 : 0.35 + i * 0.055,
                  ease: [0.2, 0.7, 0.3, 1],
                }}
              >
                {ch}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* segment rail */}
      <motion.div
        className="mt-2 overflow-x-auto"
        initial={reduced ? false : { opacity: 0 }}
        animate={inView || reduced ? { opacity: 1 } : {}}
        transition={{ delay: reduced ? 0 : 1.3, duration: 0.5 }}
      >
        <div className="mx-auto flex w-max gap-1.5 px-1">
          {segments.map((s, i) => {
            const span = s.to - s.from;
            const isActive = i === active;
            return (
              <button
                key={s.label}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="group flex flex-col items-center gap-1.5"
                style={{ width: `calc(${span} * (var(--tile) + 0.375rem) - 0.375rem)` }}
              >
                <span
                  className={`h-px w-full transition-colors duration-300 ${
                    isActive ? "bg-brass" : "bg-line-2 group-hover:bg-line-3"
                  }`}
                />
                <span
                  className={`label whitespace-nowrap transition-colors duration-300 ${
                    isActive ? "text-brass" : "text-slate"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* explanation */}
      <motion.div
        className="mx-auto mt-7 min-h-[112px] max-w-lg rounded border border-line bg-surface/45 p-5"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={inView || reduced ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: reduced ? 0 : 1.45, duration: 0.5 }}
      >
        <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <p className="label mb-2 text-brass">{current.title}</p>
          <p className="text-[14.5px] leading-relaxed text-ash">{current.body}</p>
        </motion.div>
      </motion.div>

      <style>{`
        :root { --tile: 2.25rem; }
        @media (min-width: 640px) { :root { --tile: 2.75rem; } }
      `}</style>
    </div>
  );
}
