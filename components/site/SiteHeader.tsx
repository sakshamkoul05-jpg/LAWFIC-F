"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Wordmark from "@/components/site/Wordmark";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { primaryNav } from "@/lib/nav";

/**
 * One bar.
 *
 * What this replaces: a logo row, an Amazon-style search field, and a 21-tab
 * strip — roughly 260px of chrome standing between the visitor and the
 * product on a 720px screen. Search moved into /services, where the filtering
 * actually lives; breadth moved into the catalogue, which is built for it.
 */

type User = {
  email?: string;
  phone?: string;
  user_metadata?: Record<string, string>;
};

function initialOf(name: string): string {
  return name.charAt(0).toUpperCase() || "L";
}

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    if (!isSupabaseConfigured) return;

    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) =>
      setUser(session?.user ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Close the mobile sheet on navigation.
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Account";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-7">
        <Link href="/" aria-label="LAWFIC home" className="shrink-0">
          <Wordmark />
        </Link>

        {/* Primary nav — desktop */}
        <nav aria-label="Primary" className="hidden flex-1 items-center gap-1 md:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-[14px] transition-colors ${
                isActive(item.href)
                  ? "bg-primary-light font-medium text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
          <ThemeToggle />

          {mounted && user ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 transition-colors hover:border-border-3"
              aria-label="Your account"
            >
              <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-background">
                {initialOf(displayName)}
              </span>
              <span className="hidden max-w-[9ch] truncate text-[13px] text-foreground lg:block">
                {displayName}
              </span>
            </Link>
          ) : mounted ? (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full bg-primary px-3.5 py-2 text-[13px] font-medium text-background transition-colors hover:bg-primary-hover sm:px-4"
            >
              Sign in
            </Link>
          ) : (
            <span className="h-9 w-20" aria-hidden />
          )}

          {/* Mobile sheet trigger */}
          <button
            type="button"
            onClick={() => setSheetOpen((v) => !v)}
            aria-expanded={sheetOpen}
            aria-controls="mobile-nav"
            aria-label={sheetOpen ? "Close menu" : "Open menu"}
            className="grid size-9 place-items-center rounded-full border border-border text-muted transition-colors hover:text-foreground md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              {sheetOpen ? (
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M2 4.5h12M2 11.5h12"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {sheetOpen && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="border-t border-border bg-background md:hidden"
        >
          <ul className="mx-auto flex max-w-6xl flex-col px-5 py-2 sm:px-7">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="flex flex-col gap-0.5 border-b border-border py-3.5 last:border-b-0"
                >
                  <span
                    className={`text-[15px] ${
                      isActive(item.href) ? "font-medium text-primary" : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[12.5px] text-muted-fg">{item.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
