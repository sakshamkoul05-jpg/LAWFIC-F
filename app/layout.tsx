import type { Metadata } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ThemeShell from "@/components/theme/ThemeShell";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
          <ThemeShell>{children}</ThemeShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
