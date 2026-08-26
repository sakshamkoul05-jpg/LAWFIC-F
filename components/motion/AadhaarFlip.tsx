"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * A specimen card, not a reproduction.
 *
 * Rule 2 of the build plan: no Government of India emblem, no UIDAI logo, no
 * usable number format. LAWFIC's own palette, masked digits, and a SAMPLE
 * watermark that is part of the artwork rather than an overlay that could be
 * cropped off. What the animation teaches is which side carries which detail.
 */
export default function AadhaarFlip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!inView || reduced) return;
    const t = setTimeout(() => setFlipped(true), 1100);
    const t2 = setTimeout(() => setFlipped(false), 3400);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [inView, reduced]);

  if (reduced) {
    return (
      <div ref={ref} className="grid gap-4 sm:grid-cols-2">
        <CardFront />
        <CardBack />
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col items-center gap-5">
      <div className="[perspective:1600px]">
        <motion.button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          aria-label={flipped ? "Show front of specimen card" : "Show back of specimen card"}
          className="relative block w-[335px] max-w-full cursor-pointer rounded-xl"
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: 0, opacity: 0, y: 18 }}
          animate={
            inView
              ? { rotateY: flipped ? 180 : 0, opacity: 1, y: 0 }
              : { rotateY: 0, opacity: 0, y: 18 }
          }
          transition={{
            rotateY: { duration: 0.85, ease: [0.65, 0, 0.35, 1] },
            opacity: { duration: 0.5 },
            y: { duration: 0.6, ease: "easeOut" },
          }}
        >
          <div style={{ backfaceVisibility: "hidden" }}>
            <CardFront />
          </div>
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <CardBack />
          </div>
        </motion.button>
      </div>

      <p className="label text-slate">
        {flipped ? "Reverse — address & QR" : "Front — identity details"} · tap to turn
      </p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[211px] w-full overflow-hidden rounded-xl border border-line-2 bg-gradient-to-br from-surface-2 via-surface to-ink-2 text-left shadow-2xl shadow-black/60">
      {/* brass edge light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
      <div
        className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, var(--color-brass), transparent 65%)" }}
      />
      <span
        className="pointer-events-none absolute inset-0 grid place-items-center font-display text-[46px] tracking-[0.3em] text-bone/[0.045] select-none"
        aria-hidden
      >
        SAMPLE
      </span>
      {children}
    </div>
  );
}

function CardFront() {
  return (
    <Shell>
      <div className="relative z-2 flex h-full flex-col p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="label text-brass">Specimen · Identity</p>
            <p className="mt-1 font-display text-[15px] tracking-[0.14em] text-ash">
              AADHAAR SERVICES
            </p>
          </div>
          <span className="label rounded-sm border border-line-3 px-1.5 py-1 text-slate">
            NOT VALID
          </span>
        </div>

        <div className="mt-5 flex gap-4">
          {/* photo well */}
          <div className="grid h-[74px] w-[58px] shrink-0 place-items-center rounded border border-line-2 bg-ink/60">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="8.5" r="3.6" stroke="var(--color-slate)" strokeWidth="1.2" />
              <path
                d="M4.8 20c.9-3.7 3.8-5.6 7.2-5.6s6.3 1.9 7.2 5.6"
                stroke="var(--color-slate)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <dl className="min-w-0 flex-1 space-y-2">
            <Field label="Name" value="Anjali R. Deshmukh" />
            <Field label="Date of birth" value="14 / 08 / 1994" />
            <Field label="Gender" value="Female" />
          </dl>
        </div>

        <div className="mt-auto border-t border-line pt-3">
          <p className="label text-slate">Number</p>
          <p className="font-mono text-[19px] tracking-[0.22em] text-bone tnum">
            XXXX XXXX 1234
          </p>
        </div>
      </div>
    </Shell>
  );
}

function CardBack() {
  return (
    <Shell>
      <div className="relative z-2 flex h-full flex-col p-5">
        <p className="label text-brass">Reverse</p>

        <div className="mt-4 flex gap-4">
          <div className="min-w-0 flex-1">
            <p className="label text-slate">Address</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ash">
              Flat 402, Sanskriti Residency
              <br />
              Baner Road, Pune
              <br />
              Maharashtra — 411045
            </p>
          </div>

          {/* QR stand-in — a deterministic pattern, not a scannable code */}
          <div className="grid size-[72px] shrink-0 grid-cols-7 gap-px rounded border border-line-2 bg-ink/60 p-1.5">
            {Array.from({ length: 49 }).map((_, i) => {
              const on = (i * 7 + ((i % 5) * 3) + Math.floor(i / 7)) % 3 !== 0;
              return (
                <span
                  key={i}
                  className={on ? "bg-ash/70" : "bg-transparent"}
                  style={{ borderRadius: 0.5 }}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-line pt-3">
          <div>
            <p className="label text-slate">Number</p>
            <p className="font-mono text-[15px] tracking-[0.2em] text-ash tnum">XXXX XXXX 1234</p>
          </div>
          <p className="label text-right text-slate">
            Illustration only
            <br />
            LAWFIC specimen
          </p>
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label text-slate">{label}</dt>
      <dd className="truncate text-[13.5px] text-bone">{value}</dd>
    </div>
  );
}
