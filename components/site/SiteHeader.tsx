"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Wordmark from "@/components/site/Wordmark";
import HeaderSearch from "@/components/site/HeaderSearch";
import ProfileMenu from "@/components/site/ProfileMenu";
import SignInDialog from "@/components/site/SignInDialog";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { classicTabs, tabAccent } from "@/lib/nav-tabs";

/**
 * The title bar: identity, a way into everything, search, account.
 *
 * The mark leads at full size on the far left — emblem, name, tagline — because
 * the first thing on every page should be whose site this is.
 *
 * The hamburger sits next to it at every width rather than only on mobile. With
 * twenty-one sections and thirty-nine services, a single place that lists
 * everything is worth having even on a wide screen where the strip below is
 * fully visible; the strip is for aiming at a section you already know, the
 * drawer is for finding out what exists.
 *
 * Cart and saved services are here because the header is where people look for
 * them, and being absent is a worse answer than being empty.
 */

type User = {
  email?: string;
  phone?: string;
  user_metadata?: Record<string, string>;
};

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [signIn, setSignIn] = useState(false);
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

  useEffect(() => {
    setDrawer(false);
    setSignIn(false);
  }, [pathname]);

  /* A drawer that leaves the page scrolling behind it feels like a panel that
     has come loose. */
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-5 sm:px-7">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            aria-expanded={drawer}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-border-3 hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path
                d="M2 4.5h14M2 9h14M2 13.5h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <Link href="/" aria-label="LAWFIC home" className="shrink-0">
            <Wordmark />
          </Link>

          <HeaderSearch className="hidden min-w-0 flex-1 md:block" />

          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
            <IconLink
              href="/wishlist"
              label="Saved services"
              active={isActive("/wishlist")}
            >
              <path
                d="M10 16s-6-3.8-6-8a3.4 3.4 0 0 1 6-2.1A3.4 3.4 0 0 1 16 8c0 4.2-6 8-6 8Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </IconLink>

            <IconLink href="/cart" label="Your cart" active={isActive("/cart")}>
              <path
                d="M3 4h2l1.7 8.2a1.4 1.4 0 0 0 1.4 1.1h6.1a1.4 1.4 0 0 0 1.4-1.1L17 7H6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="8.5" cy="16" r="1.1" fill="currentColor" />
              <circle cx="14.5" cy="16" r="1.1" fill="currentColor" />
            </IconLink>

            {mounted && user && (
              <IconLink href="/wallet" label="Your wallet" active={isActive("/wallet")}>
                <rect x="2.5" y="5" width="15" height="11" rx="2.2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2.5 8.5h15" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="14" cy="12.5" r="1.15" fill="currentColor" />
              </IconLink>
            )}

            <ThemeToggle />

            {mounted ? (
              <ProfileMenu user={user} onSignInClick={() => setSignIn(true)} />
            ) : (
              <span className="h-9 w-20" aria-hidden />
            )}
          </div>
        </div>

        {/* On a narrow screen the search moves under the row rather than off it */}
        <div className="border-t border-border/60 px-4 py-2 md:hidden">
          <HeaderSearch />
        </div>
      </header>

      {/* Everything, in one place. Opened from the hamburger at any width. */}
      {drawer && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="All sections">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <nav className="absolute inset-y-0 left-0 flex w-[min(360px,88vw)] flex-col overflow-y-auto border-r border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="text-[13px] font-semibold tracking-tight text-foreground">
                All sections
              </span>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <ul className="px-2 py-2">
              {classicTabs.map((tab) => {
                const active = isActive(tab.href);
                return (
                  <li key={tab.id}>
                    <Link
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-foreground transition-colors hover:bg-surface-2"
                    >
                      {/* The section's colour, so the drawer and the strip
                          teach the same thing. */}
                      <span
                        aria-hidden
                        className="h-5 w-[3px] shrink-0 rounded-full"
                        style={{ background: tabAccent(tab.id), opacity: active ? 1 : 0.55 }}
                      />
                      <span className={active ? "font-medium" : undefined}>{tab.label}</span>
                      {!tab.live && (
                        <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-subtle">
                          Soon
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}

      <SignInDialog open={signIn} onClose={() => setSignIn(false)} />
    </>
  );
}

function IconLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`grid size-9 place-items-center rounded-full border transition-colors ${
        active
          ? "border-primary/50 bg-primary-light text-primary"
          : "border-border text-muted hover:border-border-3 hover:text-foreground"
      }`}
    >
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden>
        {children}
      </svg>
    </Link>
  );
}
