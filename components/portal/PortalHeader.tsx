"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
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

export default function PortalHeader() {
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
      {/* Top row: Logo, Search, User */}
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
        {/* Logo area */}
        <Link href="/" className="shrink-0" aria-label="LAWFIC home">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-[18px] font-bold text-white">
              L
            </div>
            <div className="hidden sm:block">
              <p className="text-[16px] font-bold text-foreground leading-tight">LAWFIC</p>
              <p className="text-[10px] text-muted leading-tight">Quality Service With Love</p>
            </div>
          </div>
        </Link>

        {/* Language / Location */}
        <div className="hidden items-center gap-4 lg:flex">
          <div className="flex flex-col items-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.1" />
              <path d="M1.5 8h13M8 1.5c-2 2-3 4-3 6.5s1 4.5 3 6.5M8 1.5c2 2 3 4 3 6.5s-1 4.5-3 6.5" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            <span className="text-[9px] text-muted mt-0.5">LANGUAGE</span>
          </div>
          <div className="flex flex-col items-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted">
              <path d="M8 1.5c-2.7 0-5 2.2-5 5 0 3.5 5 8 5 8s5-4.5 5-8c0-2.8-2.3-5-5-5Z" stroke="currentColor" strokeWidth="1.1" />
              <circle cx="8" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            <span className="text-[9px] text-muted mt-0.5">LOCATION</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="mx-auto flex w-full max-w-2xl items-center">
          <div className="flex w-full items-center overflow-hidden rounded border border-border bg-surface-2 focus-within:border-primary">
            <span className="shrink-0 border-r border-border px-3 py-2.5 text-[12px] text-muted">
              All ▾
            </span>
            <input
              type="search"
              placeholder="Search services, documents, jobs..."
              className="w-full bg-transparent px-4 py-2.5 text-[14px] text-foreground outline-none placeholder:text-subtle"
            />
            <button
              type="button"
              className="shrink-0 bg-primary px-4 py-2.5 text-white transition-colors hover:bg-primary-hover"
              aria-label="Search"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* User / Auth */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {mounted && user ? (
            <Link href="/wallet" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-[14px] font-bold text-white">
                {getInitial(displayName)}
              </div>
              <div className="hidden text-right md:block">
                <p className="text-[11px] text-muted leading-tight">{getGreeting()}</p>
                <p className="text-[13px] font-medium text-foreground leading-tight">{displayName}</p>
              </div>
            </Link>
          ) : mounted ? (
            <Link
              href="/login"
              className="rounded bg-primary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
