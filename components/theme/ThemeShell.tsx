"use client";

import { usePathname } from "next/navigation";
import { ProfileProvider } from "@/components/profile/ProfileProvider";
import AnnouncementTicker from "@/components/site/AnnouncementTicker";
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
/**
 * `tickerLines` and `notice` come from site_settings, read once in the root
 * layout and passed down. This component is `"use client"` — it reads the path
 * to decide whether the back office chrome applies — so it cannot read the
 * database itself, and fetching from here would put a round trip in front of
 * the first thing on every page.
 */
export default function ThemeShell({
  children,
  tickerLines,
  notice = "",
}: {
  children: React.ReactNode;
  tickerLines?: string[];
  notice?: string;
}) {
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
        {/* THE NOTICE SITS ABOVE EVERYTHING, INCLUDING THE STRIP.
            It is for the things that change what a visitor should do today —
            an outage, a closure, a deadline — so it outranks the standing
            claims below it. Empty renders nothing at all rather than an empty
            band. */}
        {notice.trim() && (
          <p
            role="status"
            className="bg-primary px-4 py-2 text-center text-[12.5px] font-medium text-background"
          >
            {notice}
          </p>
        )}

        {/* Above the logo, as the blueprint places it. */}
        <AnnouncementTicker lines={tickerLines} />
        <SiteHeader />
        <ClassicCategoryTabs />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ProfileProvider>
  );
}
