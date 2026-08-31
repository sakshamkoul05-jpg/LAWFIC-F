"use client";

import { createContext, useContext } from "react";

/**
 * The site now ships a single visual theme (Classic). This context is retained
 * as a thin compatibility shim so any existing imports of useTheme() keep working,
 * but there is no switching and no persistence.
 */
type ThemeContextValue = {
  theme: "classic";
  setTheme: (t: "classic") => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: "classic", setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "classic", setTheme: () => {} };
  return ctx;
}
