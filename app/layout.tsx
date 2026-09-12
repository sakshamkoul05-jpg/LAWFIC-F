import type { Metadata } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ThemeShell from "@/components/theme/ThemeShell";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import AuthErrorCatcher from "@/components/site/AuthErrorCatcher";
import { createClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings";

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

export const metadata: Metadata = {
  title: {
    default: "LAWFIC — Registrations, licences and compliance",
    template: "%s · LAWFIC",
  },
  description:
    "Udyam, GST, PAN and FSSAI registrations handled end to end. Transparent fees, a prepaid wallet, and a jobs feed matched to your profile.",
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
