"use client";

import SiteHeader from "@/components/site/SiteHeader";
import ClassicCategoryTabs from "@/components/classic/ClassicCategoryTabs";
import Footer from "@/components/site/Footer";

/**
 * Client-side shell: the title bar, the 21-section strip, the page, the footer.
 *
 * The strip is the client's chosen information architecture — breadth exposed
 * up front. It is kept quiet (see ClassicCategoryTabs) so that density reads
 * as a directory rather than as noise.
 */
export default function ThemeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <ClassicCategoryTabs />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
