"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/wallet", label: "Balance" },
  { href: "/wallet/topup", label: "Top up" },
  { href: "/wallet/customize", label: "Customize" },
  { href: "/wallet/transactions", label: "Transactions" },
];

export default function WalletTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Wallet sections"
      className="mx-auto flex w-full max-w-3xl items-center justify-center gap-1.5 px-4"
      style={{ color: "var(--wallet-fg)" }}
    >
      {items.map((it) => {
        const active =
          pathname === it.href || (it.href !== "/wallet" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
            style={{
              background: active ? "#7c3aed" : "var(--wallet-btn-bg)",
              color: active ? "#ffffff" : "var(--wallet-fg-muted)",
            }}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
