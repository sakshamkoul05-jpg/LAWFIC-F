"use client";

import type { Hide } from "@/lib/wallet-leather";

/**
 * The card slots on the inside of a bifold.
 *
 * Three leaves, each overlapping the one behind, which is how the inside of
 * every bifold ever made is built — you cut one piece per slot and lap them so
 * a card drops behind the leaf in front of it. It is also the single feature
 * that tells you at a glance you are looking at the inside of a wallet: a plain
 * dark rectangle could be anything, and the first version of this open state
 * read as two black cards sitting next to each other for exactly that reason.
 *
 * Each leaf gets a lit top edge and a shadow beneath it, because the whole
 * effect depends on the leaves being visibly in front of one another rather
 * than drawn as lines on a flat surface.
 */
export default function CardSlots({ hide }: { hide: Hide }) {
  /* Bottom leaf first, so each subsequent one laps over it. */
  const leaves = [
    { bottom: 6, height: 30 },
    { bottom: 20, height: 30 },
    { bottom: 34, height: 30 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {leaves.map((l, i) => (
        <div
          key={l.bottom}
          className="absolute left-[7%] right-[7%] rounded-[5px]"
          style={{
            bottom: `${l.bottom}%`,
            height: `${l.height}%`,
            zIndex: i + 1,
            background: `linear-gradient(180deg, ${hide.lining} 0%, ${hide.liningDeep} 62%)`,
            /* Lit lip along the cut edge, shadow cast onto the leaf behind. */
            boxShadow: `0 -4px 9px rgba(0,0,0,0.5), inset 0 1px 0 ${hide.edgeHi}55`,
          }}
        />
      ))}
    </div>
  );
}
