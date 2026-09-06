"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

/**
 * The action grid, in CRED's language: tiles, not icon buttons.
 *
 * A row of circles under a balance is the standard banking-app pattern and it
 * reads as a toolbar. CRED's version is a grid of large slabs where the icon
 * sits top-left, the label bottom-left, and the tile itself is the target —
 * which gives every action a generous hit area and lets the grid carry the
 * page's rhythm rather than fighting it.
 *
 * WHAT IS NOT HERE, AND WILL NOT BE
 *
 * No Send, no Transfer, no Withdraw. This is a closed-loop prepaid balance:
 * money comes in, and it is spent on LAWFIC services. It never pays out to a
 * person, a bank or a third party, and that is precisely what keeps it inside
 * the closed-system PPI exemption rather than needing RBI authorisation as a
 * semi-closed instrument. A greyed-out "Send money — coming soon" tile is not a
 * placeholder; it is a promise about a product we are not permitted to build.
 */

type Tile = {
  label: string;
  hint: string;
  href: string;
  icon: React.ReactNode;
  primary?: boolean;
};

const TILES: Tile[] = [
  {
    label: "Add money",
    hint: "UPI, card, netbanking",
    href: "/wallet/topup",
    icon: <path d="M10 4.5v11M4.5 10h11" />,
    primary: true,
  },
  {
    label: "Statement",
    hint: "Every credit and debit",
    href: "/wallet/transactions",
    icon: <path d="M5 5.5h10M5 10h10M5 14.5h6" />,
  },
  {
    label: "Your filings",
    hint: "What the balance paid for",
    href: "/orders",
    icon: <path d="M5.5 3.8h6.2l2.8 2.8v9.6H5.5zM11.7 3.8v2.8h2.8" />,
  },
  {
    label: "Customise",
    hint: "Material, colour, engraving",
    href: "/wallet/customize",
    icon: (
      <>
        <circle cx="10" cy="10" r="2.4" />
        <path d="M10 3.4v1.8M10 14.8v1.8M16.6 10h-1.8M5.2 10H3.4M14.7 5.3l-1.3 1.3M6.6 13.4l-1.3 1.3M14.7 14.7l-1.3-1.3M6.6 6.6L5.3 5.3" />
      </>
    ),
  },
];

export default function WalletQuickActions() {
  const reduced = useReducedMotion();

  return (
    <nav aria-label="Wallet actions" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TILES.map((t, i) => (
        <motion.div
          key={t.label}
          initial={reduced ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 26 }}
        >
          <Link
            href={t.href}
            className="cred-slab cred-tile flex h-full flex-col justify-between gap-8 p-4 sm:p-5"
            style={{ color: "var(--wallet-fg)" }}
          >
            <span
              className="grid size-10 place-items-center rounded-full"
              style={{
                background: t.primary ? "var(--brand)" : "var(--wallet-icon-circle)",
                color: t.primary ? "var(--color-background)" : "var(--wallet-icon-fg)",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {t.icon}
              </svg>
            </span>
            <span>
              <span className="block text-[13.5px] font-medium leading-tight">{t.label}</span>
              <span
                className="mt-1 block text-[11.5px] leading-snug"
                style={{ color: "var(--wallet-fg-muted)" }}
              >
                {t.hint}
              </span>
            </span>
          </Link>
        </motion.div>
      ))}
    </nav>
  );
}
