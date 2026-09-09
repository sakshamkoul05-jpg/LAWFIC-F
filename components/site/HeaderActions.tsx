"use client";

import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The action row, in the blueprint's order: help, store, theme, my money,
 * post ad, suggestion, my bag.
 *
 * ICON OVER LABEL, NOT ICON ALONE
 *
 * Seven icons in a row with no words is a puzzle. Half of these have no settled
 * pictogram anywhere — there is no universally-read glyph for "post an ad" or
 * "suggestion", and a customer should not have to hover seven things to find
 * the one they want. The label costs one line of small type and removes the
 * guessing, which on a row this wide is a trade worth making every time.
 *
 * EVERY CELL IS THE SAME CELL
 *
 * One fixed width, one icon box, one label line, at one type size — and the
 * theme switch is drawn INSIDE that shell rather than dropped in beside it.
 * It was a different component with its own padding and its own icon size, so
 * it sat a few pixels off every neighbour and pushed the two after it out of
 * step; seven items that are nearly aligned look worse than seven that are
 * obviously not, because the eye keeps trying to line them up. A grid with
 * equal columns removes the question.
 */

type Action = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const ACTIONS: Action[] = [
  {
    label: "Help",
    href: "/instant-help",
    icon: (
      <>
        <circle cx="10" cy="10" r="7.2" />
        <path d="M8.2 8a1.9 1.9 0 1 1 2.4 2.2c-.5.2-.6.5-.6 1M10 14.2v.2" />
      </>
    ),
  },
  {
    label: "Store",
    href: "/our-store",
    icon: <path d="M3.5 7.5h13l-1 8.5h-11zM7 7.5V6a3 3 0 0 1 6 0v1.5" />,
  },
  {
    label: "My money",
    href: "/wallet",
    icon: (
      <>
        <rect x="2.8" y="5.5" width="14.4" height="9.5" rx="2" />
        <path d="M2.8 8.5h14.4M13.5 12h1.4" />
      </>
    ),
  },
  {
    label: "Post ad",
    href: "/your-ad",
    icon: (
      <>
        <path d="M4 8.5v3a1 1 0 0 0 1 1h1.5L11 15.5v-11L6.5 7.5H5a1 1 0 0 0-1 1Z" />
        <path d="M13.5 8a3 3 0 0 1 0 4" />
      </>
    ),
  },
  {
    label: "Suggestion",
    href: "/contact",
    icon: (
      <>
        <path d="M3.5 5.5h13v8h-7l-3.5 3v-3h-2.5z" />
        <path d="M7 9.5h6M7 11.5h3.5" />
      </>
    ),
  },
  {
    label: "My bag",
    href: "/cart",
    icon: (
      <>
        <path d="M4.5 6.5h11l-1 9h-9z" />
        <path d="M7.5 6.5V5a2.5 2.5 0 0 1 5 0v1.5" />
      </>
    ),
  },
];

export default function HeaderActions({ className = "" }: { className?: string }) {
  const { tx } = useLocale();

  return (
    <div
      className={`shrink-0 grid-flow-col auto-cols-[58px] items-stretch ${className}`}
    >
      {ACTIONS.slice(0, 2).map((a) => (
        <ActionLink key={a.label} action={a} />
      ))}

      {/* The theme switch, in the same cell as everything else. */}
      <Cell>
        <span className="grid h-[22px] place-items-center [&_button]:!size-[22px] [&_button]:!rounded-md [&_button]:!border-0 [&_button]:!bg-transparent">
          <ThemeToggle />
        </span>
        <Label>{tx("Theme")}</Label>
      </Cell>

      {ACTIONS.slice(2).map((a) => (
        <ActionLink key={a.label} action={a} />
      ))}
    </div>
  );
}

/* 58px, because "Suggestion" is the longest label and at anything narrower it
   truncates to "Suggest…" — a row of equal cells with one word cut off reads
   as a mistake rather than as a constraint. The column width is set by the
   longest word, not by an average. */

/** The shell every action shares: fixed column, icon box, one label line. */
function Cell({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-full flex-col items-center justify-start gap-[5px] rounded-lg px-0.5 py-1.5 transition-colors hover:bg-surface-2">
      {children}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-full truncate text-center text-[9.5px] leading-none">{children}</span>
  );
}

function ActionLink({ action }: { action: Action }) {
  const { tx } = useLocale();

  return (
    <Link
      href={action.href}
      className="flex h-full flex-col items-center justify-start gap-[5px] rounded-lg px-0.5 py-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      <span className="grid h-[22px] place-items-center">
        <svg
          width="19"
          height="19"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {action.icon}
        </svg>
      </span>
      <Label>{tx(action.label)}</Label>
    </Link>
  );
}
