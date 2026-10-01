"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchSuggest } from "@/lib/search-index";
import { categories } from "@/lib/catalogue";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The home page's search band — "Search Engine Bar", item 3 of the client's
 * final running order.
 *
 * A black band with the headline in gold serif, cycling through the seven
 * lines the sheet numbers 1 to 7, and under it one long white search bar:
 * the category scope ("All Service"), the running prompt, a microphone, a
 * camera, the advanced-search lens and the gold Search button.
 *
 * WHAT EACH BUTTON REALLY DOES
 *
 *   mic     voice search with the browser's own speech recognition, where the
 *           browser has it (Chrome, Edge, Safari). Where it does not, the
 *           button is not drawn at all rather than drawn and dead.
 *   camera  search by photo needs an image model the site does not have, so it
 *           says "coming soon" on hover and does nothing else.
 *   lens    the full catalogue with every filter — /services.
 *   Search  the same ranked search as the header.
 */
const TAGLINES = [
  "Search Anything You Need — Only on Lawfic",
  "Every Legal Document, One Search — Only on Lawfic",
  "All Admissions, One Search — Only on Lawfic",
  "Your Complete Startup Resource, One Search — Only on Lawfic",
  "Complete Branding Guidance, One Search — Only on Lawfic",
  "Investment Ideas That Work, One Search — Only on Lawfic",
  "Your Secured Future, One Step Away — Only on Lawfic",
];

const PROMPT =
  "Anything You Think You Want, Then Search in Lawfic, 51000+ Services, 21000+ Professional Experts, 1000+ Connecting Stores* & many more.........";

type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export default function HomeSearchHero() {
  const router = useRouter();
  const { tx } = useLocale();
  const listId = useId();
  const [line, setLine] = useState(0);
  const [scope, setScope] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const box = useRef<HTMLDivElement>(null);

  /* The headline changes every four seconds — long enough to read a line of
     twelve words, short enough that all seven come round within half a
     minute. Reduced motion stops the cycle on the first line. */
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setLine((n) => (n + 1) % TAGLINES.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    setCanListen(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const hits = useMemo(() => searchSuggest(query, 8, scope || undefined), [query, scope]);
  useEffect(() => setCursor(-1), [query]);

  const search = (q: string) => {
    setOpen(false);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (scope) params.set("cat", scope);
    const qs = params.toString();
    router.push(qs ? `/services?${qs}` : "/services");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cursor >= 0 && hits[cursor]) {
      setOpen(false);
      router.push(hits[cursor].href);
      return;
    }
    search(query);
  };

  const listen = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-IN";
    r.interimResults = true;
    r.onresult = (e) => {
      const text = Array.from(e.results)
        .map((res) => res[0]?.transcript ?? "")
        .join(" ");
      setQuery(text);
      setOpen(true);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  const keys = (e: React.KeyboardEvent) => {
    if (!open || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c <= 0 ? hits.length - 1 : c - 1));
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <section aria-label={tx("Search LAWFIC")} className="home-search-band">
      <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-8 lg:py-10">
        {/* The headline. One line at a time, crossfading; the region is polite
            so a screen reader hears each new line without being interrupted. */}
        <h2 className="home-search-title" aria-live="polite">
          <span key={line} className="home-search-line">
            “{tx(TAGLINES[line]!)}”
          </span>
        </h2>

        <div ref={box} className="relative mx-auto mt-6 max-w-[1440px]">
          <form onSubmit={submit} role="search" className="home-search-bar">
            <label className="relative shrink-0">
              <span className="sr-only">{tx("Search in")}</span>
              <select value={scope} onChange={(e) => setScope(e.target.value)} className="home-search-scope">
                <option value="">{tx("All Service")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {tx(c.name)}
                  </option>
                ))}
              </select>
            </label>

            <span className="relative min-w-0 flex-1 self-stretch">
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => {
                  setFocused(true);
                  setOpen(true);
                }}
                onBlur={() => setFocused(false)}
                onKeyDown={keys}
                role="combobox"
                aria-expanded={open && hits.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-label={tx("Search services, documents and experts")}
                className="absolute inset-0 w-full bg-transparent px-5 text-[15px] text-black outline-none"
              />
              {/* The client's prompt is longer than any field, so it runs
                  rather than stopping mid-word. Gone the moment someone types. */}
              {!query && !focused && (
                <span aria-hidden className="marquee-clip pointer-events-none absolute inset-0 flex items-center px-5 text-[14.5px] text-neutral-700">
                  <span className="marquee-track">
                    <span className="pr-24">{tx(PROMPT)}</span>
                    <span className="pr-24">{tx(PROMPT)}</span>
                  </span>
                </span>
              )}
            </span>

            <span className="home-search-tools">
              {canListen && (
                <button type="button" onClick={listen} aria-pressed={listening} aria-label={tx(listening ? "Stop listening" : "Search by voice")} title={tx(listening ? "Listening… tap to stop" : "Search by voice")} className={`home-search-tool ${listening ? "is-live" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
                    <rect x="9" y="2.5" width="6" height="11.5" rx="3" fill="currentColor" stroke="none" />
                    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5M8.5 21h7" />
                  </svg>
                </button>
              )}
              <button type="button" aria-disabled="true" aria-label={tx("Search by photo — coming soon")} title={tx("Search by photo — coming soon")} className="home-search-tool is-soon">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M9 3.5 7.6 5.5H4.5A2.5 2.5 0 0 0 2 8v10a2.5 2.5 0 0 0 2.5 2.5h15A2.5 2.5 0 0 0 22 18V8a2.5 2.5 0 0 0-2.5-2.5h-3.1L15 3.5Zm3 4.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />
                </svg>
              </button>
              <button type="button" onClick={() => router.push("/services")} aria-label={tx("Advanced search — the full catalogue")} title={tx("Advanced search")} className="home-search-tool">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <circle cx="10" cy="10" r="7" />
                  <path d="m15.5 15.5 6 6M10 6.8v6.4M6.8 10h6.4" stroke="#E6A817" />
                </svg>
              </button>
            </span>

            <button type="submit" className="home-search-go">
              {tx("Search")}
            </button>
          </form>

          {open && hits.length > 0 && (
            <ul id={listId} role="listbox" className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-surface py-1.5 shadow-[0_22px_50px_-18px_rgba(0,0,0,0.6)]">
              {hits.map((hit, i) => (
                <li key={hit.id} role="option" aria-selected={i === cursor}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => {
                      setOpen(false);
                      router.push(hit.href);
                    }}
                    className={`flex w-full items-start gap-3 px-5 py-2.5 text-left transition-colors ${i === cursor ? "bg-surface-2" : ""}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-foreground">{tx(hit.label)}</span>
                      {hit.blurb && <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{tx(hit.blurb)}</span>}
                    </span>
                    <span className="mt-0.5 shrink-0 text-[10px] uppercase tracking-[0.12em] text-subtle">{hit.live ? tx(hit.kind) : tx("Soon")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
