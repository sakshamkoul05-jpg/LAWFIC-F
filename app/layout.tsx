import type { Metadata } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ThemeShell from "@/components/theme/ThemeShell";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import AuthErrorCatcher from "@/components/site/AuthErrorCatcher";
import { createClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  IS_PUBLIC_SITE,
  graph,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

/* One UI family carries display and body alike — the way Apple ships SF and
   CRED ships Gilroy. Playfair Display (a high-contrast Didone) and Inter were
   both dropped: the Didone read decorative on a compliance product, and Inter
   is the default every generated interface reaches for. */
const grotesk = Schibsted_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/**
 * What every page inherits, and what a search engine or a chat app reads.
 *
 * METADATABASE IS NOT OPTIONAL
 *
 * Open Graph and canonical tags are only valid as ABSOLUTE URLs; a relative
 * one is discarded without complaint by every consumer of them. Next resolves
 * the relative paths below against this, so it is the single line that decides
 * whether the share card and the canonicals work at all. It comes from
 * NEXT_PUBLIC_SITE_URL — see resolveSiteUrl in lib/seo.ts for the fallbacks.
 *
 * THE TEMPLATE IS WHY EVERY PAGE SETS ONLY ITS OWN NAME
 *
 * `%s · LAWFIC` means a page writes `title: "Pricing"` and the tab, the search
 * result and the share card all read "Pricing · LAWFIC". The brand is appended
 * once, here, rather than typed into fifty files with fifty chances to drift.
 *
 * MAX-IMAGE-PREVIEW: LARGE
 *
 * The googleBot block is not a duplicate of `index: true`. Without
 * `max-image-preview: large`, Google shows a thumbnail at most — it is the
 * directive that makes a page eligible for the big image in a result and in
 * Discover. `max-snippet: -1` lifts the cap on the description length, so the
 * sentence written for the results page can be shown in full rather than cut
 * at Google's default.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  /* The home page is its own canonical. Every other page sets its own; this
     stops the root resolving to whatever host served the request, which is how
     a site ends up indexed twice under www and bare. */
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_IN",
  },
  twitter: {
    /* The large card, because there is a drawn 1200×630 image to put in it.
       `summary` would shrink it to a thumbnail beside the text. */
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: IS_PUBLIC_SITE
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : /* A preview or local build says so in the page itself as well as in
         robots.txt, because the two are read by different things at different
         times and only this one survives being linked from elsewhere. */
      { index: false, follow: false },
  formatDetection: {
    /* Safari turns anything that looks like a phone number into a call link,
       including GSTINs, PANs, CINs and order references. On a compliance site
       that is most of the page. */
    telephone: false,
  },
  category: "business",
};

/**
 * Settings are read HERE, once, and handed to the shell.
 *
 * The running strip and the site-wide notice appear on every page, so the read
 * belongs at the one place every page passes through. Reading them lower down
 * would mean one query per page that happened to want them, and the components
 * that render them are client components which cannot query at all.
 *
 * `loadSettings` never throws and never returns a partial object — a missing
 * table, a failed read or a malformed row all resolve to the values the site
 * shipped with. So this does not need a try/catch and the layout cannot be
 * taken down by a settings row.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const settings = await loadSettings(supabase);

  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('lawfic-color');var t=s==='dark'||s==='light'?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
        {/*
          WHO PUBLISHES THIS SITE, IN A FORM A MACHINE CAN READ.

          This is the half of "show the logo in search" that meta tags cannot
          do. A favicon (app/icon.png) is what appears beside a blue link; the
          `logo` inside this Organization record is what Google reads for the
          brand image in a knowledge panel, and it is the only documented way
          to say which of a site's many images is the company's mark.

          It sits in the root layout because these two facts are true of every
          page, and because a crawler that lands on a deep service page should
          learn who publishes it without having to find the home page first.

          `graph()` emits ONE script holding both nodes, joined by @id, rather
          than two scripts repeating the organization.
        */}
        <script
          type="application/ld+json"
          // The content is built in this file from typed constants — there is
          // no user input anywhere in it, and JSON.stringify handles escaping.
          dangerouslySetInnerHTML={{ __html: graph(organizationJsonLd(), websiteJsonLd()) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          <LocaleProvider>
          {/* A dead email link is thrown at the Site URL, which is the bare
              origin — so the page that has to notice is every page. */}
          <AuthErrorCatcher />
          <ThemeShell
            tickerLines={settings["ticker.lines"]}
            notice={settings["site.banner_notice"]}
          >
            {children}
          </ThemeShell>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
