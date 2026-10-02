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

  /* The header is sticky, and with the quick-icon row it stands about two
     hundred pixels tall — a fifth of a laptop screen held over the page the
     whole way down. Once the reader is past the top, the icon row and the QR
     fold away and the bar keeps only the logo, location, language and account.
     Two thresholds, not one, so the change in height cannot flip it back. */
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setCompact((c) => (c ? y > 60 : y > 260));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHomePage = pathname === "/";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* The background is a variable so the home page's carousel can tint it
          to the flyer on screen; it is unset everywhere else and falls back to
          the theme's own surface. The transition is what stops a slide change
          from being a hard flash across the whole top of the page. */}
      <header
        className="sticky top-0 z-50 border-b border-border backdrop-blur-xl transition-colors duration-700"
        style={{ background: "var(--bar-header, color-mix(in srgb, var(--background) 85%, transparent))" }}
      >
        {/* TWO ROWS, ONE GRID.
            Row one is identity and place: menu, mark, location, language, the
            app QR, and the account at the far edge. Row two is the client's
            quick-icon bar on a line of its own, spread evenly across the same
            width the page content uses — so its first and last icons sit
            exactly above the edges of everything below. It used to share the
            first row and wrap wherever it ran out of room, which is what made
            the top of the page look scattered. */}
        {/* ONE CENTRE LINE. Every control on this row is the same 52px tall
            and centred on the same line — menu, location, language, QR and the
            account menu — with the logo stack centred between them, so the row
            reads as one bar instead of items at different heights. */}
        <div className="flex w-full items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label={t("nav.openMenu")}
            aria-expanded={drawer}
            /* SYMMETRIC WITH THE EMBLEM, WHICH MEANS TWO THINGS.

               Size: the wordmark's image is 40, 48 and 56px at the three
               breakpoints and this was a flat 40, so past sm the pair went out
               of step — a square control beside a larger round one.

               And position: `self-start`, because the mark is a STACK — emblem,
               then LAWFIC, then the tagline — 89px tall against the emblem's
               56. Centring both in the row put the hamburger's middle level
               with the middle of the whole stack and therefore 16px below the
               middle of the circle, which is the part of the mark the eye
               actually pairs it with. Aligning the tops puts two 56px squares
               on the same line. */
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-border-3 hover:text-foreground lg:size-[52px]"
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
            <svg
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden
              className="size-[18px] sm:size-[22px] lg:size-[26px]"
            >
              <path d="M2 3.5h14" stroke="#C58F6B" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M2 7.2h14" stroke="#7FA8A0" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M2 10.9h14" stroke="#C9B87E" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M2 14.6h14" stroke="#8FA3C9" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/" aria-label="LAWFIC home" className="shrink-0">
            <Wordmark />
          </Link>

          <span aria-hidden className="mx-1 hidden h-10 w-px bg-border lg:block" />

          <LocationBox className="hidden lg:block" />
          <span className="hidden lg:block [&_button]:h-[52px] [&_button]:rounded-xl [&_button]:px-4 [&_button]:text-[13px]">
            <LanguageMenu />
          </span>

          {/* The app download QR — the sheet's "APP DOWNLOAD LAWFIC · SCAN TO
              DOWNLOAD" tile. It opens the app's web version until the store
              listings exist. */}
          <a
            href="/download"
            aria-label={t("nav.appDownload", "Download the LAWFIC app")}
            className="header-qr hidden xl:flex"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/app-download-qr.png" alt="" className="h-[40px] w-[40px] rounded-[4px] bg-white p-[2px]" />
            <span className="flex flex-col leading-none">
              <span className="header-qr-top">APP DOWNLOAD</span>
              <span className="header-qr-name">LAWFIC</span>
              <span className="header-qr-top">SCAN TO DOWNLOAD</span>
            </span>
          </a>

          {/* The home page has its own search band under this bar, so the
              header's search is only drawn on every other page. */}
          {!isHomePage && <HeaderSearch className="hidden min-w-0 flex-1 md:block" />}

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {/* The app download, where the QR tile is not shown. On a phone
                a QR code is no use — the phone is the device — so this is a
                plain gold button straight to /download. */}
            <Link
              href="/download"
              aria-label={t("nav.appDownload", "Download the LAWFIC app")}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-[#E8CC7C] to-[#C6A15B] px-3 text-[12.5px] font-semibold text-[#17120A] shadow-[0_8px_18px_-10px_rgba(198,161,91,0.9)] transition hover:brightness-105 xl:hidden"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                <path d="M12 7.5v7m0 0-2.5-2.5M12 14.5l2.5-2.5" />
              </svg>
              <span>
                <span className="hidden min-[380px]:inline">Get </span>App
              </span>
            </Link>
            {mounted ? (
              <ProfileCorner user={user} onSignInClick={() => setSignIn(true)} />
            ) : (
              <span className="h-11 w-14" aria-hidden />
            )}
          </div>
        </div>

        {/* The quick-icon bar. Folds away once the reader scrolls, so the
            sticky header is one slim row for the rest of the page. */}
        {!compact && (
          <div className="hidden border-t border-border/70 xl:block">
            <HeaderActions className="flex w-full px-3 sm:px-4 lg:px-5" />
          </div>
        )}

        {/* On a narrow screen the search moves under the row rather than off it */}
        {!isHomePage && (
          <div className="border-t border-border/60 px-3 py-2 md:hidden">
            <HeaderSearch />
          </div>
        )}
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

            {/* The app, first thing in the drawer on every screen size. */}
            <Link
              href="/download"
              onClick={() => setDrawer(false)}
              className="mx-4 mt-4 flex shrink-0 items-center gap-3 rounded-2xl border border-[#C6A15B]/50 bg-[#C6A15B]/10 px-4 py-3 transition-colors hover:bg-[#C6A15B]/15"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/lawfic-logo.png" alt="" className="h-10 w-10 shrink-0 object-contain" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-foreground">Download the LAWFIC app</span>
                <span className="block text-[12px] text-muted-foreground">Android APK · iPhone web app</span>
              </span>
              <span aria-hidden className="text-[18px] text-primary">→</span>
            </Link>

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
