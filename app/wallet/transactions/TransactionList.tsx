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
    <div className="glass-panel overflow-hidden rounded-2xl" style={{ color: "var(--wallet-fg)" }}>
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--wallet-divider)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
          Statement
        </p>
        <p className="text-[12px] opacity-40">
          {rows.length === 0 ? "No entries yet" : `${rows.length} entries`}
        </p>
      </div>

      <div className="flex gap-1 border-b px-5 py-3" style={{ borderColor: "var(--wallet-divider)" }}>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-200"
            style={{
              background: filter === f.key ? "#5856d6" : "var(--wallet-btn-bg)",
              color: filter === f.key ? "#ffffff" : "var(--wallet-fg-muted)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-[14px] opacity-50">
            {rows.length === 0 ? "Nothing here yet." : "No entries in this view."}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed opacity-30">
            Add money and every credit and debit will appear here.
          </p>
        </div>
      ) : (
        <ul style={{ borderColor: "var(--wallet-divider)" }} className="divide-y">
          <AnimatePresence initial={false}>
            {filtered.map((r, i) => (
              <motion.li
                key={r.id}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4), ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/wallet/transactions/${r.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150"
                  style={{ color: "var(--wallet-fg)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{r.reason}</p>
                    <p className="mt-0.5 font-mono text-[11px] opacity-35">
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
                    className={`shrink-0 font-mono text-[13px] tabular-nums ${
                      r.direction === "credit" ? "text-[#34c759]" : ""
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
