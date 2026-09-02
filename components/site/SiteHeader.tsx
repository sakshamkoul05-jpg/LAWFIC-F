"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Wordmark from "@/components/site/Wordmark";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { classicTabs } from "@/lib/nav-tabs";

/**
 * The title bar: identity, search, account. Navigation proper lives in the
 * strip below (ClassicCategoryTabs), so nothing is listed twice.
 *
 * Search earns its place here precisely because the site is broad — 21
 * sections and 39 services means typing a name will usually beat hunting for
 * it. It is a single quiet field rather than the split category dropdown it
 * replaces, which was doing an Amazon impression the rest of the site is not.
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
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

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

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Account";

  /* Greet by first name only. "Hi, Saksham" is a person talking; "Hi, Saksham
     Koul" is a database row talking, and a full legal name in the chrome of
     every page reads like a billing statement. */
  const firstName = displayName.split(" ")[0];

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/services?q=${encodeURIComponent(q)}` : "/services");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-5 sm:px-7">
        <Link href="/" aria-label="LAWFIC home" className="shrink-0">
          <Wordmark />
        </Link>

        <form
          onSubmit={search}
          role="search"
          className="hidden min-w-0 flex-1 items-center md:flex"
        >
          <div className="flex w-full max-w-md items-center gap-2.5 rounded-full border border-border bg-surface-2/60 px-4 transition-colors focus-within:border-primary/50 focus-within:bg-surface">
            <svg
              width="15"
              height="15"
              viewBox="0 0 20 20"
              fill="none"
              className="shrink-0 text-subtle"
              aria-hidden
            >
              <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.7" />
              <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services and documents"
              aria-label="Search services and documents"
              className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] text-foreground outline-none placeholder:text-subtle"
            />
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
          {/* The wallet is the one signed-in destination worth a permanent
              shortcut: it holds money, and hunting for it through a 21-tab
              strip is not a reasonable way to check a balance. Shown only when
              signed in, since it means nothing to a visitor. */}
          {mounted && user && (
            <Link
              href="/wallet"
              aria-label="Your wallet"
              title="Wallet"
              aria-current={isActive("/wallet") ? "page" : undefined}
              className={`grid size-9 place-items-center rounded-full border transition-colors ${
                isActive("/wallet")
                  ? "border-primary/50 bg-primary-light text-primary"
                  : "border-border text-muted hover:border-border-3 hover:text-foreground"
              }`}
            >
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden>
                <rect x="2.5" y="5" width="15" height="11" rx="2.2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2.5 8.5h15" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="14" cy="12.5" r="1.15" fill="currentColor" />
              </svg>
            </Link>
          )}

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
              <span className="hidden max-w-[14ch] truncate text-[13px] text-foreground sm:block">
                Hi, <span className="font-medium">{firstName}</span>
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
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              ) : (
                <path d="M2 4.5h12M2 11.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile sheet — the full section list, since the strip is hard to
          scan by thumb on a narrow screen. */}
      {sheetOpen && (
        <nav
          id="mobile-nav"
          aria-label="Sections"
          className="max-h-[70vh] overflow-y-auto border-t border-border bg-background md:hidden"
        >
          <form onSubmit={search} role="search" className="px-4 pb-1 pt-3">
            <div className="flex items-center gap-2.5 rounded-full border border-border bg-surface-2/60 px-4">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="shrink-0 text-subtle" aria-hidden>
                <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.7" />
                <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services and documents"
                aria-label="Search services and documents"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] text-foreground outline-none placeholder:text-subtle"
              />
            </div>
          </form>

          <ul className="grid grid-cols-2 gap-x-3 px-4 py-2">
            {classicTabs.map((tab) => (
              <li key={tab.id}>
                <Link
                  href={tab.href}
                  aria-current={isActive(tab.href) ? "page" : undefined}
                  className={`block border-b border-border py-3 text-[14px] ${
                    isActive(tab.href) ? "font-medium text-primary" : "text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
