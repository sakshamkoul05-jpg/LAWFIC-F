"use client";

import { useMemo } from "react";

/**
 * A generated avatar, drawn locally.
 *
 * This replaces a call to api.dicebear.com on every wallet render. Reasons to
 * stop reaching out for it: it put a third-party request (carrying the user's
 * chosen seed) on a signed-in money screen; it broke offline and behind
 * restrictive networks; each avatar cost a round trip; and its illustrated
 * style belonged to a different product than the one around it.
 *
 * The marks below are deterministic — the same seed always yields the same
 * avatar, so a person's card looks the same on every device — and they are
 * built from the wallet's own palette, so a row of them reads as one set
 * rather than fifteen unrelated cartoons.
 *
 * The construction: a hashed seed picks a hue pair from a curated warm ramp,
 * a rotation, and one of a handful of facet arrangements. Everything is plain
 * SVG, so it scales to any size and costs nothing to render.
 */

/* A small, deliberately warm ramp. Every pair sits in the same family as the
   gold, so avatars never fight the brand the way a random hue would. */
const RAMPS: Array<[string, string]> = [
  ["#E5C173", "#8A6A0B"], // gold
  ["#E3A079", "#8C4A2B"], // clay
  ["#86D3AB", "#2F6449"], // jade
  ["#96C2DD", "#33566B"], // azure
  ["#D9A8C4", "#7A3F63"], // mulberry
  ["#C9B78F", "#6B5836"], // sand
  ["#9FBE8E", "#4A6238"], // olive
  ["#E0938F", "#8E3B3B"], // rose
];

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export default function WalletAvatar({
  seed,
  size = 64,
  className = "",
  title,
}: {
  seed: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const art = useMemo(() => {
    const h = hash(seed || "lawfic");
    const [light, dark] = RAMPS[h % RAMPS.length];
    const rotation = (h >> 3) % 360;
    const variant = (h >> 7) % 4;
    const offset = ((h >> 11) % 20) - 10;
    return { light, dark, rotation, variant, offset, id: `av${h % 100000}` };
  }, [seed]);

  const { light, dark, rotation, variant, offset, id } = art;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title ?? `Avatar for ${seed}`}
      className={`shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-c)`}>
        <rect width="64" height="64" fill={`url(#${id}-g)`} />

        <g transform={`rotate(${rotation} 32 32)`} opacity="0.5">
          {variant === 0 && (
            <>
              <circle cx={32 + offset} cy="20" r="22" fill={light} opacity="0.55" />
              <circle cx={32 - offset} cy="46" r="16" fill={dark} opacity="0.6" />
            </>
          )}
          {variant === 1 && (
            <>
              <polygon points="32,4 60,32 32,60 4,32" fill={light} opacity="0.45" />
              <polygon points="32,16 48,32 32,48 16,32" fill={dark} opacity="0.55" />
            </>
          )}
          {variant === 2 && (
            <>
              <rect x={4 + offset} y="-8" width="26" height="80" fill={light} opacity="0.4" />
              <rect x={38 - offset} y="-8" width="14" height="80" fill={dark} opacity="0.5" />
            </>
          )}
          {variant === 3 && (
            <>
              <circle cx="32" cy="32" r="26" fill="none" stroke={light} strokeWidth="9" opacity="0.5" />
              <circle cx={32 + offset} cy={32 - offset} r="11" fill={dark} opacity="0.65" />
            </>
          )}
        </g>

        {/* A single specular sweep, the same one the cards carry. */}
        <path d="M-10 46 L26 -10 L44 -10 L8 46 Z" fill="#FFFFFF" opacity="0.10" />
      </g>

      <circle cx="32" cy="32" r="31.5" fill="none" stroke="rgba(255,255,255,0.18)" />
    </svg>
  );
}
