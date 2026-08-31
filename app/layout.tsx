import type { Metadata } from "next";
import { Overpass_Mono } from "next/font/google";
import "./globals.css";
import ThemeShell from "@/components/theme/ThemeShell";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const overpassMono = Overpass_Mono({
  variable: "--font-overpass-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${overpassMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
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
