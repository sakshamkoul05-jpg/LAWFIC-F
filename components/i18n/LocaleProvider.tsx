"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_KEY,
  isLocale,
  translate,
  translatePhrase,
  type LocaleCode,
} from "@/lib/i18n";

/**
 * Which language the chrome is in.
 *
 * The choice is read from storage AFTER mount, never during render. The server
 * has no way to know what someone picked, so rendering their language on the
 * first pass would mean the markup the server sent and the markup React expects
 * disagree — a hydration mismatch, and on this site it would be one on every
 * page. Everyone gets English for a frame and then their own language, which is
 * the correct trade: a flash is recoverable, a mismatched tree is not.
 *
 * The choice also goes to a cookie so a future server-rendered translation can
 * read it without a round trip. Nothing reads that cookie yet; it costs one
 * line now and saves a migration later.
 */

type Ctx = {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  /** Keyed lookup, for the chrome strings that were given ids. */
  t: (key: string, fallback?: string) => string;
  /** Lookup by the English text itself, for everything else. See lib/i18n.ts. */
  tx: (english: string) => string;
};

const LocaleContext = createContext<Ctx>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, fallback) => translate(DEFAULT_LOCALE, key, fallback),
  tx: (english) => english,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCALE_KEY);
      if (isLocale(saved)) setLocaleState(saved);
    } catch {
      /* Private windows and blocked site data both throw here. A language
         preference is not worth breaking the page over. */
    }
  }, []);

  /* Assistive technology and the browser's own translation prompt both key off
     the lang attribute, so it has to follow the choice. */
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_KEY, next);
      document.cookie = `${LOCALE_KEY}=${next};path=/;max-age=31536000;samesite=lax`;
    } catch {
      /* Same as above — the switch still works for this visit. */
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => translate(locale, key, fallback),
    [locale],
  );

  const tx = useCallback((english: string) => translatePhrase(locale, english), [locale]);

  /* Memoised on the locale rather than rebuilt every render. Without this every
     consumer of the context re-renders on any parent render, and the consumers
     here are the header, the tab bar and every section of the home page. */
  const value = useMemo(() => ({ locale, setLocale, t, tx }), [locale, setLocale, t, tx]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Ctx {
  return useContext(LocaleContext);
}
