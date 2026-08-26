"use client";

import { motion } from "motion/react";
import { useState } from "react";

const presets = [500, 1000, 2000, 5000];

/** Front-end only. Razorpay order creation and the signed webhook land in Phase 3. */
export default function TopUp() {
  const [amount, setAmount] = useState(2000);

  return (
    <div className="overflow-hidden rounded-xl border border-line-2 bg-gradient-to-b from-surface-2 to-ink-2 shadow-2xl shadow-black/60">
      <div className="border-b border-line px-6 py-6">
        <p className="label text-slate">Available balance</p>
        <motion.p
          key={amount}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="mt-2 font-display text-[42px] leading-none text-bone tnum"
        >
          ₹2,000
        </motion.p>
      </div>

      <div className="p-6">
        <p className="label mb-3 text-slate">Add money</p>

        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={`rounded border py-3 font-mono text-[14px] transition-colors tnum ${
                amount === p
                  ? "border-brass bg-brass/12 text-brass-hi"
                  : "border-line-2 bg-ink/50 text-ash hover:border-line-3"
              }`}
            >
              ₹{p.toLocaleString("en-IN")}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="mt-5 w-full rounded-full bg-brass py-3.5 text-sm font-medium text-ink transition-colors hover:bg-brass-hi"
        >
          Add ₹{amount.toLocaleString("en-IN")}
        </button>

        <div className="mt-5 flex items-center justify-center gap-3">
          {["UPI", "Card", "Net banking"].map((m) => (
            <span key={m} className="label text-slate">
              {m}
            </span>
          ))}
        </div>
      </div>

      <p className="border-t border-line bg-ink/40 px-6 py-3.5 text-[11.5px] text-slate">
        Preview build — no payment is taken.
      </p>
    </div>
  );
}
