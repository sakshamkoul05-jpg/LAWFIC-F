"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AccountChip from "./AccountChip";
import CommandPalette from "./CommandPalette";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";
import Wordmark from "./Wordmark";

/** Everything except Services, which is a mega-menu rather than a link. */
const nav = [
  { href: "/jobs", label: "Jobs" },
  { href: "/orders", label: "Your filings" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const onServices = pathname === "/services" || pathname.startsWith("/services/");

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-colors duration-500 ${
          lifted || open
            ? "border-b border-line bg-ink/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-18 max-w-6xl items-center gap-6 px-5 sm:px-8">
          <Link href="/" className="shrink-0" aria-label="LAWFIC home">
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
            <MegaMenu active={onServices} />
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-3 py-2 text-sm transition-colors ${
                    active ? "text-brass" : "text-ash hover:text-bone"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <CommandPalette />
            <AccountChip />

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="grid size-9 place-items-center rounded border border-line-2 text-ash md:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 h-px w-4 bg-current transition-all duration-300 ${
                    open ? "top-1.5 rotate-45" : "top-0.5"
                  }`}
                />
                <span
                  className={`absolute left-0 h-px w-4 bg-current transition-all duration-300 ${
                    open ? "top-1.5 -rotate-45" : "top-2.5"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={open} onClose={() => setOpen(false)} nav={nav} />
    </>
  );
}
