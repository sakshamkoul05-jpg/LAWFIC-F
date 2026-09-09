"use client";

import Link from "next/link";
import { useState } from "react";
import { TABS_ROW_ONE, TABS_ROW_TWO, type NavTab } from "@/lib/nav-tabs";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The drawer: every section, in the blueprint's order, each one opening to show
 * its services.
 *
 * A FLAT LIST WITH ACCORDIONS, NOT A THREE-PANE DRILL-DOWN
 *
 * The previous version grouped the twenty-seven into four columns and made the
 * reader pick a group before they could see any section at all. That was a
 * misreading: the four colours belong to the hamburger ICON, and the drawer is
 * meant to list the sections themselves with an arrow on each. This version
 * does that — all twenty-seven visible in one scroll, and the arrow beside any
 * of them opens its sub-tabs underneath without moving anything else.
 *
 * ONLY ONE OPEN AT A TIME
 *
 * Document alone carries dozens of services. Allowing several open together
 * means the row you were reading slides off the screen the moment you open
 * another, and the list stops being a list. Opening one closes the last, so the
 * drawer is always about as long as it looks.
 *
 * The section name is a LINK and the arrow is a BUTTON, side by side. Making
 * the whole row do both is the common mistake: a reader who wants the section
 * page gets an accordion instead, and there is then no way to reach the page at
 * all without hunting for it inside the list that just opened.
 */

export default function MegaMenu({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
      <Group label="Sections" tabs={TABS_ROW_ONE} openId={openId} setOpenId={setOpenId} onNavigate={onNavigate} t={t} />
      <Group label="More" tabs={TABS_ROW_TWO} openId={openId} setOpenId={setOpenId} onNavigate={onNavigate} t={t} />
    </div>
  );
}

function Group({
  label,
  tabs,
  openId,
  setOpenId,
  onNavigate,
  t,
}: {
  label: string;
  tabs: NavTab[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onNavigate: () => void;
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <section className="mb-2">
      <p className="type-label px-1.5 pb-1.5 pt-2 text-subtle">{label}</p>
      <div className="grid gap-0.5">
        {tabs.map((tab) => {
          const open = tab.id === openId;
          return (
            <div key={tab.id}>
              <div className="flex items-stretch gap-1">
                <Link
                  href={tab.href}
                  onClick={onNavigate}
                  className="min-w-0 flex-1 truncate rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  {t(`tab.${tab.id}`, tab.label)}
                </Link>

                {tab.sub.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : tab.id)}
                    aria-expanded={open}
                    aria-label={`${open ? "Hide" : "Show"} services under ${tab.label}`}
                    className="grid w-9 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden
                      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    >
                      <path
                        d="M2.5 4.5 6 8l3.5-3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {open && (
                <div className="mb-1 ml-2.5 grid gap-0.5 border-l border-border pl-2.5">
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
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
