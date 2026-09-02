"use client";

import { motion, useReducedMotion } from "motion/react";
import { useInViewSafe, useObserverBroken } from "@/lib/use-in-view-safe";
import { useRef } from "react";

/**
 * The certificate unrolls, the details settle, and the seal lands last —
 * which is the real order of events. What it teaches is what a genuine Udyam
 * certificate carries, so a forged one is recognisable.
 */
export default function UdyamCertificate() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewSafe(ref, { once: true, amount: 0.35 });
  const reduced = useReducedMotion();
  /* No animation frames means motion cannot apply a target state, so
     start AT the target instead of animating toward it. Same reasoning as
     reduced motion: the content must exist either way. */
  const degraded = useObserverBroken();

  const show = inView || reduced === true;

  return (
    <div ref={ref} className="flex w-full justify-center">
      <motion.article
        className="relative w-[420px] max-w-full origin-top overflow-hidden rounded-lg border border-border-2 bg-gradient-to-b from-surface-2 to-surface shadow-2xl shadow-black/60"
        initial={reduced || degraded ? false : { scaleY: 0.04, opacity: 0 }}
        animate={show ? { scaleY: 1, opacity: 1 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <motion.div
          className="p-7"
          initial={reduced || degraded ? false : { opacity: 0 }}
          animate={show ? { opacity: 1 } : {}}
          transition={{ delay: reduced ? 0 : 0.55, duration: 0.5 }}
        >
          <Row delay={0.65} show={show} reduced={reduced}>
            <div className="flex items-center justify-between">
              <p className="label text-primary">Specimen certificate</p>
              <span className="label rounded-sm border border-border-3 px-1.5 py-1 text-muted">
                ILLUSTRATION
              </span>
            </div>
          </Row>

          <Row delay={0.75} show={show} reduced={reduced}>
            <h4 className="mt-4 font-display text-[22px] leading-tight tracking-[0.06em] text-foreground">
              Udyam Registration Certificate
            </h4>
          </Row>

          <Row delay={0.85} show={show} reduced={reduced}>
            <div className="mt-5 rounded border border-border bg-background/50 px-4 py-3">
              <p className="label text-muted">Udyam registration number</p>
              <p className="mt-1 font-mono text-[17px] tracking-[0.14em] text-primary-hover tnum">
                UDYAM-MH-26-0114592
              </p>
            </div>
          </Row>

          <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
            {[
              ["Enterprise", "Deshmukh Textiles"],
              ["Type", "Micro"],
              ["Major activity", "Manufacturing"],
              ["Date of incorporation", "02 / 04 / 2021"],
              ["State", "Maharashtra"],
              ["Date of registration", "26 / 08 / 2026"],
            ].map(([k, v], i) => (
              <Row key={k} delay={0.95 + i * 0.07} show={show} reduced={reduced}>
                <div>
                  <dt className="label text-muted">{k}</dt>
                  <dd className="mt-0.5 text-[13.5px] text-foreground">{v}</dd>
                </div>
              </Row>
            ))}
          </dl>

          <div className="mt-6 flex items-end justify-between border-t border-border pt-5">
            {/* QR settles into place */}
            <motion.div
              className="grid size-[74px] grid-cols-8 gap-px rounded border border-border-2 bg-background/60 p-1.5"
              initial={reduced || degraded ? false : { opacity: 0, scale: 0.7, filter: "blur(6px)" }}
              animate={show ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
              transition={{ delay: reduced ? 0 : 1.45, duration: 0.55, ease: "easeOut" }}
              aria-hidden
            >
              {Array.from({ length: 64 }).map((_, i) => {
                const on = (i * 5 + Math.floor(i / 8) * 3 + (i % 7)) % 3 !== 0;
                return <span key={i} className={on ? "bg-muted-foreground/70" : ""} />;
              })}
            </motion.div>

            {/* the seal lands last */}
            <motion.div
              className="relative grid size-[86px] place-items-center"
              initial={reduced || degraded ? false : { opacity: 0, scale: 2.4, rotate: -18 }}
              animate={show ? { opacity: 1, scale: 1, rotate: -8 } : {}}
              transition={{ delay: reduced ? 0 : 1.75, duration: 0.45, ease: [0.7, 0, 0.3, 1.2] }}
              aria-hidden
            >
              <svg viewBox="0 0 100 100" className="size-full">
                <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-primary)" strokeWidth="1.6" opacity="0.75" />
                <circle cx="50" cy="50" r="39" fill="none" stroke="var(--color-primary)" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 3" />
                <path id="sealArc" d="M50,15 a35,35 0 1,1 -0.1,0" fill="none" />
                <text fill="var(--color-primary)" fontSize="9.5" letterSpacing="2.6" fontFamily="var(--font-mono)" opacity="0.9">
                  <textPath href="#sealArc" startOffset="4%">VERIFIED FILING · LAWFIC ·</textPath>
                </text>
                <text
                  x="50"
                  y="56"
                  textAnchor="middle"
                  fill="var(--color-primary-hover)"
                  fontSize="17"
                  letterSpacing="1.5"
                  fontFamily="var(--font-display)"
                >
                  MSME
                </text>
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </motion.article>
    </div>
  );
}

function Row({
  children,
  delay,
  show,
  reduced,
}: {
  children: React.ReactNode;
  delay: number;
  show: boolean;
  reduced: boolean | null;
}) {
  const degraded = useObserverBroken();
  return (
    <motion.div
      initial={reduced || degraded ? false : { opacity: 0, y: 8 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: reduced ? 0 : delay, duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
