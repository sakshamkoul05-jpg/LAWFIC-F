"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ColorTheme = "light" | "dark";

type ThemeContextValue = {
  /** the classic brand theme is the only visual theme (no theme switching) */
  theme: "classic";
  /** resolved color mode: light or dark */
  color: ColorTheme;
  /** user had explicitly chosen, or null = follow system */
  override: ColorTheme | null;
  setColor: (c: ColorTheme | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "lawfic-color";

function getSystem(): ColorTheme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverride] = useState<ColorTheme | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setOverride(stored);
    }
    setMounted(true);
  }, []);

  // Watch system preference changes so auto-detect stays live.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (override === null) {
        document.documentElement.setAttribute("data-theme", getSystem());
      }
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [override]);

  const resolved: ColorTheme = override ?? getSystem();

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(STORAGE_KEY, override ?? "");
  }, [resolved, override, mounted]);

  const setColor = useCallback((c: ColorTheme | null) => {
    setOverride(c);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "classic", color: resolved, override, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: "classic", color: "light", override: null, setColor: () => {} };
  }
  return ctx;
}
