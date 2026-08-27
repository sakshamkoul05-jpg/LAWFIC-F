"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

/**
 * The product, shown rather than described.
 *
 * The strongest signal that something is a real product rather than a brochure
 * is seeing the interface people actually use — and for LAWFIC that is the
 * signed-in side: a wallet with a statement, and a filing you can watch move.
 * A marketing site that never shows either reads as a landing page with nothing
 * behind it.
 *
 * These are faithful reproductions of the real screens, built from the same
 * tokens, not a designer's impression of them. The numbers are a worked example
 * and the tabs say so.
 */

type Tab = "wallet" | "filing";

export default function ProductShot() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<Tab>("wallet");

  return (
    <div ref={ref} className="w-full">
      {/* tab switch */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="inline-flex gap-px overflow-hidden rounded-full border border-line-2 bg-line p-px">
          {(
            [
              ["wallet", "Wallet"],
              ["filing", "A filing in progress"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
                tab === id ? "bg-brass text-ink" : "bg-ink-2 text-ash hover:text-bone"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="label hidden text-slate sm:block">Worked example</span>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={inView || reduced ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
        className="relative overflow-hidden rounded-xl border border-line-2 bg-ink-2 shadow-2xl shadow-black/60"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />

        {/* window chrome — makes it read as an application, not a graphic */}
        <div className="flex items-center gap-3 border-b border-line bg-ink/60 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            {["#3a4250", "#2c333f", "#232630"].map((c) => (
              <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />
            ))}
          </span>
          <span className="mx-auto rounded border border-line bg-surface/60 px-3 py-1 font-mono text-[11px] text-slate">
            lawfic.in/{tab === "wallet" ? "wallet" : "orders/ORD-26-0114"}
          </span>
        </div>

        <motion.div
          key={tab}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="p-5 sm:p-7"
        >
          {tab === "wallet" ? <WalletShot /> : <FilingShot />}
        </motion.div>
      </motion.div>
    </div>
  );
}

function WalletShot() {
  const rows: [string, string, boolean][] = [
    ["Top-up · UPI", "+ ₹5,000", true],
    ["GST registration — professional fee", "− ₹1,499", false],
    ["GST registration — government fee", "₹0", false],
    ["Refund — Udyam registration", "+ ₹499", true],
    ["Udyam registration — professional fee", "− ₹499", false],
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <div className="rounded-lg border border-line-2 bg-gradient-to-b from-surface-2 to-ink-2 p-5">
        <p className="label text-slate">Available balance</p>
        <p className="mt-2 font-display text-[34px] leading-none text-bone tnum">₹3,501</p>
        <div className="mt-5 flex gap-2">
          <span className="rounded-full bg-brass px-4 py-1.5 text-[12.5px] font-medium text-ink">
            Add money
          </span>
          <span className="rounded-full border border-line-2 px-4 py-1.5 text-[12.5px] text-ash">
            Statement
          </span>
        </div>
        <p className="mt-5 border-t border-line pt-4 text-[11.5px] leading-relaxed text-slate">
          Usable only for LAWFIC services. Cannot be transferred or withdrawn.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <div className="flex items-center justify-between border-b border-line bg-surface/40 px-5 py-3">
          <p className="label text-slate">Statement</p>
          <p className="label text-slate">Last 30 days</p>
        </div>
        <div className="divide-y divide-line">
          {rows.map(([label, amt, credit]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-5 py-3">
              <p className="min-w-0 truncate text-[13px] text-ash">{label}</p>
              <p className={`shrink-0 font-mono text-[12.5px] tnum ${credit ? "text-jade" : "text-bone"}`}>
                {amt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilingShot() {
  const steps = [
    ["Submitted", "done"],
    ["Quoted", "done"],
    ["Paid", "done"],
    ["In progress", "now"],
    ["Completed", "todo"],
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[11.5px] tracking-[0.08em] text-slate">ORD-26-0114</span>
          <span className="label rounded-full border border-line-3 px-2.5 py-1 text-ash">
            In progress
          </span>
        </div>
        <h4 className="mt-3 font-display text-[22px] leading-tight text-bone">GST Registration</h4>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ash">
          Filed and with the registry. We are tracking it.
        </p>

        <div className="mt-6 flex flex-col gap-px overflow-hidden rounded border border-line bg-line">
          {[
            ["Government fee", "₹0", "Free at source"],
            ["LAWFIC professional fee", "₹1,499", null],
            ["Total", "₹1,499", null],
          ].map(([k, v, note], i) => (
            <div key={k} className="flex items-baseline justify-between gap-4 bg-ink-2 px-4 py-2.5">
              <span className={`text-[12.5px] ${i === 2 ? "text-bone" : "text-ash"}`}>
                {k}
                {note && <span className="ml-2 text-[11px] text-slate">{note}</span>}
              </span>
              <span className={`shrink-0 font-mono text-[12.5px] tnum ${i === 2 ? "text-brass" : "text-bone"}`}>
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="label mb-4 text-slate">Progress</p>
        <ol className="flex flex-col">
          {steps.map(([label, state], i) => (
            <li
              key={label}
              className={`relative grid gap-1 pb-5 pl-6 last:pb-0 ${
                i === steps.length - 1 ? "" : "border-l"
              } ${state === "todo" ? "border-line" : "border-brass-dim"}`}
              style={{ marginLeft: 3 }}
            >
              <span
                className="absolute left-0 top-1 size-2.5 -translate-x-1/2 rounded-full border-2"
                style={{
                  background: state === "now" ? "var(--color-brass)" : "var(--color-ink)",
                  borderColor: state === "todo" ? "var(--color-line-3)" : "var(--color-brass)",
                }}
                aria-hidden
              />
              <p
                className={`text-[13.5px] ${
                  state === "now" ? "text-bone" : state === "done" ? "text-ash" : "text-slate"
                }`}
              >
                {label}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
