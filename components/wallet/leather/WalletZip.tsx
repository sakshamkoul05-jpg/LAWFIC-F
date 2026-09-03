"use client";

import type { Hide } from "@/lib/wallet-leather";

/**
 * The zip on a zip-around wallet, driven by a single 0→1 value.
 *
 * WHAT MAKES A ZIP READ AS A ZIP
 *
 * Not the teeth. Three things, in this order of importance:
 *
 *   1. the SLIDER TRAVELS. A zip is the only fastener you watch move along a
 *      path. A static pull with teeth appearing behind it looks like a seam
 *      being erased; the body of the slider moving is the whole illusion;
 *   2. the teeth BEHIND the slider are meshed and the ones AHEAD are parted,
 *      and the boundary is exactly where the slider is. Get that wrong and it
 *      reads as decoration rather than mechanism;
 *   3. the tape gapes where it is open. Two rows of teeth pulling apart with
 *      dark between them, widening the further behind the slider you are.
 *
 * The pull tab hangs off the slider and swings a little as it travels, because
 * a stamped-metal tab on a wire loop is not rigid.
 *
 * GEOMETRY
 *
 * A zip-around runs along the top and turns down the right-hand side, which is
 * why the path here is a rounded corner rather than a line. `t` is progress
 * along that whole path: 0 fully closed, 1 fully open, and the slider is placed
 * by walking the path rather than by interpolating x and y separately — the
 * latter cuts the corner and the slider visibly leaves the tape.
 */

export type WalletZipProps = {
  hide: Hide;
  /** 0 shut, 1 fully unzipped. */
  t: number;
  /** Panel size in the parent's user units. */
  w: number;
  h: number;
};

/** How far down the right edge the zip turns before stopping. */
const SIDE_RUN = 0.34;

export default function WalletZip({ hide, t, w, h }: WalletZipProps) {
  const inset = h * 0.055;
  const radius = h * 0.16;

  /* The path: across the top, round the corner, part way down the side. */
  const x0 = inset;
  const x1 = w - inset - radius;
  const y0 = inset;
  const y1 = inset + radius;
  const yEnd = y1 + (h - y1 - inset) * SIDE_RUN;

  const topLen = x1 - x0;
  const cornerLen = (Math.PI / 2) * radius;
  const sideLen = yEnd - y1;
  const total = topLen + cornerLen + sideLen;

  /** Walk the path to a point, so the slider never cuts the corner. */
  const at = (d: number): { x: number; y: number; a: number } => {
    if (d <= topLen) return { x: x0 + d, y: y0, a: 0 };
    if (d <= topLen + cornerLen) {
      const k = (d - topLen) / cornerLen;
      const ang = (-Math.PI / 2) * (1 - k);
      return {
        x: x1 + radius * Math.cos(ang + Math.PI / 2),
        y: y1 + radius * Math.sin(ang + Math.PI / 2) - radius,
        a: k * 90,
      };
    }
    const k = d - topLen - cornerLen;
    return { x: x1 + radius, y: y1 + k, a: 90 };
  };

  const travelled = Math.max(0, Math.min(1, t)) * total;
  const slider = at(travelled);

  const tapePath = `M${x0} ${y0} H${x1} A${radius} ${radius} 0 0 1 ${x1 + radius} ${y1} V${yEnd}`;

  /* Teeth every few units, meshed ahead of the slider and parted behind it. */
  const step = h * 0.026;
  const teeth: React.ReactNode[] = [];
  for (let d = 0; d <= total; d += step) {
    const p = at(d);
    const openHere = d < travelled;
    /* Widening gape: fully parted right at the start, tapering to nothing at
       the slider, which is how a real zip's opening looks. */
    const gape = openHere ? (1 - d / Math.max(travelled, 0.0001)) * h * 0.035 : 0;
    const perp = p.a === 0 ? { x: 0, y: 1 } : p.a === 90 ? { x: -1, y: 0 } : { x: -Math.sin((p.a * Math.PI) / 180), y: Math.cos((p.a * Math.PI) / 180) };

    teeth.push(
      <g key={d}>
        <rect
          x={p.x - step * 0.28 + perp.x * -gape}
          y={p.y - step * 0.28 + perp.y * -gape}
          width={step * 0.56}
          height={step * 0.56}
          rx={step * 0.14}
          fill={hide.edgeHi}
          opacity={openHere ? 0.85 : 0.7}
        />
        <rect
          x={p.x - step * 0.28 + perp.x * gape}
          y={p.y - step * 0.28 + perp.y * gape}
          width={step * 0.56}
          height={step * 0.56}
          rx={step * 0.14}
          fill={hide.edgeHi}
          opacity={openHere ? 0.85 : 0.7}
        />
      </g>,
    );
  }

  return (
    <g aria-hidden>
      {/* The gape: dark behind the slider, nothing ahead of it. */}
      {travelled > 0 && (
        <path
          d={tapePath}
          fill="none"
          stroke="#000"
          strokeOpacity="0.85"
          strokeWidth={h * 0.075}
          strokeLinecap="round"
          strokeDasharray={`${travelled} ${total}`}
        />
      )}

      {/* Tape, both sides of the teeth */}
      <path
        d={tapePath}
        fill="none"
        stroke={hide.edge}
        strokeWidth={h * 0.055}
        strokeLinecap="round"
      />

      {teeth}

      {/* The slider, and a pull that hangs and swings as it travels. */}
      <g transform={`translate(${slider.x} ${slider.y}) rotate(${slider.a})`}>
        <rect
          x={-h * 0.032}
          y={-h * 0.026}
          width={h * 0.064}
          height={h * 0.052}
          rx={h * 0.012}
          fill={hide.edgeHi}
        />
        <rect
          x={-h * 0.032}
          y={-h * 0.026}
          width={h * 0.064}
          height={h * 0.052}
          rx={h * 0.012}
          fill="none"
          stroke="#000"
          strokeOpacity="0.45"
          strokeWidth={h * 0.005}
        />
        {/* Pull tab, swung by how fast the slider is moving through the run. */}
        <g transform={`rotate(${18 - t * 30}) translate(0 ${h * 0.026})`}>
          <path
            d={`M0 0 V${h * 0.03}`}
            stroke={hide.edgeHi}
            strokeWidth={h * 0.009}
            strokeLinecap="round"
          />
          <rect
            x={-h * 0.018}
            y={h * 0.03}
            width={h * 0.036}
            height={h * 0.062}
            rx={h * 0.014}
            fill={hide.edgeHi}
          />
          <rect
            x={-h * 0.008}
            y={h * 0.044}
            width={h * 0.016}
            height={h * 0.034}
            rx={h * 0.008}
            fill="#000"
            opacity="0.35"
          />
        </g>
      </g>
    </g>
  );
}
