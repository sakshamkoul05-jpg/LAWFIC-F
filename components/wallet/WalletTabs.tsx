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
      className="mx-auto flex w-full max-w-md items-center justify-center gap-1 rounded-full p-1"
      style={{ background: "var(--wallet-btn-bg)" }}
    >
      {items.map((it) => {
        const active =
          pathname === it.href || (it.href !== "/wallet" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex-1 rounded-full px-3 py-2 text-center text-[13px] font-medium transition-all duration-200"
            style={{
              background: active ? "var(--wallet-glass-bg)" : "transparent",
              color: active ? "var(--wallet-fg)" : "var(--wallet-fg-muted)",
              boxShadow: active ? "var(--wallet-glass-shadow)" : "none",
            }}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
