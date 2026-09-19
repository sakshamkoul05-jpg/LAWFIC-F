"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { pandaFrames } from "./quickActionsConfig";

/**
 * The panda, drawn inline so it can blink.
 *
 * WHY THIS IS NOT AN <img>
 *
 * A blink has to reach inside the artwork, and CSS cannot style the innards of
 * an SVG loaded through <img>. The alternatives were two raster frames swapped
 * on a timer — a second network request, a hard cut with no eyelid travel, and
 * a first blink that arrives whenever the second file finishes loading — or
 * this: one inline element where the lids are real shapes with real motion.
 *
 * IF YOU HAVE THE CLIENT'S EXACT ARTWORK
 *
 * Put both frames in /public and name them in `pandaFrames` (see
 * quickActionsConfig.ts). This component then swaps those two images instead of
 * drawing anything, and the blink timing below still drives it. Until those
 * files exist it draws the panda itself, so the widget is never broken waiting
 * on an asset.
 *
 * THE TIMING IS THE WHOLE TRICK
 *
 * A fixed interval reads as a machine. Real blinking is irregular and
 * occasionally doubles, so the gap is randomised and roughly one blink in four
 * is a pair. Anyone who has asked for less motion gets eyes that simply stay
 * open.
 */

/* Milliseconds. The lids are closed for `hold`; `gapMin`/`gapMax` bound the
   pause between blinks. */
const HOLD = 150;
const GAP_MIN = 2600;
const GAP_MAX = 6200;
const DOUBLE_BLINK_CHANCE = 0.25;
const DOUBLE_BLINK_PAUSE = 190;

