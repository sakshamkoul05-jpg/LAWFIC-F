"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Two destinations, and which one you are on.
 *
 * Orders answers "what needs doing", Customers answers "who is this". They are
 * the same data pivoted two ways, and an agent moves between them constantly,
 * so they sit side by side rather than one being buried inside the other.
 */

const LINKS = [
  { href: "/admin", label: "Orders", exact: true },
  { href: "/admin/customers", label: "Customers", exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Back office" className="flex items-center gap-1">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className="rounded-full px-3 py-1.5 text-[13px] transition-colors"
            style={
              active
                ? { background: "var(--primary-light)", color: "var(--primary)", fontWeight: 500 }
                : { color: "var(--muted-foreground)" }
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
