"use client";

import { ProfileProvider } from "@/components/profile/ProfileProvider";
import SiteHeader from "@/components/site/SiteHeader";
import ClassicCategoryTabs from "@/components/classic/ClassicCategoryTabs";
import Footer from "@/components/site/Footer";

/**
 * Client-side shell: the title bar, the 21-section strip, the page, the footer.
 *
 * The strip is the client's chosen information architecture — breadth exposed
 * up front. It is kept quiet (see ClassicCategoryTabs) so that density reads
 * as a directory rather than as noise.
 *
 * ProfileProvider wraps everything so any page can personalise itself without
 * fetching the profile again. It sits outside the header because the header
 * greets by name too.
 */
export default function ThemeShell({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <ClassicCategoryTabs />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ProfileProvider>
  );
}
