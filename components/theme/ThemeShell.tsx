"use client";

import Footer from "@/components/site/Footer";

/**
 * Client-side shell. The site now uses a single theme: the Classic homepage
 * manages its own header + nav + content inside `children`. We only render
 * the shared footer here.
 */
export default function ThemeShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
