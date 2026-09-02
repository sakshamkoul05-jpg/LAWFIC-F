"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

/**
 * The action row: circular buttons with the label sitting underneath, the
 * shape the reference uses. Four of them, so the row fills its width evenly.
 *
 * There is no Transfer and no Withdraw, and there should never be. This is a
 * closed-loop prepaid balance that never pays out — no withdrawal to a bank,
 * no user-to-user transfer, no third-party spend — and that is the entire
 * basis of the closed-system PPI exemption the business operates under.
 * Showing a payout as "coming soon" is a claim about what the product will
 * do, not a placeholder. The fourth slot goes to Help instead.
 */

type Action = { label: string; href: string; icon: React.ReactNode };

const ACTIONS: Action[] = [
  {
    label: "Add money",
    href: "/wallet/topup",
    icon: <path d="M10 4v12M4 10h12" />,
  },
  {
    label: "Statement",
    href: "/wallet/transactions",
    icon: <path d="M5 6h10M5 10h10M5 14h6" />,
  },
  {
    label: "Your filings",
    href: "/orders",
    icon: <path d="M5 4h7l3 3v9H5zM12 4v3h3" />,
  },
  {
    label: "Help",
    href: "/contact",
    icon: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="M8.2 8a1.9 1.9 0 1 1 2.4 2.2c-.5.2-.6.5-.6 1M10 14.2v.2" />
      </>
    ),
  },
];

export default function WalletActions() {
  const reduced = useReducedMotion();

  return (
    <nav aria-label="Wallet actions" className="mt-7 grid grid-cols-4 gap-2">
      {ACTIONS.map((a, i) => (
        <motion.div
          key={a.label}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + i * 0.07, type: "spring", stiffness: 240, damping: 24 }}
        >
          <Link
            href={a.href}
            className="group flex flex-col items-center gap-2.5 rounded-2xl py-2 text-center"
            style={{ color: "var(--wallet-fg)" }}
          >
            <span
              className="grid size-[52px] place-items-center rounded-full transition-transform duration-200 group-hover:-translate-y-0.5"
              style={{
                background: "var(--wallet-btn-bg)",
                color: "var(--wallet-icon-fg)",
                boxShadow: "var(--wallet-glass-shadow)",
              }}
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {a.icon}
              </svg>
            </span>
            <span className="text-[11.5px] font-medium leading-tight">{a.label}</span>
          </Link>
        </motion.div>
      ))}
    </nav>
  );
}
