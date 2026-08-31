"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import ModernHomepage from "./ModernHomepage";
import PortalHomepage from "@/components/portal/PortalHomepage";

/**
 * Client-side wrapper that renders the correct homepage based on theme.
 */
export default function Home() {
  const { theme } = useTheme();

  if (theme === "portal") {
    return <PortalHomepage />;
  }

  return <ModernHomepage />;
}
