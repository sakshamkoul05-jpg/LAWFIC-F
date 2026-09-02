"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * Light / dark theme toggle. Follows system preference by default; clicking
 * cycles between light, dark, and back to system.
 *
 * The icon and label depend on the resolved theme, which the server cannot
 * know — it has no access to the visitor's stored choice or their OS setting.
 * Rendering either icon during SSR therefore guarantees a hydration mismatch
 * for half of all visitors, so the button renders a neutral placeholder until
 * it has mounted and the real theme is known.
 */
export default function ThemeToggle() {
  const { color, override, setColor } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cycle = () => {
    if (override === null) {
      setColor(color === "dark" ? "light" : "dark");
      return;
    }
    // go back to "system" when clicking the currently-active explicit choice
    setColor(null);
  };

  const dark = color === "dark";

  if (!mounted) {
    return (
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-full border border-border"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={override === null ? "Following system · click to override" : "Click to return to system"}
      className="grid size-8 place-items-center rounded-full border border-border text-muted transition-colors hover:border-primary hover:text-primary"
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8 1v1.5M8 13.5V15M2.3 2.3l1 1M12.7 12.7l1 1M1 8h1.5M13.5 8H15M2.3 13.7l1-1M12.7 3.3l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M13.5 9A5.5 5.5 0 0 1 7 2.5 5.5 5.5 0 1 0 13.5 9Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
