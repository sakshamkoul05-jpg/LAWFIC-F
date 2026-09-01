"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Wordmark from "@/components/site/Wordmark";
import ThemeToggle from "@/components/theme/ThemeToggle";

type User = {
  email?: string;
  phone?: string;
  user_metadata?: Record<string, string>;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getInitial(name?: string): string {
  if (!name) return "L";
  return name.charAt(0).toUpperCase();
}

const searchCategories = [
  "All",
  "Identity",
  "Business",
  "Tax",
  "Licence",
  "IP",
  "Payroll",
  "Legal",
];

export default function ClassicHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchCategory, setSearchCategory] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isSupabaseConfigured) return;

    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Guest";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      {/* Grid: [logo | search | auth] on desktop; [logo | auth / search] on phones */}
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2.5 px-3 py-2.5 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-4">
        {/* Logo */}
        <Link href="/" className="col-start-1 row-start-1 shrink-0 justify-self-start" aria-label="LAWFIC home">
          <Wordmark />
        </Link>

        {/* Right side: Theme + wallet + auth (row 1 on mobile, col 3 on desktop) */}
        <div className="col-start-2 row-start-1 flex items-center gap-2 justify-self-end lg:col-start-3">
          {/* Light / dark toggle */}
          <ThemeToggle />

          {/* Wallet — always visible so the wallet is one tap away */}
          <Link
            href="/wallet"
            aria-label="Wallet"
            title="Wallet"
            className="flex size-9 items-center justify-center rounded-full border border-primary text-primary transition-colors hover:bg-primary-light"
          >
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="11.5" cy="9.5" r="1" fill="currentColor" />
            </svg>
          </Link>

          {/* Auth */}
          {mounted && user ? (
            <Link href="/profile" className="flex items-center gap-2 rounded border border-border px-2.5 py-1.5 transition-colors hover:border-primary">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">
                {getInitial(displayName)}
              </div>
              <div className="hidden text-right lg:block">
                <p className="text-[10px] text-muted leading-tight">{getGreeting()}</p>
                <p className="text-[12px] font-medium text-foreground leading-tight">{displayName}</p>
              </div>
            </Link>
          ) : mounted ? (
            <Link
              href="/login"
              className="rounded bg-primary px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Sign in
            </Link>
          ) : null}
        </div>

        {/* Big search bar — full-width row 2 on mobile, centre col on desktop */}
        <div className="col-span-2 col-start-1 row-start-2 flex w-full items-center lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <div className="flex w-full items-stretch overflow-hidden rounded-md border-2 border-border focus-within:border-primary transition-colors">
            {/* Category dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex h-full items-center gap-1 border-r border-border bg-surface-2 px-2.5 text-[12px] font-medium text-muted transition-colors hover:bg-surface-3 sm:px-3"
              >
                <span className="whitespace-nowrap">{searchCategory}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-muted">
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-0.5 w-44 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
                    {searchCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setSearchCategory(cat); setDropdownOpen(false); }}
                        className={`flex w-full items-center px-3 py-2 text-left text-[12px] transition-colors hover:bg-surface-2 ${
                          searchCategory === cat ? "bg-primary-light text-primary font-medium" : "text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Search input */}
            <input
              type="search"
              placeholder="Search services, documents, jobs..."
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14px] text-foreground outline-none placeholder:text-subtle sm:px-4"
            />

            {/* Big search button */}
            <button
              type="button"
              className="shrink-0 bg-primary px-4 text-white transition-colors hover:bg-primary-hover"
              aria-label="Search"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="2" />
                <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
