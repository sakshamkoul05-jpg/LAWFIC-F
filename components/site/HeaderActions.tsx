"use client";

import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The action row, in the blueprint's order: help, store, theme, my money,
 * post ad, suggestion, wishlist, favourites, my bag.
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
    /* A bookmark, not a second heart. Wishlist and Favourites sit next to each
       other, so they cannot share a shape — two hearts in a row would be two
       controls a customer has to click to tell apart. A bookmark reads as
       "put this aside", which is what a wishlist is. */
    label: "Wishlist",
    href: "/wishlist",
    icon: <path d="M5.5 3.5h9v13l-4.5-3.2-4.5 3.2z" />,
  },
  {
    /* The heart the client asked for, and it is filled rather than outlined:
       every other glyph on this row is line art, so a solid one is the one
       thing the eye finds without reading the label. */
    label: "Favourite",
    href: "/wishlist?view=favourites",
    icon: (
      <path
        d="M10 16.5c-.3 0-5.9-3.5-7.1-6.6a4 4 0 0 1 7.1-3.6 4 4 0 0 1 7.1 3.6c-1.2 3.1-6.8 6.6-7.1 6.6Z"
        fill="currentColor"
        stroke="none"
      />
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
      className={`shrink-0 grid-flow-col auto-cols-[54px] items-stretch 2xl:auto-cols-[58px] ${className}`}
    >
      {ACTIONS.slice(0, 2).map((a) => (
        <ActionLink key={a.label} action={a} />
      ))}

      {/* The theme switch, in the same cell as everything else. */}
      <Cell title={tx("Theme")}>
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

/* THE COLUMN IS SET BY THE LONGEST LABEL

   "Suggestion" is the longest, and it measures 47px of text plus 4px of cell
   padding — so 54 is the narrowest a labelled cell goes. That floor was found
   by measuring rather than guessing, after 48 truncated it to "Suggest…" and a
   row of equal cells with one word cut off read as a mistake rather than as a
   constraint.

   THE LABEL NO LONGER WAITS FOR ROOM

   It used to. While this strip shared the main header row, nine labelled cells
   and a usable search bar could not both fit — nine at 54 is 486px, and with
   the mark, the location box, the language chip and the account corner also on
   that row, about 360 pixels were left for the search. So the words were hidden
   below 2xl and came back only on a wide monitor.

   That was the wrong trade to keep making. The labels exist because half of
   these icons have no settled pictogram anywhere — there is no glyph that reads
   as "post an ad" — and an icon nobody can identify is not fixed by being
   readable only on a large screen.

   The strip has its own row now, so the constraint is gone: every word shows at
   every width, and the search bar above it got the 486px back.

   The aria-label and the tooltip stay on every cell regardless. They are what
   kept these usable while the words were hidden, and they cost nothing now that
   the words are back. */

/** The shell every action shares: fixed column, icon box, one label line. */
function Cell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="flex h-full flex-col items-center justify-start gap-[5px] rounded-lg px-0.5 py-1.5 transition-colors hover:bg-surface-2"
    >
      {children}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block w-full truncate text-center text-[9px] leading-none 2xl:text-[9.5px]">
      {children}
    </span>
  );
}

function ActionLink({ action }: { action: Action }) {
  const { tx } = useLocale();
  const label = tx(action.label);

  return (
    <Link
      href={action.href}
      /* The name and the tooltip carry the word at every width, so hiding the
         printed label below 2xl costs neither a screen reader nor a pointer. */
      aria-label={label}
      title={label}
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
      <Label>{label}</Label>
    </Link>
  );
}
