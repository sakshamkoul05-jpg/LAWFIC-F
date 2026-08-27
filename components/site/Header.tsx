"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { services } from "@/lib/services";
import AccountChip from "./AccountChip";
import Wordmark from "./Wordmark";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/jobs", label: "Jobs" },
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

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-500 ${
        lifted ? "bg-ink/85 backdrop-blur-xl border-b border-line" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-8 px-5 sm:px-8">
        <Link href="/" className="shrink-0" aria-label="LAWFIC home">
          <Wordmark />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
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
          <AccountChip />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden grid size-9 place-items-center rounded border border-line-2 text-ash"
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

      {open && (
        <div className="md:hidden border-t border-line bg-ink/95 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
            <p className="label mb-3 text-slate">Services</p>
            <div className="mb-5 grid gap-px overflow-hidden rounded border border-line bg-line">
              {services.map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="bg-surface px-4 py-3 text-sm text-bone"
                >
                  {s.name}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="px-1 py-2 text-sm text-ash">
                  {item.label}
                </Link>
              ))}
              <Link href="/wallet" className="px-1 py-2 text-sm text-ash">
                Wallet
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
