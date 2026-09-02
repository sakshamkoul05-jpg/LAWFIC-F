"use client";

import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";

/**
 * A generated character avatar.
 *
 * Drawn by DiceBear's `lorelei` set, rendered **locally** through the npm
 * package rather than fetched from api.dicebear.com. That distinction is the
 * whole point: the objection to the original implementation was never the
 * artwork, it was the HTTP call — a third-party request carrying the user's
 * chosen seed, issued from a signed-in money screen, that broke offline and
 * cost a round trip per avatar. The package does the same drawing with no
 * network involved at all.
 *
 * It also replaces a hand-authored SVG face I wrote in between. That version
 * was honest work but it was never going to reach this standard; hand-drawing
 * portraits path by path has a ceiling well below a set an illustrator made.
 *
 * Licensing, since this is a commercial site: `lorelei` is CC0 1.0 — public
 * domain, no attribution required. Several of the prettier DiceBear sets
 * (adventurer, micah, personas, bigSmile) are CC BY 4.0 and would oblige
 * LAWFIC to carry a credit line; those are deliberately not used here. The
 * other CC0 options are `notionists` (monochrome, editorial), `openPeeps`
 * and `thumbs` — switching is the one import and the one constant below.
 *
 * The same seed always produces the same person, so a customer's card looks
 * identical on every device they sign in from.
 */

const STYLE = lorelei;

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