export default function PandaFace({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;

    let cancelled = false;
    /* One id, always reassigned, always cleared. A blink is a little chain of
       timeouts and leaving any link of it running after unmount would set
       state on a component that no longer exists. */
    let timer: ReturnType<typeof setTimeout>;

    const shut = (thenDoubleBlink: boolean) => {
      if (cancelled) return;
      setClosed(true);
      timer = setTimeout(() => {
        if (cancelled) return;
        setClosed(false);
        timer = setTimeout(
          thenDoubleBlink ? () => shut(false) : schedule,
          thenDoubleBlink ? DOUBLE_BLINK_PAUSE : 0,
        );
      }, HOLD);
    };

    const schedule = () => {
      if (cancelled) return;
      const gap = GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);
      timer = setTimeout(() => shut(Math.random() < DOUBLE_BLINK_CHANCE), gap);
    };

    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reduceMotion]);

  /* The client's own frames, when they exist. Both are rendered and cross-faded
     rather than swapping one `src`, so the blink never shows a blank gap while
     the second file decodes. */
  if (pandaFrames.open && pandaFrames.blink) {
    return (
      <span className={`relative block ${className ?? ""}`}>
        <img
          src={pandaFrames.open}
          alt=""
          draggable={false}
          className="absolute inset-0 block h-full w-full object-contain transition-opacity duration-100"
          style={{ opacity: closed ? 0 : 1 }}
        />
        <img
          src={pandaFrames.blink}
          alt=""
          draggable={false}
          className="absolute inset-0 block h-full w-full object-contain transition-opacity duration-100"
          style={{ opacity: closed ? 1 : 0 }}
        />
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Panda"
      focusable="false"
    >
      <defs>
        <clipPath id="pf-disc">
          <circle cx="60" cy="60" r="56" />
        </clipPath>
        <radialGradient id="pf-face" cx="48%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFE7D8" />
        </radialGradient>
      </defs>

      <circle cx="60" cy="60" r="56" fill="#FAF6EE" />

      <g clipPath="url(#pf-disc)">
        {/* Body and belly, cropped by the disc as the reference crops them. */}
        <ellipse cx="60" cy="112" rx="41" ry="33" fill="#1B1B1F" />
        <ellipse cx="62" cy="116" rx="20" ry="24" fill="#F7F1E6" />

        {/* Feet, with the reference's big soft pads. Only the large pad is
            drawn — at 56px the toe pads collapse into a smudge. */}
        <ellipse cx="31" cy="116" rx="16" ry="13" fill="#1B1B1F" />
        <ellipse cx="91" cy="116" rx="16" ry="13" fill="#1B1B1F" />
        <ellipse cx="31" cy="118" rx="8.5" ry="7" fill="#6E6259" />
        <ellipse cx="91" cy="118" rx="8.5" ry="7" fill="#6E6259" />

        {/* The raised, waving paw. It is what makes the silhouette read as
            friendly rather than as a logo. */}
        <g transform="rotate(-16 20 60)">
          <ellipse cx="20" cy="62" rx="12.5" ry="15" fill="#1B1B1F" />
          <ellipse cx="20" cy="64" rx="6.5" ry="6" fill="#6E6259" />
          <circle cx="13" cy="54" r="2.6" fill="#6E6259" />
          <circle cx="20" cy="51.5" r="2.6" fill="#6E6259" />
          <circle cx="27" cy="54" r="2.6" fill="#6E6259" />
        </g>

        {/* Ears behind the head, so they read as attached to it. */}
        <circle cx="33" cy="32" r="14.5" fill="#1B1B1F" />
        <circle cx="87" cy="32" r="14.5" fill="#1B1B1F" />

        <ellipse cx="60" cy="53" rx="37" ry="33" fill="url(#pf-face)" />

        {/* Eye patches, tilted inward — most of what makes it cute rather than
            merely ursine. */}
        <ellipse cx="43" cy="51" rx="12" ry="14.5" fill="#1B1B1F" transform="rotate(-20 43 51)" />
        <ellipse cx="77" cy="51" rx="12" ry="14.5" fill="#1B1B1F" transform="rotate(20 77 51)" />

        {/* Brows, as in the reference. */}
        <path
          d="M36 33 q6 -4 12 -1 M84 33 q-6 -4 -12 -1"
          fill="none"
          stroke="#1B1B1F"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Eyes. Brown irises with a high white catchlight. */}
        <g>
          <circle cx="45" cy="50" r="6.2" fill="#FFFFFF" />
          <circle cx="75" cy="50" r="6.2" fill="#FFFFFF" />
          <circle cx="45.8" cy="50.6" r="4.4" fill="#5A3A22" />
          <circle cx="75.8" cy="50.6" r="4.4" fill="#5A3A22" />
          <circle cx="45.8" cy="50.6" r="2.1" fill="#1B1B1F" />
          <circle cx="75.8" cy="50.6" r="2.1" fill="#1B1B1F" />
          <circle cx="43.9" cy="48.4" r="1.7" fill="#FFFFFF" />
          <circle cx="73.9" cy="48.4" r="1.7" fill="#FFFFFF" />
        </g>

        {/* THE LIDS.
            Patch-coloured, anchored at the top of each eye and scaled down the
            eye, so the lid travels rather than the eye vanishing. They sit
            above the eyes and below nothing else. */}
        <g
          style={{
            transformOrigin: "45px 43px",
            transform: `scaleY(${closed ? 1 : 0})`,
            transition: `transform ${HOLD * 0.55}ms ease-out`,
          }}
        >
          <ellipse cx="45" cy="50" rx="7.4" ry="8" fill="#1B1B1F" />
        </g>
        <g
          style={{
            transformOrigin: "75px 43px",
            transform: `scaleY(${closed ? 1 : 0})`,
            transition: `transform ${HOLD * 0.55}ms ease-out`,
          }}
        >
          <ellipse cx="75" cy="50" rx="7.4" ry="8" fill="#1B1B1F" />
        </g>

        {/* Nose and open smile with a tongue, as in the reference. */}
        <path d="M54 65 q6 -4.5 12 0 q0 5.5 -6 7.5 q-6 -2 -6 -7.5 z" fill="#1B1B1F" />
        <path
          d="M49 75 q11 12 22 0 q-11 5 -22 0 z"
          fill="#1B1B1F"
        />
        <path d="M54 79 q6 7 12 0 q-6 3 -12 0 z" fill="#E08B93" />
      </g>
    </svg>
  );
}
