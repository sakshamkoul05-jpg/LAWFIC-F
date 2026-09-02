"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useInViewSafe, useObserverBroken } from "@/lib/use-in-view-safe";
import { getSpecimen, specimenNumber, type Specimen } from "@/lib/specimens";

/**
 * One animated specimen, for any document that has a spec.
 *
 * Every document on the site is depicted through this one component, which is
 * the point: the rules that must never be broken are enforced here, once,
 * rather than remembered twenty-five times.
 *
 *   - SPECIMEN is always in the header and NOT VALID is always in the corner;
 *     neither is optional and neither is passed in.
 *   - A diagonal SAMPLE watermark is always drawn across the face.
 *   - No emblem, no government logo, no official seal. The only mark is
 *     LAWFIC's own, in LAWFIC's own colours.
 *   - Anything flagged `sensitive` renders masked and is never shown in full.
 *
 * Those are legal guardrails, not styling: a convincing facsimile of a
 * government document is a forgery risk, the State Emblem is protected under
 * the Emblems and Names (Prevention of Improper Use) Act 1950, and Aadhaar in
 * particular is under active tightening. Do not add a prop that turns any of
 * them off.
 *
 * Three forms cover the catalogue. `coded` assembles an identifier and labels
 * what each run of characters means. `certificate` unrolls a certificate and
 * settles its fields. `agreement` stacks pages and signs. Each ends on one
 * true, useful sentence about the reader's own document.
 */
export default function DocumentSpecimen({ slug }: { slug: string }) {
  const spec = getSpecimen(slug);
  if (!spec) return null;
  return <SpecimenFace spec={spec} />;
}

function SpecimenFace({ spec }: { spec: Specimen }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const degraded = useObserverBroken();
  const inView = useInViewSafe(ref, { once: true, amount: 0.35 });
  const still = reduced || degraded;
  const [active, setActive] = useState(0);

  const segments = spec.segments ?? [];

  /* Flatten to characters first, each remembering which segment it belongs to.
     Masking has to work on the whole identifier, so indexing per-segment would
     mask the wrong characters. */
  const shown = specimenNumber(spec);
  const chars = segments.flatMap((seg, si) =>
    seg.chars.split("").map((ch) => ({ ch, si })),
  );
  const display = (i: number) => (spec.sensitive ? shown[i] ?? "X" : chars[i].ch);

  return (
    <div ref={ref} className="w-full">
      {/* The specimen itself */}
      <motion.div
        initial={still ? false : { opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-xl border border-border-2 bg-surface-2 p-5"
      >
        {/* Never optional: this is what keeps the illustration an illustration.
            Kept to the lower corner rather than centred — a centred watermark
            lands on the fields and makes the specimen harder to read than the
            document it depicts. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-3 bottom-4 origin-bottom-right -rotate-[24deg] select-none font-mono text-[clamp(1.6rem,5vw,2.6rem)] font-bold tracking-[0.28em] text-foreground/[0.06]"
        >
          SAMPLE
        </span>

        <div className="relative flex items-start justify-between gap-3">
          <p className="type-label text-primary">Specimen · {spec.title}</p>
          <span className="shrink-0 rounded border border-border-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            Not valid
          </span>
        </div>

        {spec.form === "coded" && (
          <div className="relative mt-5">
            <div className="flex flex-wrap gap-1">
              {chars.map(({ si }, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onMouseEnter={() => setActive(si)}
                  onFocus={() => setActive(si)}
                  onClick={() => setActive(si)}
                  aria-label={`${segments[si].label}: ${segments[si].meaning}`}
                  initial={still ? false : { opacity: 0, y: -10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: still ? 0 : 0.03 * i, duration: 0.3 }}
                  className={`grid size-8 place-items-center rounded border font-mono text-[14px] transition-colors ${
                    active === si
                      ? "border-primary bg-primary/10 text-primary-hover"
                      : "border-border-2 text-muted hover:border-border-3"
                  }`}
                >
                  {display(i)}
                </motion.button>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {segments.map((seg, i) => (
                <button
                  key={seg.label}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={`type-label transition-colors ${
                    active === i ? "text-primary" : "text-subtle hover:text-muted"
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {(spec.form === "certificate" || spec.form === "agreement") && (
          <motion.div
            initial={still ? false : { scaleY: 0.2, opacity: 0 }}
            animate={inView ? { scaleY: 1, opacity: 1 } : {}}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top" }}
            className="relative mt-5 grid gap-2.5"
          >
            {(spec.fields ?? []).map((f, i) => (
              <motion.div
                key={f.label}
                initial={still ? false : { opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: still ? 0 : 0.25 + i * 0.08, duration: 0.3 }}
                className="flex items-baseline justify-between gap-4 border-b border-border pb-1.5 last:border-b-0"
              >
                <span className="type-label text-subtle">{f.label}</span>
                <span className="text-right font-mono text-[12.5px] text-foreground">
                  {f.value}
                </span>
              </motion.div>
            ))}

            {/* LAWFIC's own mark, deliberately not a government seal. */}
            <motion.div
              initial={still ? false : { opacity: 0, scale: 1.6, rotate: -12 }}
              animate={inView ? { opacity: 1, scale: 1, rotate: -8 } : {}}
              transition={{ delay: still ? 0 : 0.6, type: "spring", stiffness: 180, damping: 14 }}
              className="mt-1 self-end rounded-full border border-primary/40 px-3 py-1"
            >
              <span className="type-label text-primary">
                {spec.form === "agreement" ? "Draft" : "Specimen"}
              </span>
            </motion.div>
          </motion.div>
        )}

        {spec.form === "coded" && spec.fields && (
          <div className="relative mt-4 flex flex-wrap gap-x-6 gap-y-1">
            {spec.fields.map((f) => (
              <span key={f.label} className="text-[11px] text-muted-foreground">
                {f.label}{" "}
                <span className="font-mono text-foreground">{f.value}</span>
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* What it teaches — the reason the specimen is on the page at all. */}
      <motion.div
        initial={still ? false : { opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: still ? 0 : 0.45, duration: 0.4 }}
        className="mt-3 rounded-xl border border-border bg-surface p-4"
      >
        {spec.form === "coded" && segments[active] && (
          <p className="type-label mb-1.5 text-primary">{segments[active].label}</p>
        )}
        <p className="text-[13px] leading-relaxed text-muted">
          {spec.form === "coded" && segments[active]
            ? segments[active].meaning
            : spec.teaches}
        </p>
        {spec.form === "coded" && (
          <p className="mt-2 border-t border-border pt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            {spec.teaches}
          </p>
        )}
      </motion.div>
    </div>
  );
}
