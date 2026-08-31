"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalNavigation from "@/components/portal/PortalNavigation";

/**
 * Client-side shell that renders the correct header/footer based on theme.
 * Modern theme: original Header + Footer
 * Portal theme: PortalHeader + PortalNavigation + Footer
 */
export default function ThemeShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <>
      {theme === "portal" ? (
        <>
          <PortalHeader />
          <PortalNavigation />
        </>
      ) : (
        <Header />
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
