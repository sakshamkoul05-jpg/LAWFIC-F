"use client";

import { devanagari, getDenomination, LARGEST_MM } from "@/lib/denominations";

/**
 * One Indian banknote.
 *
 * Read the header of `lib/denominations.ts` before changing anything here. The
 * short version: everything that makes a note *recognisable* is drawn, and
 * nothing that makes it *authentic*.
 *
 * Drawn, because it is what the eye actually uses to identify a note across a
 * room — the official colour of the series, the real milled size, the
 * denomination in both Latin and Devanagari, the guilloché rosette, the
 * intaglio border, the watermark window, the security-thread band, and the
 * bleed lines on the right edge.
 *
 * Never drawn: the Ashoka Lion Capital, the portrait, the Reserve Bank's name,
 * seal, legend or signature, a real-format serial, or microtext. Those are the
 * marks that would make this a facsimile rather than a picture of one, and the
 * emblem in particular is protected by statute whatever the context.
 *
 * SIZE IS PER DENOMINATION, NOT A CONSTANT
 *
 * Indian notes step in length by denomination and in height at ₹50. A ₹500 is
 * 150×66mm; a ₹10 is 123×63. Drawing them all at one ratio was the loudest
 * tell that the money was invented, so `width` here means "width of a ₹500"
 * and every smaller note is scaled off the real millimetres against it. Pass
 * one `width` for a whole stack and the stack sizes itself correctly.
 */
