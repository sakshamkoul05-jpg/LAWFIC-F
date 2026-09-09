"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { classicTabs, type NavTab } from "@/lib/nav-tabs";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * "All of LAWFIC at a glance" — the hamburger drawer, as the client set it out:
 * four coloured lines, and choosing one fills the line below it with that
 * group's sections, and choosing one of THOSE fills the side line with its
 * services.
 *
 * WHY THREE PANES AND NOT ONE LONG LIST
 *
 * Twenty-seven sections carrying a few hundred services between them is far
 * past what a single list can present. A flat drawer of that size is a
 * scrollbar with words in it: a reader who does not already know the name of
 * what they want cannot find it, which is precisely the person a menu is for.
 * Narrowing four → several → many means every step is a short list, and the
 * two choices already made stay on screen as the path taken.
 *
 * THE FOUR COLOURS ARE THE ONLY COLOUR HERE
 *
 * They mark the top level and nothing else. The site had an accent per section
 * — twenty-seven of them — and at that count colour stops being a signal and
 * becomes decoration. Four is few enough to learn, and because the choice stays
 * lit down the left, the colour also tells you where you are once you are three
 * panes deep.
 *
 * Opening on hover as well as click matters at the second level: a pointer user
 * should be able to sweep the groups and see what is in them without
 * committing, while a keyboard or touch user still gets everything from clicks
 * alone.
 */

type Line = {
  id: string;
  label: string;
  colour: string;
  /** Tab ids, in the order the blueprint lists them. */
  tabs: string[];
};

/* The four lines group the client's own twenty-seven tabs. Nothing is invented
   and nothing is left out — every tab appears in exactly one line, which is
   what makes this a map of the site rather than a curated shortlist. */
const LINES: Line[] = [
  {
    id: "documents",
    label: "Documents & filings",
    colour: "#C58F6B",
    tabs: ["document", "admission", "education", "travel"],
  },
  {
    id: "business",
    label: "Business & work",
    colour: "#7FA8A0",
    tabs: ["startup", "business", "jobs", "professionalism", "branding", "your-ad"],
  },
  {
    id: "money",
    label: "Money",
    colour: "#C9B87E",
    tabs: ["my-money", "investment", "our-store", "gift"],
  },
  {
    id: "lawfic",
    label: "LAWFIC & community",
    colour: "#8FA3C9",
    tabs: [
      "home",
      "about",
      "lawfic",
      "partner",
      "instant-help",
      "new-idea",
      "career",
      "entertainment",
      "aakhri-umeed",
      "social",
      "press",
      "blogs",
      "lawfic-club",
    ],
  },
];

export default function MegaMenu({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useLocale();
  const [lineId, setLineId] = useState(LINES[0].id);
  const [tabId, setTabId] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const line = LINES.find((l) => l.id === lineId) ?? LINES[0];

  const tabs = useMemo(
    () =>
      line.tabs
        .map((id) => classicTabs.find((x) => x.id === id))
        .filter((x): x is NavTab => Boolean(x)),
    [line],
  );

  /* The section choice belongs to the line it was made in. Keeping it after a
     line change would leave the third pane showing services from a group the
     reader has just navigated away from. */
  useEffect(() => {
    setTabId(null);
    scroller.current?.scrollTo({ top: 0 });
  }, [lineId]);

  const tab = tabId ? tabs.find((x) => x.id === tabId) ?? null : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* LINE ONE — the four. */}
      <div className="shrink-0 border-b border-border p-2.5">
        <p className="type-label px-1.5 pb-2 text-subtle">All of LAWFIC</p>
        <div className="grid gap-1">
          {LINES.map((l) => {
            const on = l.id === lineId;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setLineId(l.id)}
                onMouseEnter={() => setLineId(l.id)}
                aria-pressed={on}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                  on ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* The line itself — the coloured rule the client describes. */}
                <span
                  aria-hidden
                  className="h-[3px] w-7 shrink-0 rounded-full transition-opacity"
                  style={{ background: l.colour, opacity: on ? 1 : 0.45 }}
                />
                <span className="truncate font-medium">{l.label}</span>
                <span className="ml-auto text-[11px] text-subtle">{l.tabs.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LINE TWO — that line's sections. */}
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-border p-2.5">
          <p className="type-label px-1.5 pb-2 text-subtle">{line.label}</p>
          <div className="grid gap-0.5">
            {tabs.map((x) => {
              const on = x.id === tabId;
              return (
                <div key={x.id} className="flex items-stretch gap-1">
                  <Link
                    href={x.href}
                    onClick={onNavigate}
                    className={`min-w-0 flex-1 truncate rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                      on
                        ? "bg-surface-2 text-foreground"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    {t(`tab.${x.id}`, x.label)}
                  </Link>
                  {x.sub.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTabId(on ? null : x.id)}
                      onMouseEnter={() => setTabId(x.id)}
                      aria-expanded={on}
                      aria-label={`Services under ${x.label}`}
                      className="grid w-8 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        aria-hidden
                        className={`transition-transform ${on ? "rotate-90" : ""}`}
                      >
                        <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* THE SIDE LINE — the chosen section's services. */}
        {tab && (
          <div className="p-2.5">
            <p className="type-label flex items-center gap-2 px-1.5 pb-2 text-subtle">
              <span
                aria-hidden
                className="h-[3px] w-4 shrink-0 rounded-full"
                style={{ background: line.colour }}
              />
              {t(`tab.${tab.id}`, tab.label)}
            </p>
            <div className="grid gap-0.5">
              {tab.sub.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={onNavigate}
                  className="truncate rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
