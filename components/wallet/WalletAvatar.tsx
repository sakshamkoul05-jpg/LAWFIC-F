"use client";

import { useMemo } from "react";

/**
 * A generated character avatar, drawn locally.
 *
 * Illustrated faces rather than abstract marks: flat vector, soft skin with a
 * single shading band, thin line features, dark round eyes, blush cheeks — the
 * friendly register the reference art uses. An abstract facet mark was correct
 * about the palette and wrong about the feeling; a wallet is personal, and a
 * face reads as *yours* in a way a gradient never does.
 *
 * Still drawn here rather than fetched from api.dicebear.com. That call put a
 * third-party request carrying the user's chosen seed on a signed-in money
 * screen, broke offline and behind restrictive networks, and cost a round trip
 * per avatar. Everything below is plain SVG: deterministic, offline, free.
 *
 * The same seed always produces the same person, so a card looks identical on
 * every device the customer signs in from.
 */

const SKINS = [
  { base: "#F8D3B6", shade: "#EFC1A0", ear: "#EFC1A0" },
  { base: "#EFBE99", shade: "#E0A87F", ear: "#E0A87F" },
  { base: "#D79C74", shade: "#C4855C", ear: "#C4855C" },
  { base: "#B0764F", shade: "#96603C", ear: "#96603C" },
];

const HAIRS = [
  "#E4485F", // red
  "#6B4A3A", // brown
  "#A9BCC9", // grey
  "#3B6FE0", // blue
  "#D9A441", // blonde
  "#3A3238", // near-black
];

const INK = "#3D1F35";

type Style = "swept" | "long" | "curly" | "cap" | "bald" | "bearded";
const STYLES: Style[] = ["swept", "long", "curly", "cap", "bald", "bearded"];

