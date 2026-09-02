"use client";

import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { micah } from "@dicebear/collection";

/**
 * A generated character avatar.
 *
 * Drawn by DiceBear's `micah` set, rendered **locally** through the npm
 * package rather than fetched from api.dicebear.com. That distinction matters:
 * the HTTP API put a third-party request carrying the user's chosen seed on a
 * signed-in money screen, broke offline, and cost a round trip per avatar. The
 * package does the same drawing with no network involved at all.
 *
 * WHY MICAH AND NOT LORELEI
 *
 * `lorelei` is fine line-art — portraits drawn at hairline weight. At the 40px
 * an avatar actually appears at on a wallet, those lines fall below the weight
 * a screen can resolve and the face turns to grey mush. That is what "the
 * avatars look vague" was describing, and it was a rendering problem rather
 * than a matter of taste. `micah` is flat colour blocks with blush cheeks and
 * heavy features: it survives being small, and it matches the illustrated
 * reference the client supplied.
 *
 * THE LICENCE COST, ACCEPTED DELIBERATELY
 *
 * `micah` is CC BY 4.0, so LAWFIC carries a credit line in the footer —
 * see components/site/Footer.tsx. `lorelei` was CC0 and needed none. Every
 * DiceBear set that matches the reference is CC BY; every CC0 one is line-art
 * or monochrome. One sentence in a footer, against avatars a customer can see,
 * is the right side of that trade. If the credit is ever removed, the style
 * must change back at the same time.
 *
 * The same seed always produces the same person, so a customer's card looks
 * identical on every device they sign in from.
 */

const STYLE = micah;

/** Tinted grounds drawn from the brand's warm family, picked by seed. */
const GROUNDS = ["D0AE55", "C9B78F", "E3A079", "86D3AB", "96C2DD", "D9A8C4"];

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
  const svg = useMemo(() => {
    const key = seed || "lawfic";
    return createAvatar(STYLE, {
      seed: key,
      size,
      backgroundColor: [GROUNDS[hash(key) % GROUNDS.length]],
      backgroundType: ["solid"],
      radius: 50,
    }).toString();
  }, [seed, size]);

  return (
    <span
      role="img"
      aria-label={title ?? `Avatar for ${seed}`}
      className={`inline-block shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, lineHeight: 0 }}
      /* The markup comes from a pinned library rendering a fixed style; the
         seed only drives its PRNG and never reaches the output as markup. */
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
