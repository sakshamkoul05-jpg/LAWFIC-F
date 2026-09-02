"use client";

import { useMemo } from "react";
import type { Signature, Finish } from "@/lib/wallet-card";

/**
 * The generative art on a card face.
 *
 * Two layers, and the distinction between them is the whole idea:
 *
 *   The GUILLOCHE is seeded from the account id. It is fixed the moment the
 *   account exists and never changes, so every customer's card has a base
 *   pattern nobody else has — the security-printing motif that engraved
 *   certificates and banknotes use, which is apt for a compliance product.
 *
 *   The BLOTS are the customer's actual filing history: one per service
 *   category they have paid for, sized by how much of their spend it
 *   represents. A new card is nearly bare and fills in as they use it, so the
 *   face becomes a record of what they have done rather than a badge they
 *   selected from a list.
 *
 * All of it is deterministic. The same account renders the same card on every
 * device, with no stored image and nothing to sync.
 */
export default function CardSignature({
  signature,
  finish,
  className = "",
}: {
  signature: Signature;
  finish: Finish;
  className?: string;
}) {
  const uid = useMemo(
    () => `sig${Math.round(signature.seedAngle * 1000 + signature.seedDrift * 977)}`,
    [signature.seedAngle, signature.seedDrift],
  );

  /* A guilloché is a family of phase-shifted sine curves. Shifting the phase
     and amplitude by the account seed is enough to make each one distinct. */
  const guilloche = useMemo(() => {
    const lines: string[] = [];
    const drift = signature.seedDrift;
    for (let i = 0; i < 7; i++) {
      const amp = 8 + i * 2.4 + drift * 9;
      const phase = (signature.seedAngle / 57.3) + i * 0.55;
      const y = 20 + i * 12;
      let d = `M0,${y}`;
      for (let x = 0; x <= 320; x += 8) {
        const yy = y + Math.sin(x / 26 + phase) * amp * Math.cos(x / 190 + drift * 3);
        d += ` L${x},${yy.toFixed(1)}`;
      }
      lines.push(d);
    }
    return lines;
  }, [signature.seedAngle, signature.seedDrift]);

  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    >
      <defs>
        {signature.blots.map((b, i) => (
          <radialGradient key={b.category} id={`${uid}-b${i}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={b.ink} stopOpacity={b.opacity} />
            <stop offset="65%" stopColor={b.ink} stopOpacity={b.opacity * 0.35} />
            <stop offset="100%" stopColor={b.ink} stopOpacity="0" />
          </radialGradient>
        ))}
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={finish.sheen} />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* The customer's filing history */}
      <g>
        {signature.blots.map((b, i) => (
          <circle
            key={b.category}
            cx={b.x * 320}
            cy={b.y * 200}
            r={b.r * 320}
            fill={`url(#${uid}-b${i})`}
          />
        ))}
      </g>

      {/* The account's own guilloché */}
      <g
        transform={`rotate(${signature.seedAngle * 0.05} 160 100)`}
        opacity={finish.texture === "engrave" ? 0.3 : 0.16}
      >
        {guilloche.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={finish.texture === "engrave" ? 0.7 : 0.5}
            transform={`translate(0 ${i * 4})`}
          />
        ))}
      </g>

      {/* Finish */}
      {finish.texture === "lines" && (
        <g opacity="0.12">
          {Array.from({ length: 40 }, (_, i) => (
            <line
              key={i}
              x1={i * 8}
              y1="0"
              x2={i * 8 - 40}
              y2="200"
              stroke="#FFFFFF"
              strokeWidth="0.6"
            />
          ))}
        </g>
      )}
      {finish.texture === "grain" && (
        <rect width="320" height="200" fill="#FFFFFF" opacity="0.02" />
      )}

      <rect width="320" height="200" fill={`url(#${uid}-sheen)`} />
    </svg>
  );
}
