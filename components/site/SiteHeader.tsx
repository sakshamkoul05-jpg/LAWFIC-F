"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Wordmark from "@/components/site/Wordmark";
import HeaderSearch from "@/components/site/HeaderSearch";
import SignInDialog from "@/components/site/SignInDialog";
import LocationBox from "@/components/site/LocationBox";
import HeaderActions from "@/components/site/HeaderActions";
import ProfileCorner from "@/components/site/ProfileCorner";
import MegaMenu from "@/components/site/MegaMenu";
import { LanguageMenu } from "@/components/site/HeaderMenus";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { classicTabs, tabAccent } from "@/lib/nav-tabs";

/**
 * The title bar, laid out as the client's blueprint sets it.
 *
 * Left to right: the menu, the mark, where you are filing, the language, then
 * the search — long and centred, which is the one shape everybody already knows
 * how to use — then the seven actions, then the account corner hard right.
 *
 * WHY THE SEARCH IS THE MIDDLE AND EVERYTHING ELSE IS AN EDGE
 *
 * A site with twenty-seven sections and several hundred services cannot be
 * navigated by browsing alone; most people arrive knowing the words for what
 * they want ("pan card", "gst") and not which of twenty-seven tabs owns it. So
 * the search gets the widest, most central slot on the bar and the rest is
 * pushed to the margins, where it is still reachable but is not competing.
 *
 * The hamburger stays at every width rather than appearing only on mobile: the
 * strip below is for aiming at a section you already know, the drawer is for
 * finding out what exists, and those are different jobs.
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
  const { t } = useLocale();

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
        <div className="flex w-full items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 lg:gap-4 lg:px-5">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label={t("nav.openMenu")}
            aria-expanded={drawer}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-border-3 hover:text-foreground"
          >
            {/* FOUR LINES, FOUR COLOURS.
                The client's note is about the ICON, not the menu behind it: the
                hamburger itself carries the four bars in different colours so
                the way into everything is the one control on the bar that is
                not monochrome. It is the only colour left in the chrome, which
                is what makes it work — a strip that used to carry an accent per
                section had twenty-seven, and at that count colour stops being a
                signal and becomes wallpaper.

                Colour alone never carries meaning here: this is decoration on a
                control that already has a label, so it costs a viewer who
                cannot separate the hues precisely nothing. */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M2 3.5h14" stroke="#C58F6B" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M2 7.2h14" stroke="#7FA8A0" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M2 10.9h14" stroke="#C9B87E" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M2 14.6h14" stroke="#8FA3C9" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/" aria-label="LAWFIC home" className="shrink-0">
            <Wordmark />
          </Link>

          {/* Where you are filing, then the language — both to the left of the
              search, as the sheet places them. */}
          <LocationBox className="hidden xl:block" />
          <span className="hidden lg:block">
            <LanguageMenu />
          </span>

          {/* The middle, and it takes everything left over.
              No max-width: the client's note is that the search is long, and a
              cap would leave a gap on a wide screen for no reason. It is the
              only flexible item in the row, so it also absorbs the shrinking
              rather than squeezing the controls either side of it. */}
          <HeaderSearch className="hidden min-w-[200px] flex-1 md:block" />

          {/* `xl:grid`, not `xl:flex`: the component lays its cells out on a grid
              with equal columns, and a `flex` here silently overrode that and
              let every cell collapse to its own content — which is exactly the
              ragged row this was meant to fix. */}
          <HeaderActions className="hidden xl:grid" />

          {/* Compact, and no longer pinned to the far edge with `ml-auto`.
              Signed out this used to be a "Sign in" pill a hundred and forty
              pixels wide, held against the right rail; the search wanted that
              width more than a second call to action did. */}
          <div className="ml-auto flex shrink-0 items-center xl:ml-0">
            {mounted ? (
              <ProfileCorner user={user} onSignInClick={() => setSignIn(true)} />
            ) : (
              <span className="h-11 w-14" aria-hidden />
            )}
          </div>
        </div>

        {/* On a narrow screen the search moves under the row rather than off it */}
        <div className="border-t border-border/60 px-3 py-2 md:hidden">
          <HeaderSearch />
        </div>
      </header>

      {/* Everything, in one place. Opened from the hamburger at any width. */}
      {drawer && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t("nav.allSections")}>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <nav className="absolute inset-y-0 left-0 flex w-[min(360px,88vw)] flex-col overflow-y-auto border-r border-border bg-surface">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <span className="font-display text-[15px] font-semibold text-foreground">
                {t("nav.allSections")}
              </span>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label={t("nav.closeMenu")}
                className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <MegaMenu onNavigate={() => setDrawer(false)} />

            {/* Below the wide breakpoints these three are not on the bar, so
                the drawer is where they live. */}
            <div className="mt-auto flex shrink-0 flex-wrap items-center gap-2 border-t border-border px-4 py-4 xl:hidden">
              <LocationBox className="lg:hidden" />
              <span className="lg:hidden">
                <LanguageMenu />
              </span>
              <Link
                href="/wishlist"
                className="rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("acct.saved")}
              </Link>
            </div>
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
