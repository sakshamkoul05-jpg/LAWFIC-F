"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { can, isStaffRole, type Capability } from "@/lib/staff-roles";

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

/* `needs` is what the destination is for, not what it will let you do once you
   are there. A guest can read the content page; they simply cannot change it,
   and the page and RLS both say so. Only the two links that are useless
   without the capability are hidden: Settings, and People's controls. */
const LINKS: {
  href: string;
  label: string;
  exact: boolean;
  needs: Capability;
}[] = [
  { href: "/admin", label: "Orders", exact: true, needs: "view" },
  { href: "/admin/customers", label: "Customers", exact: false, needs: "operate" },
  { href: "/admin/dashboard", label: "Dashboard", exact: false, needs: "view" },
  { href: "/admin/content", label: "Content", exact: false, needs: "view" },
  { href: "/admin/categories", label: "Categories", exact: false, needs: "view" },
  { href: "/admin/jobs", label: "Jobs", exact: false, needs: "view" },
  { href: "/admin/settings", label: "Settings", exact: false, needs: "settings" },
  { href: "/admin/people", label: "People", exact: false, needs: "view" },
];

export default function AdminNav({ role }: { role: string | null }) {
  const pathname = usePathname();
  const mine = isStaffRole(role) ? role : null;

  return (
    <nav aria-label="Back office" className="flex flex-wrap items-center gap-1">
      {LINKS.filter((l) => can(mine, l.needs)).map((l) => {
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
