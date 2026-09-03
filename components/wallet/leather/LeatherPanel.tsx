"use client";

import { useId } from "react";
import type { Hide, ThreadId } from "@/lib/wallet-leather";
import { threadColour } from "@/lib/wallet-leather";

/**
 * One panel of leather, drawn as a lit surface.
 *
 * HOW THIS MAKES LEATHER, AND WHY THE OBVIOUS WAY DOES NOT
 *
 * The obvious way is a colour, a gradient, and a noise texture at low opacity.
 * That produces film grain: flat, directionless, identical on every hide, and
 * it reads as paper or concrete. Leather is not a colour with noise on it, it
 * is a surface with relief, and relief is only visible because it is lit.
 *
 * So the grain here is turbulence run through `feDiffuseLighting` with a single
 * distant light, multiplied back over the hide colour. Each pebble then has a
 * lit side and a shaded side, which is the whole of why it looks raised. Hides
 * that actually return a highlight get a second `feSpecularLighting` pass on
 * the same turbulence, so the shine sits on the grain rather than floating over
 * it as a gradient would.
 *
 * The parameters come from the skin (see `lib/wallet-leather.ts`), which is what
 * makes nubuck and polished calf different materials rather than different
 * colours: olive is high-frequency, deep, and has its specular set to zero,
 * because a napped hide has none and adding one is exactly what makes rendered
 * suede look like plastic.
 *
 * TWO THINGS THAT WILL BREAK IT IF CHANGED
 *
 * `colorInterpolationFilters="sRGB"`. SVG filters interpolate in linearRGB by
 * default, and near black that curve is steep enough to pull a three-point
 * channel difference into a visible colour cast — the midnight hide came out
 * with a brown cloud across half the wallet.
 *
 * Filter and gradient ids are per-instance via `useId`. Several panels of the
 * same hide render at once (two faces of the fold, the lining, five swatches),
 * and a `url(#…)` reference resolves to the first match in the document, so
 * shared ids silently paint every panel with one panel's filter.
 */

export type PanelProps = {
  hide: Hide;
  thread: ThreadId;
  /** Panel size in user units. The caller scales the svg with CSS. */
  w: number;
  h: number;
  radius?: number;
  /** `lining` is the inside face: darker, flatter, no burnished outer edge. */
  face?: "outer" | "lining";
  /** Saddle stitch inset from the edge. Off for the lining. */
  stitched?: boolean;
  /** Seed the grain so two panels of one wallet are not identical. */
  seed?: number;
  className?: string;
  children?: React.ReactNode;
};

