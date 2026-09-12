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
        <div className="flex w-full items-center gap-2 px-3 py-2 sm:gap-2.5 sm:px-4 lg:gap-2.5 lg:px-4">
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
            className="grid size-10 shrink-0 self-start place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-border-3 hover:text-foreground sm:size-12 lg:size-14"
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
              rather than squeezing the controls either side of it.

              LENGTH IS WON FROM THE OTHER ITEMS, NOT ASKED FOR HERE

              `flex-1` already gives this everything spare, so the only way to
              make it longer is to make its neighbours smaller — which is what
              the sizes on the location box, the language chip and the action
              cells are now doing. On a 1440 screen the row used to spend 874px
              on fixed items and leave 430 for the search; it now leaves about
              620, and past 1600 the search is the widest thing on the page by
              a distance, which is the shape being asked for. */}
          <HeaderSearch className="hidden min-w-[200px] flex-1 md:block" />


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

        {/* THE ACTION STRIP GETS ITS OWN ROW.

            It used to sit in the main row, which is where the blueprint draws
            it — and for seven icons without labels that worked. It stopped
            working at nine icons WITH labels: nine labelled cells is 486px, and
            with the mark, the location box, the language chip and the account
            corner also on that row there were about 360 pixels left for the
            search. The three things being asked for — a long search bar, every
            icon kept, a word under each one — do not fit on one line at 1440,
            and no amount of trimming closes a gap that size.

            On its own row all three happen at once: the search takes the middle
            of the row above and runs to about 850px, every label is back at
            every width, and nothing was dropped to pay for it.

            `xl:grid`, not `xl:flex`: the component lays its cells out on a grid
            with equal columns, and a `flex` here silently overrode that and let
            every cell collapse to its own content — the ragged row this was
            meant to fix in the first place. */}
        <div className="hidden border-t border-border/60 md:block">
          <div className="flex w-full items-center justify-end px-3 sm:px-4 lg:px-4">
            <HeaderActions className="grid" />
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
