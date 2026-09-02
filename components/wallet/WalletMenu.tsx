"use client";

import Link from "next/link";

/**
 * The settings rows beneath the wallet — the grouped list the reference puts
 * under its action row. Real destinations only; every row here goes to a page
 * that exists.
 */

const ROWS: Array<{ label: string; href: string; icon: React.ReactNode }> = [
  {
    label: "Help & support",
    href: "/contact",
    icon: (
      <>
        <circle cx="10" cy="10" r="7.2" />
        <path d="M8.2 8a1.9 1.9 0 1 1 2.4 2.2c-.5.2-.6.5-.6 1M10 14.2v.2" />
      </>
    ),
  },
  {
    label: "Wallet terms",
    href: "/legal/wallet-terms",
    icon: <path d="M5 3.5h7l3 3v10H5zM12 3.5v3h3M7.5 10h5M7.5 13h3" />,
  },
  {
    label: "Refunds & cancellation",
    href: "/legal/refunds",
    icon: <path d="M4 10a6 6 0 1 1 1.8 4.3M4 14v-3.6h3.6" />,
  },
  {
    label: "Privacy policy",
    href: "/legal/privacy",
    icon: (
      <>
        <rect x="5" y="9" width="10" height="7.5" rx="1.6" />
        <path d="M7.4 9V6.8a2.6 2.6 0 0 1 5.2 0V9" />
      </>
    ),
  },
];

export default function WalletMenu() {
  return (
    <nav aria-label="Wallet settings" className="wallet-glass mt-6 overflow-hidden rounded-2xl">
      <ul style={{ borderColor: "var(--wallet-divider)" }} className="divide-y">
        {ROWS.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="flex items-center gap-3.5 px-5 py-3.5 transition-colors"
              style={{ color: "var(--wallet-fg)" }}
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full"
                style={{ background: "var(--wallet-icon-circle)", color: "var(--wallet-icon-fg)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {r.icon}
                </svg>
              </span>
              <span className="flex-1 text-[13.5px] font-medium">{r.label}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="shrink-0 opacity-35"
                aria-hidden
              >
                <path
                  d="M4 2.5l3.5 3.5L4 9.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
