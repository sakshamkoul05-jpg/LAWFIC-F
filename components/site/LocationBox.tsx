"use client";

import { useEffect, useRef, useState } from "react";
import { REGIONS, REGION_KEY, getRegion } from "@/lib/states";
import { citiesFor } from "@/lib/cities";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * "Where am I filing" — HOM PA INS 6 in the client's blueprint, which shows
 * INDIA over "Dharamshala, Himachal Pradesh" beside the mark.
 *
 * WHAT IT IS FOR
 *
 * Not decoration and not an address. A great deal of Indian compliance is
 * administered by the state and the municipality rather than the centre —
 * Shops & Establishment is a state Act with its own fee and portal in every
 * state, Professional Tax exists in Maharashtra and Karnataka and not in Delhi,
 * trade licences are issued by the municipal body — so the answer changes what
 * a customer needs, what it costs and how long it takes. This is the "deliver
 * to" of a filings business.
 *
 * THE MOVING LINE
 *
 * The client asked for the text inside the box to run continuously rather than
 * sit still, reading "Pan India Best & Quality Service." It is a marquee, and
 * marquees have two failure modes that both had to be closed:
 *
 *   - it must PAUSE when the pointer is on it, because a line that keeps
 *     sliding while you are trying to read it is worse than a static one;
 *   - it must stop entirely under prefers-reduced-motion. Perpetual movement in
 *     the chrome is exactly what that setting exists to switch off, and a
 *     header is on every page.
 *
 * The chosen place — the answer — sits BELOW the box, which is the arrangement
 * in the sheet: the promise runs above, the fact sits under it.
 *
 * Stored on the device only. A state and a city are weak identifiers but
 * identifiers nonetheless, and there is no reason to send them anywhere.
 */

const CITY_KEY = "lawfic.city";

export default function LocationBox({ className = "" }: { className?: string }) {
  const { t, tx } = useLocale();
  const [code, setCode] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  /* Read after mount. The server cannot know what is in this browser, and
     rendering a stored choice on the first pass is a hydration mismatch. */
  useEffect(() => {
    try {
      setCode(window.localStorage.getItem(REGION_KEY));
      setCity(window.localStorage.getItem(CITY_KEY));
    } catch {
      /* Private windows and blocked storage both land here. */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const save = (nextCode: string | null, nextCity: string | null) => {
    setCode(nextCode);
    setCity(nextCity);
    try {
      if (nextCode) window.localStorage.setItem(REGION_KEY, nextCode);
      else window.localStorage.removeItem(REGION_KEY);
      if (nextCity) window.localStorage.setItem(CITY_KEY, nextCity);
      else window.localStorage.removeItem(CITY_KEY);
    } catch {
      /* As above. */
    }
  };

  const region = getRegion(code);
  const cities = citiesFor(code);

  /* The answer, in the sheet's own order: city first, then state.
     Empty when nothing has been chosen — an "All India" placeholder is a line
     of text that says nothing, and the row below the box should either carry a
     fact or carry nothing at all. */
  const chosen = region ? [city, region.name].filter(Boolean).join(", ") : "";

  return (
    <div ref={box} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        /* 140, not the 168 it was and not the 124 it briefly became. The
             search bar wanted the difference, but the second line is a marquee
             and a marquee needs enough width to read as a sentence going past
             rather than as three words in a slot — at 124 it showed about half
             a phrase at any instant. */
        className="flex w-[128px] flex-col items-start gap-0.5 rounded-xl border border-border px-2 py-1.5 text-left transition-colors hover:border-border-3 2xl:w-[160px]"
      >
        <span className="flex w-full items-center gap-1.5">
          <PinIcon />
          {/* The flag is an emoji, not an image: it needs no request, it scales
              with the text, and it is the country's own glyph rather than a
              picture of it. */}
          <span aria-hidden className="text-[13px] leading-none">
            🇮🇳
          </span>
          <span className="type-label text-subtle">{tx("India")}</span>
          <Chevron open={open} />
        </span>

        {/* The promise, running. */}
        <span className="marquee-clip w-full">
          <span className="marquee-track text-[10.5px] font-medium text-primary">
            <span className="pr-8">{tx("Pan India Best & Quality Service.")}</span>
            {/* A second copy, so the loop has no gap to jump across. */}
            <span aria-hidden className="pr-8">
              {tx("Pan India Best & Quality Service.")}
            </span>
          </span>
        </span>
      </button>

      {/* The answer, below the box — and nothing at all until there is one. */}
      {chosen && (
        <p className="mt-0.5 truncate px-2.5 text-[11.5px] font-medium text-foreground" title={chosen}>
          {chosen}
        </p>
      )}

      {open && (
        <div
          role="dialog"
          aria-label={t("nav.chooseState", "Choose your state")}
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-[300px] rounded-xl border border-border bg-surface p-3 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.35)]"
        >
          <label className="type-label block text-subtle" htmlFor="loc-state">
            State
          </label>
          <select
            id="loc-state"
            value={code ?? ""}
            onChange={(e) => {
              const next = e.target.value || null;
              /* The city belongs to the old state, so it cannot survive the
                 change — leaving "Pune" under Kerala is worse than empty. */
              save(next, null);
            }}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary/60"
          >
            <option value="">All India</option>
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>

          <label className="type-label mt-3 block text-subtle" htmlFor="loc-city">
            City
          </label>
          <select
            id="loc-city"
            value={city ?? ""}
            disabled={cities.length === 0}
            onChange={(e) => save(code, e.target.value || null)}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary/60 disabled:opacity-40"
          >
            <option value="">{tx(cities.length ? "Any city" : "Choose a state first")}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <p className="mt-3 text-[11px] leading-relaxed text-subtle">
            Kept on this device. It changes what we show you, not who you are —
            it is not sent anywhere.
          </p>
        </div>
      )}
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-primary">
      <path
        d="M8 14.5s5-4.2 5-8a5 5 0 1 0-10 0c0 3.8 5 8 5 8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.4" r="1.7" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className={`ml-auto shrink-0 text-subtle transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
