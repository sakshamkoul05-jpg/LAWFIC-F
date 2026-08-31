"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Wordmark from "@/components/site/Wordmark";

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

export default function ClassicHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

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
      {/* Top utility row */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 sm:px-6">
        {/* Logo */}
        <Link href="/" className="shrink-0" aria-label="LAWFIC home">
          <Wordmark />
        </Link>

        {/* Tagline */}
        <span className="hidden text-[11px] text-muted-foreground lg:inline">
          Quality Service With Love
        </span>

        {/* Spacer */}
        <div className="ml-auto flex items-center gap-3">
          {/* Search */}
          <div className="hidden items-center sm:flex">
            <div className="flex items-center overflow-hidden rounded border border-border bg-surface-2 focus-within:border-primary">
              <input
                type="search"
                placeholder="Search services..."
                className="w-48 bg-transparent px-3 py-1.5 text-[13px] text-foreground outline-none placeholder:text-subtle lg:w-64"
              />
              <button
                type="button"
                className="shrink-0 bg-primary px-3 py-1.5 text-white transition-colors hover:bg-primary-hover"
                aria-label="Search"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Auth */}
          {mounted && user ? (
            <Link href="/wallet" className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">
                {getInitial(displayName)}
              </div>
              <div className="hidden text-right md:block">
                <p className="text-[10px] text-muted leading-tight">{getGreeting()}</p>
                <p className="text-[12px] font-medium text-foreground leading-tight">{displayName}</p>
              </div>
            </Link>
          ) : mounted ? (
            <Link
              href="/login"
              className="rounded bg-primary px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Sign in
            </Link>
          ) : null}

          {/* Wallet link */}
          {mounted && user && (
            <Link
              href="/wallet"
              className="hidden items-center gap-1.5 rounded border border-border px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-primary hover:text-foreground sm:flex"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-primary">
                <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="11.5" cy="9.5" r="1" fill="currentColor" />
              </svg>
              Wallet
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
