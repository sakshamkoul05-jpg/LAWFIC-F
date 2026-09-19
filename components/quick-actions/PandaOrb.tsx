"use client";

import { motion, type MotionValue } from "motion/react";
import { orb } from "./quickActionsConfig";

/**
 * The glowing sphere the panda sits on.
 *
 * ORIGINAL, NOT THE REFERENCE CLIP
 *
 * The client sent a phone recording of a Shutterstock preview — a magenta
 * energy orb with swirling plasma and sparks — as a description of the look
 * they wanted. That clip is watermarked stock and cannot ship. This is built
 * from its character rather than its pixels: a luminous core, two plasma
 * layers turning against each other, a hot rim, and sparks that drift.
 *
 * WHY IT IS ALL TRANSFORM AND OPACITY
 *
 * This thing is on every page, on screen the whole time, and it never stops.
 * Anything that animates a colour, a shadow, a gradient stop or a size would
 * hand the compositor a repaint on every frame forever, on a page that also
 * has a ticker and a carousel running. Every moving part here is a rotate, a
 * scale or an opacity, which the compositor handles without touching layout.
 *
 * `spin` comes from the page's scroll position, so the orb turns as the
 * visitor moves down the page — the rest turns on its own, always.
 */
export default function PandaOrb({ spin }: { spin?: MotionValue<number> }) {
  return (
    <span aria-hidden className="qa-orb">
      {/* Core: the deep glow the rest sits inside. */}
      <span className="qa-orb-core" />

      {/* Plasma, two layers turning opposite ways at different speeds so the
          pattern never repeats to the eye. The outer one follows the scroll. */}
      <motion.span className="qa-orb-plasma qa-orb-plasma-a" style={spin ? { rotate: spin } : undefined} />
      <span className="qa-orb-plasma qa-orb-plasma-b" />

      {/* The hot rim. A ring of light just inside the edge, which is what makes
          a flat gradient read as a sphere. */}
      <span className="qa-orb-rim" />

      {/* Sparks. Twelve, each with its own delay, on a group that drifts. */}
      <span className="qa-orb-sparks">
        {orb.sparks.map((spark, index) => (
          <i
            key={index}
            style={{
              left: `${spark.x}%`,
              top: `${spark.y}%`,
              width: spark.r,
              height: spark.r,
              animationDelay: `${spark.delay}s`,
              animationDuration: `${spark.duration}s`,
            }}
          />
        ))}
      </span>
    </span>
  );
}
