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
      className={`shrink-0 grid-flow-col auto-cols-[34px] items-stretch 2xl:auto-cols-[58px] ${className}`}
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

/* THE COLUMN IS SET BY THE LONGEST LABEL, AND THE LABEL BY THE SEARCH BAR

   58px was the width at which "Suggestion" stopped truncating to "Suggest…",
   and a row of equal cells with one word cut off reads as a mistake rather
   than as a constraint. But seven cells at 58 is 406px — as much as the search
   bar itself had — and the search is the control this page is actually
   navigated with.

   The floor was measured rather than guessed: "Suggestion" sets it at 47px of
   text plus 4px of padding, so 54 is the narrowest a labelled cell goes and 48
   truncated it again. Seven of those is 378px — still the largest single item
   on the row after the search, and the search only had 505.

   WHICH IS WHY THE LABEL WAITS FOR ROOM

   The words are wanted and they are kept, but between 1280 and 1535 the row
   cannot pay for them and the search bar at the same time. So below 2xl each
   cell is the icon alone at 34px, and the label comes back at 2xl where there
   is width for both. That is 238px instead of 378, and the 140 goes straight
   into the search.

   Nothing is lost when the text is hidden. Every cell keeps the same word as
   its accessible name and its tooltip, so a screen reader reads "Suggestion"
   at every width and a pointer reveals it on hover — the label is invisible,
   not absent. */

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
    <span className="hidden w-full truncate text-center leading-none 2xl:block 2xl:text-[9.5px]">
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
