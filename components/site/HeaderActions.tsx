"use client";

import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";

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
 * The theme control is the odd one out: it is a switch rather than a
 * destination, so it keeps its own component and only borrows the layout.
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
  return (
    <div className={`flex shrink-0 items-stretch ${className}`}>
      {ACTIONS.slice(0, 2).map((a) => (
        <ActionLink key={a.label} action={a} />
      ))}

      {/* The theme switch sits where the blueprint puts it, third. */}
      <span className="flex min-w-[46px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition-colors hover:bg-surface-2">
        <ThemeToggle />
        <span className="text-[9.5px] leading-none text-muted-foreground">Theme</span>
      </span>

      {ACTIONS.slice(2).map((a) => (
        <ActionLink key={a.label} action={a} />
      ))}
    </div>
  );
}

function ActionLink({ action }: { action: Action }) {
  return (
    <Link
      href={action.href}
      className="flex min-w-[46px] flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
    >
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
      <span className="whitespace-nowrap text-[9.5px] leading-none">{action.label}</span>
    </Link>
  );
}
