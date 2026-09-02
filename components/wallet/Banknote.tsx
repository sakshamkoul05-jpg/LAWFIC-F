"use client";

import { getDenomination } from "@/lib/denominations";

/**
 * One stylised banknote.
 *
 * Read `lib/denominations.ts` before changing anything here. This draws a
 * denomination colour, the numeral, and a plain guilloché-ish line — and
 * nothing else, ever. No emblem, no portrait, no serial, no security thread,
 * no Devanagari panel. Every Indian note carries the Ashoka Lion Capital,
 * protected by the Emblems and Names (Prevention of Improper Use) Act 1950,
 * and IPC 489A–489E cover counterfeiting and the making of materials for it.
 * A slip that could be mistaken for currency is the one thing this must not
 * become.
 *
 * THE VALUE LIVES IN THE TOP THIRD, DELIBERATELY
 *
 * A note in a wallet is mostly hidden — only the strip above the fold shows.
 * A centred numeral therefore has to be dragged most of the way out of the
 * pocket to be read, which is why the wallet looked like it was wearing the
 * money rather than holding it. Keeping the denomination high means the note
 * can sit properly tucked in and still be countable, which is the whole point
 * of showing denominations instead of a total.
 */
export default function Banknote({
  value,
  width = 132,
  className = "",
  style,
}: {
  value: number;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const d = getDenomination(value);
  if (!d) return null;

  // Indian notes are roughly 2.2:1. Close enough to read as money.
  const height = Math.round(width / 2.2);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 100"
      className={className}
      style={style}
      role="img"
      aria-label={`₹${value} note`}
    >
      <rect x="0" y="0" width="220" height="100" rx="5" fill={d.paper} />
      <rect
        x="0"
        y="0"
        width="220"
        height="100"
        rx="5"
        fill="none"
        stroke={d.paperEdge}
        strokeWidth="6"
      />

      {/* The value, high on the note so a tucked-in note is still countable. */}
      <text
        x="110"
        y="28"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="22"
        fontWeight="600"
        fill={d.ink}
      >
        ₹{value}
      </text>

      {/* Plain waves, purely so the paper is not a flat rectangle. They carry
          no pattern from any real note. */}
      <path
        d="M8 64 Q55 52 110 64 T212 60"
        fill="none"
        stroke={d.paperEdge}
        strokeWidth="1.6"
        opacity="0.55"
      />
      <path
        d="M8 84 Q55 72 110 84 T212 80"
        fill="none"
        stroke={d.paperEdge}
        strokeWidth="1.6"
        opacity="0.4"
      />

      <text
        x="206"
        y="93"
        textAnchor="end"
        fontFamily="ui-monospace, monospace"
        fontSize="12"
        fill={d.ink}
        opacity="0.55"
      >
        {value}
      </text>
    </svg>
  );
}
