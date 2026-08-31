"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

/**
 * Client-side shell that renders the correct header/footer based on theme.
 * Modern theme: original Header + Footer
 * Classic theme: ClassicHomePage handles its own header + nav + content, so we only render Footer
 */
export default function ThemeShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <>
      {theme === "modern" && <Header />}
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
