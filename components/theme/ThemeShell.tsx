"use client";

import { usePathname } from "next/navigation";
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
 *
 * THE BACK OFFICE GETS NONE OF IT
 *
 * /admin is a different product for a different person. A staff member working
 * a queue has no use for twenty-one marketing sections, a cart, a leather
 * picker or a footer full of service links, and dressing an internal tool in a
 * shopfront makes it read as part of the shopfront — which is exactly how
 * someone ends up demoing the customer site and landing on a list of every
 * customer. It renders bare and brings its own chrome; see app/admin/layout.tsx.
 */
export default function ThemeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBackOffice = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isBackOffice) {
    return (
      <div className="flex min-h-screen flex-col bg-background">{children}</div>
    );
  }

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
