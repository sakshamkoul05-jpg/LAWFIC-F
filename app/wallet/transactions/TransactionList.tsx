"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatEntry } from "@/lib/money";
import type { WalletEntry } from "@/lib/wallet-entries";

type Filter = "all" | "credit" | "debit";

export default function TransactionList({ rows }: { rows: WalletEntry[] }) {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.direction === filter)),
    [rows, filter]
  );

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "credit", label: "Credits" },
    { key: "debit", label: "Debits" },
  ];

  return (
    <div className="glass-panel overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
          Statement
        </p>
        <p className="text-[12px] text-[#f4f4ee]/45">
          {rows.length === 0 ? "No entries yet" : `${rows.length} entries`}
        </p>
      </div>

      <div className="flex gap-1.5 border-b border-white/10 px-5 py-3">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
              filter === f.key
                ? "bg-[#d4af37] text-[#0b0b0b]"
                : "text-[#f4f4ee]/55 hover:bg-white/5 hover:text-[#f4f4ee]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-[14.5px] text-[#f4f4ee]/65">
            {rows.length === 0 ? "Nothing here yet." : "No entries in this view."}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-[#f4f4ee]/45">
            Add money and every credit and debit will be listed here, each opening into its own
            detail.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/10">
          <AnimatePresence initial={false}>
            {filtered.map((r, i) => (
              <motion.li
                key={r.id}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.5), ease: [0.2, 0.7, 0.3, 1] }}
              >
                <Link
                  href={`/wallet/transactions/${r.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-[#f4f4ee]">{r.reason}</p>
                    <p className="mt-1 font-mono text-[11px] tracking-[0.04em] text-[#f4f4ee]/40">
                      {new Date(r.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-mono text-[14px] tabular-nums ${
                      r.direction === "credit" ? "text-[#7fc98e]" : "text-[#f4f4ee]"
                    }`}
                  >
                    {formatEntry(r.direction, r.amount_paise)}
                  </p>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
