"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  tab: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Home", tab: "Home", href: "/" },
  { label: "About", tab: "About", href: "/about" },
  { label: "Services", tab: "Services", href: "/services" },
  { label: "Identity", tab: "KYC", href: "/services#identity" },
  { label: "Business", tab: "Reg.", href: "/services#business" },
  { label: "Tax", tab: "Tax", href: "/services#tax" },
  { label: "Licence", tab: "Permits", href: "/services#licence" },
  { label: "IP", tab: "IP", href: "/services#ip" },
  { label: "Payroll", tab: "Labour", href: "/services#payroll" },
  { label: "Legal", tab: "Docs", href: "/services#legal" },
  { label: "Pricing", tab: "Plans", href: "/pricing" },
  { label: "Jobs", tab: "Careers", href: "/jobs" },
  { label: "Wallet", tab: "Wallet", href: "/wallet" },
  { label: "Orders", tab: "Filings", href: "/orders" },
  { label: "Contact", tab: "Help", href: "/contact" },
];

export default function PortalNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="overflow-x-auto border-b border-border bg-surface"
      aria-label="Portal navigation"
    >
      <div className="mx-auto flex min-w-max items-stretch">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex flex-col items-center border-r border-border px-4 py-2 text-center transition-colors ${
                active
                  ? "bg-primary-light text-primary"
                  : "text-foreground hover:bg-surface-2"
              }`}
              style={{ minWidth: 72 }}
            >
              <span className="text-[12px] font-semibold leading-tight">
                {item.label}
              </span>
              <span className="text-[9px] text-muted leading-tight mt-0.5">
                {item.tab}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
