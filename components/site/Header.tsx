"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AccountChip from "./AccountChip";
import CommandPalette from "./CommandPalette";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";
import Wordmark from "./Wordmark";
import ThemeToggle from "@/components/theme/ThemeToggle";

const nav = [
  { href: "/pricing", label: "Pricing" },
  { href: "/jobs", label: "Jobs" },
  { href: "/orders", label: "Your filings" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const onServices = pathname === "/services" || pathname.startsWith("/services/");

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled || open
            ? "border-b border-border bg-surface/95 shadow-sm backdrop-blur-md"
            : "border-b border-border bg-surface"
        }`}
      >
        {/* Utility bar — logo, search, auth */}
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0" aria-label="LAWFIC home">
            <Wordmark />
          </Link>

          <span className="hidden text-[11px] text-muted-foreground lg:inline">
            Registrations &amp; Compliance
          </span>

          <div className="ml-auto flex items-center gap-2">
            <CommandPalette />
            <AccountChip />
            <ThemeToggle />
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-8 place-items-center rounded border border-border text-muted md:hidden"
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

        {/* Primary navigation bar — horizontal, dense */}
        <nav
          className="hidden border-t border-border md:block"
          aria-label="Main"
        >
          <div className="mx-auto flex h-10 max-w-7xl items-center gap-1 px-4 sm:px-6">
            <MegaMenu active={onServices} />
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-primary-light text-primary"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="ml-auto flex items-center gap-3">
              <span className="text-[11px] text-subtle">
                Need help?{" "}
                <Link
                  href="/contact"
                  className="text-primary hover:text-primary-hover"
                >
                  Contact us
                </Link>
              </span>
            </div>
          </div>
        </nav>
      </header>

      <MobileNav open={open} onClose={() => setOpen(false)} nav={nav} />
    </>
  );
}