const CAPS: Array<[string, string]> = [
  ["#2F6FE0", "#1D4CA8"],
  ["#1F3D4C", "#142A34"],
  ["#8A6A0B", "#6B5208"],
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
  const p = useMemo(() => {
    const h = hash(seed || "lawfic");
    return {
      id: `av${h % 1000000}`,
      skin: SKINS[h % SKINS.length],
      hair: HAIRS[(h >> 4) % HAIRS.length],
      style: STYLES[(h >> 9) % STYLES.length],
      ring: HAIRS[(h >> 14) % HAIRS.length],
      cap: CAPS[(h >> 18) % CAPS.length],
    };
  }, [seed]);

  const { id, skin, hair, style, ring, cap } = p;

  /* Small faces need a plain ground, not a detailed one — at 20px in the
     picker the features become texture, and a clean tinted disc reads better
     than mud. The face is drawn at every size; the difference is only that
     it has somewhere calm to sit. */
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={title ?? `Avatar for ${seed}`}
      className={`shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <defs>
        <clipPath id={`${id}-disc`}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
        <clipPath id={`${id}-head`}>
          <path d="M100,30 C129,30 148,50 148,84 C148,118 129,146 100,146 C71,146 52,118 52,84 C52,50 71,30 100,30 Z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-disc)`}>
        <rect width="200" height="200" fill={ring} opacity="0.16" />

        {/* Neck and shoulders */}
        <path d="M84,132 h32 v34 h-32 Z" fill={skin.shade} />
        <path d="M60,200 C60,176 78,164 100,164 C122,164 140,176 140,200 Z" fill={skin.shade} opacity="0.9" />

        {/* Head */}
        <path
          d="M100,30 C129,30 148,50 148,84 C148,118 129,146 100,146 C71,146 52,118 52,84 C52,50 71,30 100,30 Z"
          fill={skin.base}
        />
        {/* One shading band, the way the reference does it */}
        <g clipPath={`url(#${id}-head)`}>
          <rect x="100" y="20" width="60" height="140" fill={skin.shade} opacity="0.55" />
        </g>

        {/* Ear */}
        <circle cx="149" cy="92" r="12" fill={skin.base} />
        <circle cx="150" cy="92" r="5.5" fill={skin.ear} opacity="0.8" />

        {/* Eyes */}
        <ellipse cx="84" cy="82" rx="5" ry="6" fill={INK} />
        <ellipse cx="116" cy="82" rx="5" ry="6" fill={INK} />

        {/* Brows */}
        <path d="M76,68 q8,-5 16,-1" stroke={INK} strokeWidth="1.6" fill="none" opacity="0.45" strokeLinecap="round" />
        <path d="M108,67 q8,-4 16,1" stroke={INK} strokeWidth="1.6" fill="none" opacity="0.45" strokeLinecap="round" />

        {/* Nose */}
        <path d="M100,86 q-4,12 2,15" stroke={INK} strokeWidth="1.8" fill="none" opacity="0.55" strokeLinecap="round" />

        {/* Blush */}
        <ellipse cx="74" cy="104" rx="10" ry="7" fill="#F0918F" opacity="0.42" />
        <ellipse cx="126" cy="104" rx="10" ry="7" fill="#F0918F" opacity="0.32" />

        {/* Smile */}
        <path d="M86,116 q14,12 28,-1" stroke={INK} strokeWidth="2" fill="none" opacity="0.65" strokeLinecap="round" />

        {/* ---- Hair, facial hair and headwear ---- */}
        {style === "swept" && (
          <path
            d="M54,74 C54,40 76,26 102,26 C128,26 148,42 148,68 C140,54 124,52 112,58 C118,44 104,38 96,44 C102,30 84,28 76,40 C74,30 58,36 54,74 Z"
            fill={hair}
          />
        )}

        {style === "long" && (
          <>
            <path
              d="M46,150 C40,96 52,26 100,26 C148,26 160,96 154,150 C150,120 146,104 140,96 C142,70 128,56 100,56 C72,56 58,70 60,96 C54,104 50,120 46,150 Z"
              fill={hair}
            />
            <path d="M56,58 C70,34 130,34 144,58 C130,44 70,44 56,58 Z" fill={hair} />
          </>
        )}

        {style === "curly" && (
          <>
            <circle cx="76" cy="46" r="19" fill={hair} />
            <circle cx="100" cy="36" r="21" fill={hair} />
            <circle cx="126" cy="46" r="19" fill={hair} />
            <circle cx="140" cy="64" r="14" fill={hair} />
            <circle cx="60" cy="64" r="14" fill={hair} />
          </>
        )}

        {style === "cap" && (
          <>
            <path d="M54,66 C54,36 76,24 100,24 C124,24 146,36 146,66 Z" fill={cap[0]} />
            <path d="M146,66 C166,66 178,72 180,80 L142,80 Z" fill={cap[1]} />
            <path d="M96,25 C110,26 122,32 130,42 L112,66 L92,66 Z" fill={cap[1]} opacity="0.55" />
          </>
        )}

        {style === "bald" && (
          <>
            <path d="M52,86 C48,66 56,58 62,58 C60,72 60,80 62,88 Z" fill={hair} />
            <path d="M148,86 C152,66 144,58 138,58 C140,72 140,80 138,88 Z" fill={hair} />
            <path d="M78,48 q10,-8 20,-6" stroke={hair} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.7" />
            {/* Full beard */}
            <path
              d="M60,96 C60,140 76,158 100,158 C124,158 140,140 140,96 C136,124 124,132 100,132 C76,132 64,124 60,96 Z"
              fill={hair}
            />
            <path d="M88,110 q12,10 24,-2 q-6,16 -24,2 Z" fill={hair} opacity="0.9" />
          </>
        )}

        {style === "bearded" && (
          <>
            <path
              d="M54,76 C54,40 76,26 100,26 C126,26 148,42 148,76 C140,56 122,48 100,48 C78,48 62,56 54,76 Z"
              fill={hair}
            />
            <path
              d="M58,92 C58,142 78,160 100,160 C122,160 142,142 142,92 C138,126 122,136 100,136 C78,136 62,126 58,92 Z"
              fill={hair}
            />
            <path d="M84,114 q16,14 32,-2 q-8,20 -32,2 Z" fill={hair} opacity="0.85" />
          </>
        )}
      </g>
    </svg>
  );
}