export default function LeatherPanel({
  hide,
  thread,
  w,
  h,
  radius = 16,
  face = "outer",
  stitched = true,
  seed = 3,
  className = "",
  children,
}: PanelProps) {
  const uid = useId().replace(/:/g, "");
  const gid = `g-${uid}`;
  const fid = `f-${uid}`;
  const vid = `v-${uid}`;
  const crid = `c-${uid}`;

  const m = hide.material;
  const lining = face === "lining";
  const base: [string, string, string] = lining
    ? [hide.lining, hide.lining, hide.liningDeep]
    : hide.outer;

  /* A lining sits in shadow and is seen at an angle, so its grain reads finer
     and flatter than the same hide does on the outside. */
  const grainScale = lining ? m.grainScale * 0.55 : m.grainScale;
  const specular = lining ? 0 : m.specular;

  const stroke = threadColour(hide, thread);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0.05" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={base[0]} />
          <stop offset="52%" stopColor={base[1]} />
          <stop offset="100%" stopColor={base[2]} />
        </linearGradient>

        {/* Corners of a used wallet are darker than its middle. */}
        <radialGradient id={vid} cx="0.44" cy="0.38" r="0.78">
          <stop offset="52%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity={lining ? 0.42 : 0.3} />
        </radialGradient>

        {/* A crease catches light on one lip and shades in the fold, so it is
            drawn as a dark line with a pale one a hair below it. */}
        <linearGradient id={crid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>

        <filter
          id={fid}
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={m.grainFreq}
            numOctaves="4"
            seed={seed}
            result="noise"
          />
          <feDiffuseLighting
            in="noise"
            lightingColor="#FFFFFF"
            surfaceScale={grainScale}
            diffuseConstant="1"
            result="diffuse"
          >
            <feDistantLight azimuth="225" elevation="54" />
          </feDiffuseLighting>
          <feComposite
            in="diffuse"
            in2="SourceGraphic"
            operator="arithmetic"
            k1="1"
            k2="0"
            k3="0"
            k4="0"
            result="lit"
          />

          {specular > 0 ? (
            <>
              <feSpecularLighting
                in="noise"
                lightingColor="#FFFFFF"
                surfaceScale={grainScale}
                specularConstant={specular}
                specularExponent={m.specularExp}
                result="spec"
              >
                <feDistantLight azimuth="228" elevation="60" />
              </feSpecularLighting>
              {/* Clip the highlight to the panel, then add it on top of the
                  lit grain so the shine sits in the grain rather than over it. */}
              <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
              <feComposite
                in="lit"
                in2="specIn"
                operator="arithmetic"
                k1="0"
                k2="1"
                k3="1"
                k4="0"
              />
            </>
          ) : null}
        </filter>
      </defs>

      {/* The hide, then the same shape lit into grain */}
      <rect x="0" y="0" width={w} height={h} rx={radius} fill={`url(#${gid})`} />
      <rect
        x="0"
        y="0"
        width={w}
        height={h}
        rx={radius}
        fill={`url(#${gid})`}
        filter={`url(#${fid})`}
      />
      <rect x="0" y="0" width={w} height={h} rx={radius} fill={`url(#${vid})`} />

      {/* Creases. Leather that has been sat on does not stay flat, and two soft
          folds are the difference between a hide and a swatch. */}
      {!lining && (
        <g opacity="0.85">
          <path
            d={`M${w * 0.06} ${h * 0.34} C ${w * 0.3} ${h * 0.28}, ${w * 0.62} ${h * 0.4}, ${
              w * 0.94
            } ${h * 0.31}`}
            fill="none"
            stroke="#000000"
            strokeOpacity="0.14"
            strokeWidth={h * 0.018}
            strokeLinecap="round"
          />
          <path
            d={`M${w * 0.06} ${h * 0.345} C ${w * 0.3} ${h * 0.285}, ${w * 0.62} ${
              h * 0.405
            }, ${w * 0.94} ${h * 0.315}`}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.05"
            strokeWidth={h * 0.01}
            strokeLinecap="round"
          />
          <path
            d={`M${w * 0.1} ${h * 0.74} C ${w * 0.38} ${h * 0.8}, ${w * 0.66} ${h * 0.7}, ${
              w * 0.9
            } ${h * 0.77}`}
            fill="none"
            stroke="#000000"
            strokeOpacity="0.1"
            strokeWidth={h * 0.014}
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Burnished edge. On a real wallet the cut edge is sanded, waxed and
          rubbed until it is darker and glossier than the face; it is the single
          detail that separates a finished piece from a cut rectangle. Three
          strokes: the dark burnish, the waxed highlight just inside it, and a
          crisp outline. */}
      {!lining && (
        <>
          <rect
            x="0"
            y="0"
            width={w}
            height={h}
            rx={radius}
            fill="none"
            stroke={hide.edge}
            strokeWidth={h * 0.03}
          />
          <rect
            x={h * 0.022}
            y={h * 0.022}
            width={w - h * 0.044}
            height={h - h * 0.044}
            rx={radius - 3}
            fill="none"
            stroke={hide.edgeHi}
            strokeOpacity="0.4"
            strokeWidth={h * 0.006}
          />
          <rect
            x="0"
            y="0"
            width={w}
            height={h}
            rx={radius}
            fill="none"
            stroke="#000000"
            strokeOpacity="0.55"
            strokeWidth={h * 0.008}
          />
        </>
      )}

      {/* Saddle stitch, in two passes: the recessed hole, then the waxed thread
          sitting a hair above it. Sewn with two needles, and it shows. */}
      {stitched && (
        <g strokeDasharray={`${h * 0.028} ${h * 0.03}`} strokeLinecap="round">
          <rect
            x={h * 0.075}
            y={h * 0.075}
            width={w - h * 0.15}
            height={h - h * 0.15}
            rx={radius - 5}
            fill="none"
            stroke="#000000"
            strokeOpacity="0.5"
            strokeWidth={h * 0.019}
          />
          <rect
            x={h * 0.075}
            y={h * 0.071}
            width={w - h * 0.15}
            height={h - h * 0.15}
            rx={radius - 5}
            fill="none"
            stroke={stroke}
            strokeOpacity="0.9"
            strokeWidth={h * 0.012}
          />
        </g>
      )}

      {children}
    </svg>
  );
}
