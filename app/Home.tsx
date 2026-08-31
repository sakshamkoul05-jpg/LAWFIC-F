"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import ModernHomepage from "./ModernHomepage";
import ClassicHomePage from "@/components/classic/ClassicHomePage";

/**
 * Client-side wrapper that renders the correct homepage based on theme.
 */
export default function Home() {
  const { theme } = useTheme();

  if (theme === "classic") {
    return <ClassicHomePage />;
  }

  return <ModernHomepage />;
}
