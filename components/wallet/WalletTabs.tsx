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
    >
      {items.map((it) => {
        const active =
          pathname === it.href || (it.href !== "/wallet" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "bg-[#d4af37] text-[#0b0b0b]"
                : "text-[#f4f4ee]/70 hover:bg-white/5 hover:text-[#f4f4ee]"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
