"use client";

import type { Hide, ThreadId } from "@/lib/wallet-leather";
import LeatherPanel from "./LeatherPanel";

/**
 * One half of the bifold, built as a SLAB rather than a plane.
 *
 * WHY THIS EXISTS AT ALL
 *
 * The previous wallet was a rectangle with leather painted on it, seen dead
 * on, and it could only ever read as a card — because that is exactly what a
 * card is. What separates a wallet from a card is not texture, or stitching, or
 * shadow. It is THICKNESS, and thickness is invisible from straight ahead. You
 * have to be able to see the edge.
 *
 * So each half is a box: a front face, a stack of layers behind it, and three
 * real edge surfaces built by rotating strips out of the face plane and hinging
 * them on the shared border. Seen from the three-quarter angle the scene puts
 * the camera at, those edges are what say "this is 15mm of folded hide".
 *
 * The top edge is the important one and it is not a solid colour: it is a
 * gradient across the leaf's depth, banded leather → lining → paper → lining →
 * leather. That band of paper in the middle of the edge is the whole reason a
 * closed wallet looks like it has money in it, and it is the detail that no
 * amount of front-face rendering can substitute for.
 *
 * EVERYTHING IS IN `cqw`
 *
 * 3D needs real lengths — you cannot translateZ by a percentage. Container
 * query units give real lengths that still scale with the container, so the
 * wallet is one object that resizes rather than a desktop build and a mobile
 * build. The parent must set `container-type: inline-size`.
 */

export type WalletLeafProps = {
  hide: Hide;
  thread: ThreadId;
  /** Which vertical border is the open edge; the other one meets the fold. */
  openEdge: "left" | "right";
  face: "outer" | "lining";
  /**
   * The other side of the slab. The half that folds shows its BACK when the
   * wallet is shut, so that is where the outside of the wallet lives — this is
   * a real surface at the far side of the leaf's depth, not a second copy of
   * the front.
   */
  backFace?: "outer" | "lining";
  /** All in cqw. */
  w: number;
  h: number;
  depth: number;
  /** Show a band of banknote paper in the edge stack. */
  holdsNotes?: boolean;
  seed?: number;
  children?: React.ReactNode;
  backChildren?: React.ReactNode;
};

export default function WalletLeaf({
  hide,
  thread,
  openEdge,
  face,
  backFace,
  w,
  h,
  depth,
  holdsNotes = false,
  seed = 3,
  children,
  backChildren,
}: WalletLeafProps) {
  const d = depth;

  /* The layers you would see if you cut through the leaf. Leather on the
     outside, lining within, and — on the half that holds the money — a band of
     paper between them. */
  const stack = holdsNotes
    ? `linear-gradient(180deg,
        ${hide.outer[1]} 0%, ${hide.edge} 16%,
        ${hide.lining} 22%, ${hide.lining} 38%,
        #CFC8B4 41%, #E4DECD 50%, #CFC8B4 59%,
        ${hide.lining} 62%, ${hide.lining} 80%,
        ${hide.edge} 86%, ${hide.outer[2]} 100%)`
    : `linear-gradient(180deg,
        ${hide.outer[1]} 0%, ${hide.edge} 20%,
        ${hide.lining} 28%, ${hide.liningDeep} 72%,
        ${hide.edge} 80%, ${hide.outer[2]} 100%)`;

  const sideStack = `linear-gradient(90deg,
      ${hide.outer[1]} 0%, ${hide.edge} 22%,
      ${hide.liningDeep} 50%,
      ${hide.edge} 78%, ${hide.outer[2]} 100%)`;

  const face3d: React.CSSProperties = { position: "absolute", transformStyle: "preserve-3d" };

  return (
    <div
      style={{
        position: "absolute",
        width: `${w}cqw`,
        height: `${h}cqw`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* The body behind the face. Three slabs rather than one so the edge
          catches light in bands the way a laminated thing does. */}
      {[0.34, 0.67, 1].map((t, i) => (
        <div
          key={t}
          style={{
            ...face3d,
            inset: 0,
            borderRadius: `${w * 0.045}cqw`,
            background: i === 2 ? hide.outer[2] : hide.edge,
            transform: `translateZ(${-d * t}cqw)`,
          }}
        />
      ))}

      {/* Top edge: hinged on the leaf's top border and folded back into depth.
          A point at the far side of the strip lands at z = -depth, which is
          what makes this a real surface rather than a drawn line. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${w}cqw`,
          height: `${d}cqw`,
          transformOrigin: "50% 0%",
          transform: "rotateX(-90deg)",
          background: stack,
          borderRadius: `${w * 0.01}cqw`,
        }}
      />

      {/* Bottom edge */}
      <div
        style={{
          position: "absolute",
          top: `${h}cqw`,
          left: 0,
          width: `${w}cqw`,
          height: `${d}cqw`,
          transformOrigin: "50% 0%",
          transform: "rotateX(-90deg)",
          background: sideStack,
          filter: "brightness(0.6)",
        }}
      />

      {/* The open edge — the side away from the fold, where the two halves part */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: openEdge === "right" ? `${w}cqw` : 0,
          width: `${d}cqw`,
          height: `${h}cqw`,
          transformOrigin: openEdge === "right" ? "0% 50%" : "100% 50%",
          transform: `rotateY(${openEdge === "right" ? 90 : -90}deg)`,
          background: sideStack,
        }}
      />

      {/* The face itself */}
      <div style={{ ...face3d, inset: 0, transform: "translateZ(0.01cqw)" }}>
        <LeatherPanel
          hide={hide}
          thread={thread}
          w={300}
          h={Math.round((300 * h) / w)}
          radius={14}
          face={face}
          seed={seed}
          className="absolute inset-0 h-full w-full"
        />
        {children}
      </div>

      {/* The back of the slab, at the far side of its depth and turned to face
          outward. On the folding half this is the outside of the wallet. */}
      {backFace && (
        <div
          style={{
            ...face3d,
            inset: 0,
            transform: `translateZ(${-d}cqw) rotateY(180deg)`,
          }}
        >
          <LeatherPanel
            hide={hide}
            thread={thread}
            w={300}
            h={Math.round((300 * h) / w)}
            radius={14}
            face={backFace}
            seed={seed + 4}
            className="absolute inset-0 h-full w-full"
          />
          {backChildren}
        </div>
      )}
    </div>
  );
}
