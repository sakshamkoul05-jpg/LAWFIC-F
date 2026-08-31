"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 rounded border border-border bg-surface-2 p-0.5">
      <button
        type="button"
        onClick={() => setTheme("modern")}
        className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
          theme === "modern"
            ? "bg-primary text-white"
            : "text-muted hover:text-foreground"
        }`}
      >
        ◐ Modern
      </button>
      <button
        type="button"
        onClick={() => setTheme("portal")}
        className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
          theme === "portal"
            ? "bg-primary text-white"
            : "text-muted hover:text-foreground"
        }`}
      >
        ▦ Portal
      </button>
    </div>
  );
}