export default function Banknote({
  value,
  /** Rendered width of a ₹500. Smaller notes come out proportionally smaller. */
  width = 240,
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

  /* Four user units per millimetre: enough resolution for the guilloché
     without the numbers getting silly. */
  const U = 4;
  const w = d.widthMm * U;
  const h = d.heightMm * U;

  const px = (width * d.widthMm) / LARGEST_MM;
  const py = (px * d.heightMm) / d.widthMm;

  const rosette = `rose-${value}`;
  const guilloche = `guil-${value}`;

  return (
    <svg
      width={px}
      height={py}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      style={style}
      role="img"
      aria-label={`₹${value} note`}
    >
      <defs>
        {/* Fine cross-hatch standing in for security printing. A generic
            geometric fill — it copies no pattern from any real note. */}
        <pattern
          id={guilloche}
          width="9"
          height="9"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <path d="M0 0 V9" stroke={d.paperEdge} strokeWidth="0.7" opacity="0.34" />
          <path d="M4.5 0 V9" stroke={d.paperEdge} strokeWidth="0.35" opacity="0.2" />
        </pattern>

        <radialGradient id={rosette}>
          <stop offset="0%" stopColor={d.paperEdge} stopOpacity="0.5" />
          <stop offset="70%" stopColor={d.paperEdge} stopOpacity="0.16" />
          <stop offset="100%" stopColor={d.paperEdge} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Paper */}
      <rect x="0" y="0" width={w} height={h} rx="7" fill={d.paper} />
      <rect x="0" y="0" width={w} height={h} rx="7" fill={`url(#${guilloche})`} />

      {/* Security thread: a broken vertical band, left of centre as on the real
          note. No lettering in it — that is one of the things microtext does
          and one of the things this must not. */}
      <g opacity="0.42">
        {Array.from({ length: 9 }).map((_, i) => (
          <rect
            key={i}
            x={w * 0.335}
            y={Number((4 + (i * (h - 8)) / 9).toFixed(2))}
            width="3.2"
            height={Number(((h - 8) / 9 - 3.4).toFixed(2))}
            fill={d.ink}
          />
        ))}
      </g>

      {/* Watermark window: the pale oval a real note holds up to the light.
          Empty, deliberately — what sits in a real one is the portrait. */}
      <ellipse
        cx={w * 0.815}
        cy={h * 0.5}
        rx={w * 0.085}
        ry={h * 0.3}
        fill="#FFFFFF"
        opacity="0.3"
      />

      {/* A rosette in the position the portrait occupies. A radial burst rather
          than a face: it fills the space the eye expects to be busy without
          reproducing anything. */}
      <g transform={`translate(${w * 0.53} ${h * 0.5})`}>
        <circle r={h * 0.3} fill={`url(#${rosette})`} />
        {Array.from({ length: 20 }).map((_, i) => {
          const a = (i / 20) * Math.PI * 2;
          const r1 = h * 0.12;
          const r2 = h * 0.29;
          /* Rounded, and not for tidiness. React serialises these to strings on
             the server and sets them as raw floats on the client, and the two
             disagree in the last digit — "-24.76842136458718" against
             -24.768421364587184 — which is a hydration mismatch on every spoke
             of every note. Two decimals is far finer than a pixel here. */
          const r = (n: number) => Number(n.toFixed(2));
          return (
            <line
              key={i}
              x1={r(Math.cos(a) * r1)}
              y1={r(Math.sin(a) * r1)}
              x2={r(Math.cos(a) * r2)}
              y2={r(Math.sin(a) * r2)}
              stroke={d.ink}
              strokeWidth="0.55"
              opacity="0.3"
            />
          );
        })}
        <circle r={h * 0.115} fill="none" stroke={d.ink} strokeWidth="0.8" opacity="0.35" />
        <circle r={h * 0.075} fill="none" stroke={d.ink} strokeWidth="0.5" opacity="0.25" />
      </g>

      {/* Intaglio border, doubled the way a note's frame is */}
      <rect
        x="5"
        y="5"
        width={w - 10}
        height={h - 10}
        rx="4"
        fill="none"
        stroke={d.ink}
        strokeWidth="1.1"
        opacity="0.45"
      />
      <rect
        x="9"
        y="9"
        width={w - 18}
        height={h - 18}
        rx="3"
        fill="none"
        stroke={d.ink}
        strokeWidth="0.5"
        opacity="0.28"
      />

      {/* THE TOP BAND CARRIES THE IDENTITY.

          Both denomination panels sit in the top quarter, and that is a layout
          decision the wallet forces rather than a copy of the real note. Only
          the strip above the fold is ever visible in a wallet, so anything
          lower is decoration for the moment the note is in flight. Putting the
          value here is what lets the note tuck in deep enough to look held. */}
      <text
        x="17"
        y={h * 0.25}
        fontFamily="ui-monospace, monospace"
        fontSize={h * 0.2}
        fontWeight="700"
        fill={d.ink}
      >
        {value}
      </text>

      {/* Devanagari, the other end of the same band. Digits in another script
          are still digits — this reproduces no wording. */}
      <text
        x={w - 20}
        y={h * 0.25}
        textAnchor="end"
        fontSize={h * 0.18}
        fill={d.ink}
        opacity="0.8"
      >
        {devanagari(value)}
      </text>

      {/* The big numeral, right of the portrait position, as on the note. Sits
          below the fold line on purpose — it is what you see when the note
          flies in, not what you read off the stack. */}
      <text
        x={w - 22}
        y={h * 0.72}
        textAnchor="end"
        fontFamily="ui-monospace, monospace"
        fontSize={h * 0.34}
        fontWeight="700"
        fill={d.ink}
      >
        ₹{value}
      </text>

      {/* Bleed lines: raised bars that tell denominations apart by touch. Real,
          functional, and different per note — ₹500 five, ₹200 and ₹100 four,
          nothing below that. */}
      {Array.from({ length: d.bleedLines }).map((_, i) => (
        <rect
          key={i}
          x={w - 17 - i * 6}
          y={h * 0.38}
          width="2.6"
          height={h * 0.46}
          rx="1.3"
          fill={d.ink}
          opacity="0.5"
        />
      ))}

      {/* The edge, slightly darker as printed paper is */}
      <rect
        x="0.6"
        y="0.6"
        width={w - 1.2}
        height={h - 1.2}
        rx="7"
        fill="none"
        stroke={d.paperEdge}
        strokeWidth="1.2"
      />
    </svg>
  );
}
