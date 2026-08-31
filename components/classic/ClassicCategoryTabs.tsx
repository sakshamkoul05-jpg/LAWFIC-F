"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabItem = {
  label: string;
  sublabel: string;
  href: string;
};

const classicTabs: TabItem[] = [
  { label: "Home", sublabel: "Tab 1", href: "/" },
  { label: "About", sublabel: "Tab 2", href: "/about" },
  { label: "Document", sublabel: "Tab 3", href: "/services" },
  { label: "Admission", sublabel: "Tab 4", href: "/services#identity" },
  { label: "Education", sublabel: "Tab 5", href: "/services#tax" },
  { label: "Startup", sublabel: "Tab 6", href: "/services/msme-udyam" },
  { label: "Business", sublabel: "Tab 7", href: "/services#business" },
  { label: "Jobs", sublabel: "Tab 8", href: "/jobs" },
  { label: "Branding", sublabel: "Tab 9", href: "/services#ip" },
  { label: "Partner", sublabel: "Tab 10", href: "/about" },
  { label: "Investment", sublabel: "Tab 11", href: "/pricing" },
  { label: "LAWFiC", sublabel: "Tab 12", href: "/" },
  { label: "New Idea", sublabel: "Tab 13", href: "/about" },
  { label: "Blogs", sublabel: "Tab 14", href: "/about" },
  { label: "Professionalism", sublabel: "Tab 15", href: "/about" },
  { label: "Carrier", sublabel: "Tab 16", href: "/jobs" },
  { label: "Entertainment", sublabel: "Tab 17", href: "/about" },
  { label: "Gift", sublabel: "Tab 18", href: "/wallet" },
  { label: "Our Store", sublabel: "Tab 19", href: "/services" },
  { label: "Instant Help", sublabel: "Tab 20", href: "/contact" },
  { label: "Contact", sublabel: "Tab 21", href: "/contact" },
];

/**
 * The 21-tab horizontal navigation bar, matching the reference layout.
 * Each tab shows a main label on top with a small green secondary label underneath.
 * Tabs are separated by thin borders and arranged compactly horizontally.
 */
export default function ClassicCategoryTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="classic-tabs-nav overflow-x-auto border-b border-border bg-surface"
      aria-label="Classic navigation"
    >
      <div className="mx-auto flex min-w-max items-stretch">
        {classicTabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`classic-tab-item group flex flex-col items-center border-r border-border px-3 py-2 text-center transition-colors ${
                active
                  ? "bg-primary-light text-primary"
                  : "text-foreground hover:bg-surface-2"
              }`}
              style={{ minWidth: 64 }}
            >
              <span className="text-[11px] font-semibold leading-tight whitespace-nowrap">
                {tab.label}
              </span>
              <span className="mt-0.5 text-[8px] font-medium leading-tight text-success whitespace-nowrap">
                {tab.sublabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
