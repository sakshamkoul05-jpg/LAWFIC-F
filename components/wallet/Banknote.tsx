"use client";

import { useId } from "react";
import { devanagari, getDenomination, LARGEST_MM } from "@/lib/denominations";

/**
 * One Indian banknote.
 *
 * WHERE THE LINE IS, AND WHY IT DOES NOT MOVE
 *
 * Drawn: the official colour of the series, the real milled size, the
 * denomination in Latin and Devanagari, guilloché, an intaglio border, the
 * watermark window, the security-thread band, the bleed lines, paper fibre and
 * the crease a note picks up from living folded in a wallet.
 *
 * NOT drawn, ever: the Ashoka Lion Capital, the portrait of Mahatma Gandhi, and
 * the words "Reserve Bank of India" or "भारतीय रिज़र्व बैंक". The emblem is
 * protected by the Emblems and Names (Prevention of Improper Use) Act 1950
 * whatever the context, and those three elements together are precisely what
 * turn a picture of money into a facsimile of it. IPC 489A–489E cover
 * counterfeiting and the making of materials for it.
 *
 * That line has been asked about more than once. It is not a matter of taste
 * and it is not a placeholder waiting to be upgraded: everything that makes a
 * note RECOGNISABLE is here, and nothing that would make it AUTHENTIC is. If a
 * future change adds an emblem, a portrait or the issuer's name, it is not an
 * improvement to this file, it is a different and much worse kind of object.
 *
 * WHAT MAKES IT READ AS PAPER RATHER THAN A COLOURED RECTANGLE
 *
 * Four things, none of which is colour: fibre in the stock, a crease down the
 * middle from being folded, ink that sits at different weights across the note,
 * and a warm edge where the paper has handled. A flat fill with a numeral on it
 * reads as a card no matter how accurate the hue is — which is exactly what the
 * first several versions of this were.
 *
 * SIZE IS PER DENOMINATION
 *
 * Indian notes step in length by denomination and in height at ₹50. A ₹500 is
 * 150×66mm; a ₹10 is 123×63. `width` means "width of a ₹500" and every smaller
 * note is scaled off the real millimetres against it, so passing one width for
 * a whole stack sizes the stack correctly.
 */
