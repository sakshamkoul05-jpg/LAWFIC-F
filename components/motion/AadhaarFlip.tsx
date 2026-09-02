"use client";

import { motion, useReducedMotion } from "motion/react";
import { useInViewSafe, useObserverBroken } from "@/lib/use-in-view-safe";
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
  const inView = useInViewSafe(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  /* No animation frames means motion cannot apply a target state, so
     start AT the target instead of animating toward it. Same reasoning as
     reduced motion: the content must exist either way. */
  const degraded = useObserverBroken();
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
          initial={reduced || degraded ? false : { rotateY: 0, opacity: 0, y: 18 }}
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

      <p className="label text-muted">
        {flipped ? "Reverse — address & QR" : "Front — identity details"} · tap to turn
      </p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[232px] w-full overflow-hidden rounded-xl border border-border-2 bg-gradient-to-br from-surface-2 via-surface to-surface text-left shadow-2xl shadow-black/60">
      {/* brass edge light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div
        className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, var(--color-primary), transparent 65%)" }}
      />
      {/* The watermark has to be unmistakable without competing with the
          fields it sits behind. Centred at 46px it landed straight across the
          name and date of birth and made both hard to read. Rotated into the
          corner at low contrast it still reads as SAMPLE from any distance,
          and nothing on the card has to fight it. */}
      <span
        className="pointer-events-none absolute -right-4 bottom-6 origin-bottom-right -rotate-[24deg] select-none font-display text-[34px] font-bold tracking-[0.28em] text-foreground/[0.055]"
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
            <p className="label text-primary">Specimen · Identity</p>
            <p className="mt-1 font-display text-[15px] tracking-[0.14em] text-muted-foreground">
              AADHAAR SERVICES
            </p>
          </div>
          <span className="label rounded-sm border border-border-3 px-1.5 py-1 text-muted">
            NOT VALID
          </span>
        </div>

        <div className="mt-5 flex gap-4">
          {/* photo well */}
          <div className="grid h-[74px] w-[58px] shrink-0 place-items-center rounded border border-border-2 bg-background/60">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="8.5" r="3.6" stroke="var(--color-muted)" strokeWidth="1.2" />
              <path
                d="M4.8 20c.9-3.7 3.8-5.6 7.2-5.6s6.3 1.9 7.2 5.6"
                stroke="var(--color-muted)"
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

        <div className="mt-auto border-t border-border pt-3">
          <p className="label text-muted">Number</p>
          <p className="font-mono text-[19px] tracking-[0.22em] text-foreground tnum">
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
        <p className="label text-primary">Reverse</p>

        <div className="mt-4 flex gap-4">
          <div className="min-w-0 flex-1">
            <p className="label text-muted">Address</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              Flat 402, Sanskriti Residency
              <br />
              Baner Road, Pune
              <br />
              Maharashtra — 411045
            </p>
          </div>

          {/* QR stand-in — a deterministic pattern, not a scannable code */}
          <div className="grid size-[72px] shrink-0 grid-cols-7 gap-px rounded border border-border-2 bg-background/60 p-1.5">
            {Array.from({ length: 49 }).map((_, i) => {
              const on = (i * 7 + ((i % 5) * 3) + Math.floor(i / 7)) % 3 !== 0;
              return (
                <span
                  key={i}
                  className={on ? "bg-muted-foreground/70" : "bg-transparent"}
                  style={{ borderRadius: 0.5 }}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="label text-muted">Number</p>
            <p className="font-mono text-[15px] tracking-[0.2em] text-muted-foreground tnum">XXXX XXXX 1234</p>
          </div>
          <p className="label text-right text-muted">
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
      <dt className="label text-muted">{label}</dt>
      <dd className="truncate text-[13.5px] text-foreground">{value}</dd>
    </div>
  );
}
