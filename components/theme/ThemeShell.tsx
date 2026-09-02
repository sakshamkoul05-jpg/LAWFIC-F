"use client";

import SiteHeader from "@/components/site/SiteHeader";
import Footer from "@/components/site/Footer";

/**
 * Client-side shell: one header bar, the page, the footer.
 *
 * The 21-tab category strip that used to sit under the header is gone — see
 * lib/nav.ts for what replaced it and why.
 */
export default function ThemeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