export default function Banknote({
  value,
  width = 240,
  className = "",
  style,
}: {
  value: number;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const uid = useId().replace(/:/g, "");
  const d = getDenomination(value);
  if (!d) return null;

  const U = 4;
  const w = d.widthMm * U;
  const h = d.heightMm * U;

  const px = (width * d.widthMm) / LARGEST_MM;
  const py = (px * d.heightMm) / d.widthMm;

  const fibre = `fib-${uid}`;
  const guilloche = `gui-${uid}`;
  const rosette = `ros-${uid}`;
  const crease = `crs-${uid}`;
  const edgeWear = `wear-${uid}`;

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
        {/* Paper tooth. Currency stock is cotton rag and it shows — this is the
            single thing that stops the note reading as printed plastic. */}
        <filter id={fibre} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="5" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.13 0"
            result="grain"
          />
          <feComposite in="grain" in2="SourceAlpha" operator="in" />
        </filter>

        <pattern
          id={guilloche}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(32)"
        >
          <path d="M0 0 V8" stroke={d.paperEdge} strokeWidth="0.6" opacity="0.32" />
          <path d="M4 0 V8" stroke={d.paperEdge} strokeWidth="0.3" opacity="0.18" />
        </pattern>

        <radialGradient id={rosette}>
          <stop offset="0%" stopColor={d.paperEdge} stopOpacity="0.55" />
          <stop offset="68%" stopColor={d.paperEdge} stopOpacity="0.15" />
          <stop offset="100%" stopColor={d.paperEdge} stopOpacity="0" />
        </radialGradient>

        {/* A note that lives in a wallet is a folded note. */}
        <linearGradient id={crease} x1="0" y1="0" x2="1" y2="0">
          <stop offset="44%" stopColor="#000" stopOpacity="0" />
          <stop offset="49.5%" stopColor="#000" stopOpacity="0.2" />
          <stop offset="50.5%" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="56%" stopColor="#000" stopOpacity="0" />
        </linearGradient>

        {/* Handled paper darkens at the edges before anywhere else. */}
        <linearGradient id={edgeWear} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.16" />
          <stop offset="14%" stopColor="#000" stopOpacity="0" />
          <stop offset="86%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={w} height={h} rx="6" fill={d.paper} />
      <rect x="0" y="0" width={w} height={h} rx="6" fill={`url(#${guilloche})`} />

      {/* The tonal band down the left, which every note in the series carries */}
      <rect x="0" y="0" width={w * 0.2} height={h} rx="6" fill={d.paperEdge} opacity="0.24" />
      <rect x={w * 0.2 - 1.5} y="6" width="1.5" height={h - 12} fill={d.ink} opacity="0.2" />

      {/* Security thread: a broken band, left of centre. No lettering in it. */}
      <g opacity="0.4">
        {Array.from({ length: 9 }).map((_, i) => (
          <rect
            key={i}
            x={w * 0.33}
            y={Number((5 + (i * (h - 10)) / 9).toFixed(2))}
            width="2.8"
            height={Number(((h - 10) / 9 - 3.6).toFixed(2))}
            fill={d.ink}
          />
        ))}
      </g>

      {/* Watermark window — empty, because what fills a real one is the portrait */}
      <ellipse cx={w * 0.83} cy={h * 0.52} rx={w * 0.08} ry={h * 0.29} fill="#FFF" opacity="0.28" />

      {/* A rosette where the portrait sits: a radial burst, not a face. */}
      <g transform={`translate(${w * 0.54} ${h * 0.52})`}>
        <circle r={h * 0.3} fill={`url(#${rosette})`} />
        {Array.from({ length: 22 }).map((_, i) => {
          const a = (i / 22) * Math.PI * 2;
          const r = (n: number) => Number(n.toFixed(2));
          return (
            <line
              key={i}
              x1={r(Math.cos(a) * h * 0.11)}
              y1={r(Math.sin(a) * h * 0.11)}
              x2={r(Math.cos(a) * h * 0.28)}
              y2={r(Math.sin(a) * h * 0.28)}
              stroke={d.ink}
              strokeWidth="0.5"
              opacity="0.28"
            />
          );
        })}
        <circle r={h * 0.11} fill="none" stroke={d.ink} strokeWidth="0.7" opacity="0.32" />
      </g>

      {/* Intaglio frame */}
      <rect
        x="4.5"
        y="4.5"
        width={w - 9}
        height={h - 9}
        rx="4"
        fill="none"
        stroke={d.ink}
        strokeWidth="1"
        opacity="0.42"
      />
      <rect
        x="8.5"
        y="8.5"
        width={w - 17}
        height={h - 17}
        rx="3"
        fill="none"
        stroke={d.ink}
        strokeWidth="0.45"
        opacity="0.24"
      />

      {/* THE TOP BAND CARRIES THE IDENTITY. Only the strip above the leather is
          ever visible in a wallet, so both denomination panels live up here. */}
      <text
        x="14"
        y={h * 0.26}
        fontFamily="ui-monospace, monospace"
        fontSize={h * 0.21}
        fontWeight="700"
        fill={d.ink}
      >
        ₹{value}
      </text>
      <text
        x={w - 16}
        y={h * 0.26}
        textAnchor="end"
        fontSize={h * 0.19}
        fill={d.ink}
        opacity="0.82"
      >
        {devanagari(value)}
      </text>

      {/* The big numeral, below the fold line — what you see in flight. */}
      <text
        x={w - 20}
        y={h * 0.76}
        textAnchor="end"
        fontFamily="ui-monospace, monospace"
        fontSize={h * 0.3}
        fontWeight="700"
        fill={d.ink}
        opacity="0.9"
      >
        ₹{value}
      </text>

      {/* Bleed lines: raised bars telling denominations apart by touch. Real,
          functional, and different per note. */}
      {Array.from({ length: d.bleedLines }).map((_, i) => (
        <rect
          key={i}
          x={w - 15 - i * 5.5}
          y={h * 0.4}
          width="2.4"
          height={h * 0.44}
          rx="1.2"
          fill={d.ink}
          opacity="0.45"
        />
      ))}

      {/* Fibre, crease and wear, over everything — they are properties of the
          paper, not of the printing. */}
      <rect x="0" y="0" width={w} height={h} rx="6" filter={`url(#${fibre})`} />
      <rect x="0" y="0" width={w} height={h} rx="6" fill={`url(#${crease})`} />
      <rect x="0" y="0" width={w} height={h} rx="6" fill={`url(#${edgeWear})`} />
      <rect
        x="0.5"
        y="0.5"
        width={w - 1}
        height={h - 1}
        rx="6"
        fill="none"
        stroke={d.paperEdge}
        strokeWidth="1"
      />
    </svg>
  );
}
