"use client";

import ClassicHeader from "@/components/classic/ClassicHeader";
import ClassicCategoryTabs from "@/components/classic/ClassicCategoryTabs";
import Footer from "@/components/site/Footer";

/**
 * Client-side shell. Renders the shared title bar (header), the 21-tab
 * navigation, the page content, and the footer — so navigation persists on
 * every page of the site.
 */
export default function ThemeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ClassicHeader />
      <ClassicCategoryTabs />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
