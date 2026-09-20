"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The back office, in the order the day uses them.
 *
 * Orders answers "what needs doing" and stays first, because that is what an
 * agent opens the back office to do. Customers answers "who is this" — the
 * same data pivoted, so it sits next to it. Dashboard answers "how are we
 * doing", which is an owner's question rather than an agent's and therefore
 * does not get the front slot. Content is the home page itself; Categories is
 * the service catalogue behind the menu, the footer and the search box; Jobs
 * is the postings board.
 *
 * Seven is close to the point where a row of links becomes a thing to read
 * rather than a thing to glance at. The next addition should probably group
 * the three content-shaped ones behind a single heading rather than making it
 * eight.
 *
 * Orders keeps /admin rather than being moved under a path of its own. The
 * daily queue should be what the bare URL opens, and a dashboard at the root
 * would put a screen of totals in front of the work every single time.
 */

const LINKS = [
  { href: "/admin", label: "Orders", exact: true },
  { href: "/admin/customers", label: "Customers", exact: false },
  { href: "/admin/dashboard", label: "Dashboard", exact: false },
  { href: "/admin/content", label: "Content", exact: false },
  { href: "/admin/categories", label: "Categories", exact: false },
  { href: "/admin/jobs", label: "Jobs", exact: false },
  { href: "/admin/settings", label: "Settings", exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Back office" className="flex flex-wrap items-center gap-1">
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
