"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, type LocaleCode } from "@/lib/i18n";
import { REGIONS, REGION_KEY, getRegion } from "@/lib/states";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The two small chrome controls: language, and which state you file in.
 *
 * Both are the same shape — a quiet button that opens a short list — so they
 * are written once here rather than twice in slightly different ways.
 *
 * Neither is decoration. The language control is documented in lib/i18n.ts;
 * the state control is documented in lib/states.ts, and the short version is
 * that Shops & Establishment, Professional Tax, trade licences, stamp duty and
 * GST registration are all administered per state, so the answer changes what a
 * customer needs and what it costs.
 */

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, close]);
  return ref;
}

const chip =
  "flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-border-3 hover:text-foreground";

const panel =
  "absolute right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.5)]";

function Caret() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function LanguageMenu() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.language")}
        className={chip}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
          <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M2.8 10h14.4M10 2.8c1.9 2 2.9 4.5 2.9 7.2s-1 5.2-2.9 7.2c-1.9-2-2.9-4.5-2.9-7.2S8.1 4.8 10 2.8Z"
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
        <span className="hidden sm:inline">{current.native}</span>
        <Caret />
      </button>

      {open && (
        <div role="menu" className={`${panel} w-44`}>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={l.code === locale}
              onClick={() => {
                setLocale(l.code as LocaleCode);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-[13px] transition-colors hover:bg-surface-2 ${
                l.code === locale ? "text-primary" : "text-foreground"
              }`}
            >
              <span>{l.native}</span>
              <span className="text-[11px] text-subtle">{l.english}</span>
            </button>
          ))}
          {/* Said plainly rather than discovered. A language control that turns
              out to move only the menus is a small betrayal if it was implied
              to do more. */}
          <p className="border-t border-border px-4 pb-1 pt-2 text-[10.5px] leading-relaxed text-subtle">
            Menus and controls only. Guidance stays in English until a translator
            has checked it.
          </p>
        </div>
      )}
    </div>
  );
}

export function FilingStateMenu() {
  const { t } = useLocale();
  const [code, setCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useDismiss(open, () => setOpen(false));

  useEffect(() => {
    try {
      setCode(window.localStorage.getItem(REGION_KEY));
    } catch {
      /* Blocked site data. The control still works for this visit. */
    }
  }, []);

  const choose = (next: string | null) => {
    setCode(next);
    setOpen(false);
    setFilter("");
    try {
      if (next) window.localStorage.setItem(REGION_KEY, next);
      else window.localStorage.removeItem(REGION_KEY);
    } catch {
      /* As above. */
    }
  };

  const region = getRegion(code);
  const shown = filter
    ? REGIONS.filter((r) => r.name.toLowerCase().includes(filter.toLowerCase()))
    : REGIONS;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${chip} max-w-[9.5rem]`}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M10 17.5s5.5-4.6 5.5-9a5.5 5.5 0 1 0-11 0c0 4.4 5.5 9 5.5 9Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="8.4" r="1.9" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <span className="flex min-w-0 flex-col items-start leading-none">
          <span className="hidden text-[9px] uppercase tracking-[0.1em] text-subtle sm:block">
            {t("nav.filingIn")}
          </span>
          <span className="mt-0.5 hidden max-w-[7.5rem] truncate text-[12px] text-foreground sm:block">
            {region?.name ?? t("nav.allIndia")}
          </span>
        </span>
        <Caret />
      </button>

      {open && (
        <div role="menu" className={`${panel} max-h-[60vh] w-64 overflow-y-auto`}>
          <div className="px-3 pb-2 pt-1">
            <input
              type="text"
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t("nav.chooseState")}
              aria-label={t("nav.chooseState")}
              className="w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary/50"
            />
          </div>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={!code}
            onClick={() => choose(null)}
            className={`block w-full px-4 py-2 text-left text-[13px] transition-colors hover:bg-surface-2 ${
              !code ? "text-primary" : "text-foreground"
            }`}
          >
            {t("nav.allIndia")}
          </button>

          {shown.map((r) => (
            <button
              key={r.code}
              type="button"
              role="menuitemradio"
              aria-checked={r.code === code}
              onClick={() => choose(r.code)}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-[13px] transition-colors hover:bg-surface-2 ${
                r.code === code ? "text-primary" : "text-foreground"
              }`}
            >
              <span className="truncate">{r.name}</span>
              {r.union && (
                <span className="ml-2 shrink-0 text-[10px] uppercase tracking-[0.1em] text-subtle">
                  UT
                </span>
              )}
            </button>
          ))}

          {shown.length === 0 && (
            <p className="px-4 py-3 text-[12.5px] text-subtle">No state matches that.</p>
          )}
        </div>
      )}
    </div>
  );
}
