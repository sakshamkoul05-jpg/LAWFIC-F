"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { getHide, getPlate, threadColour } from "@/lib/wallet-leather";
import type { HideId, PlateId, ThreadId } from "@/lib/wallet-leather";
import { restingStack } from "@/lib/denominations";
import { useObserverBroken } from "@/lib/use-in-view-safe";
import LeatherPanel from "./leather/LeatherPanel";
import CurrencyStack from "./CurrencyStack";
import CardSlots from "./leather/CardSlots";

/**
 * A bifold wallet that actually opens.
 *
 * HOW IT IS PUT TOGETHER
 *
 * Two panels sharing a spine down the middle. The left panel is fixed. The
 * right panel hinges on the spine — `transform-origin` at its left edge — and
 * carries two faces: the lining, seen when the wallet is open, and the outside
 * of the wallet on its back, seen when it is shut. Closing is that panel
 * rotating a half turn onto the left one, which is what a bifold physically is.
 *
 * Three things about the construction that are easy to undo by accident:
 *
 *   - DOM order is left panel, then notes, then the hinged panel. Coplanar
 *     elements in a `preserve-3d` context sort by document order, so this is
 *     what puts the closed flap over the money and the open money over the
 *     lining. Reordering these hides the cash or paints it through the leather.
 *
 *   - the zoom and the recentring are separate nested elements. Shut, the
 *     wallet occupies the left half of its own box, so it has to shift right by
 *     a quarter of that box to sit in the middle of the frame. Doing both on
 *     one element makes the shift a function of the scale, and the wallet
 *     drifts as it opens.
 *
 *   - the whole thing is laid out in percentages. The wallet is the hero of the
 *     page at every width, so it is one object that scales rather than a
 *     desktop version and a mobile version.
 */

export type PhysicalWalletProps = {
  hide: HideId;
  plate: PlateId;
  thread: ThreadId;
  nameplate: string;
  balancePaise: number;
  /** Notes from a confirmed credit. They fly in; nothing else does. */
  landing?: number[];
  /** Controlled open state. Omit both to let the wallet manage its own. */
  open?: boolean;
  onToggle?: () => void;
  className?: string;
};

export default function PhysicalWallet({
  hide: hideId,
  plate: plateId,
  thread,
  nameplate,
  balancePaise,
  landing = [],
  open: openProp,
  onToggle,
  className = "",
}: PhysicalWalletProps) {
  const reduced = useReducedMotion();
  /* Uncontrolled by default, so a preview or a customiser can drop the wallet
     in without wiring state it does not otherwise need. */
  const [selfOpen, setSelfOpen] = useState(false);
  const open = openProp ?? selfOpen;
  const toggle = onToggle ?? (() => setSelfOpen((o) => !o));
  const degraded = useObserverBroken();
  const still = Boolean(reduced) || degraded;

  const hide = getHide(hideId) ?? getHide("midnight")!;
  const plate = getPlate(plateId) ?? getPlate("brass")!;
  const stitch = threadColour(hide, thread);

  const notes = restingStack(balancePaise, 6);

  /* The two faces of the hinged panel cross over halfway through the turn,
     where the panel is edge-on and neither is really visible. This is done with
     opacity rather than `backface-visibility` on purpose: backface culling is
     evaluated against an element's accumulated 3D transform, which is exactly
     the kind of thing that behaves differently once a parent is also rotating,
     and when it goes wrong the wallet has no outside at all. Opacity is
     deterministic everywhere.

     `backface-visibility` is deliberately NOT also set. Belt and braces here
     turned out to be belt and noose: with it on, the outside of the wallet was
     culled even though its accumulated transform faces the viewer, and the shut
     wallet showed its own lining. Opacity alone.

     Both faces are pushed +5px along their own normal, not -5px. The flap is
     itself turned a half turn when shut, which negates the sign: a face nudged
     "back" by 5px resolves to 5px in FRONT of the fixed panel in world space,
     and the shut wallet showed its lining through its own outside. */
  const faceSwap = still ? { duration: 0 } : { duration: 0.01, delay: 0.22 };

  /* Spring for the leather. Slightly underdamped so the flap arrives with a
     little weight in it rather than easing to a stop like a slide. */
  const leatherSpring = still
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 90, damping: 16, mass: 1.1 };

  return (
    <div className={`relative mx-auto w-full max-w-[560px] ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Close your wallet" : "Open your wallet"}
        className="block w-full cursor-pointer rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        style={{ perspective: 2000 }}
      >
        <div className="relative w-full" style={{ aspectRatio: "630 / 390" }}>
          {/* Contact shadow. Separate from the wallet so it can spread and
              soften as the object lifts, which is most of what tells you the
              wallet came off the surface. */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
            style={{ bottom: "2%", background: "rgba(0,0,0,0.55)" }}
            initial={false}
            animate={{
              width: open ? "78%" : "44%",
              height: open ? "9%" : "7%",
              filter: open ? "blur(22px)" : "blur(14px)",
              opacity: open ? 0.5 : 0.7,
            }}
            transition={leatherSpring}
          />

          {/* Zoom. Shut, the wallet is half the width of its own box, so it is
              magnified to stay the hero; opening pulls back to fit both panels. */}
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ scale: open ? 1 : 1.24, y: open ? 0 : "-3%" }}
            transition={leatherSpring}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Recentring, on its own element — see the note at the top. */}
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ x: open ? "0%" : "25%" }}
              transition={leatherSpring}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* A little tilt, so it is an object on a surface and not a
                  diagram of one. */}
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ rotateX: open ? 8 : 4 }}
                transition={leatherSpring}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Thickness: leather has layers, and a single rectangle has
                    none. Two offset slabs behind the panels read as the lining
                    and the outer skin stacked. */}
                {[5, 2.5].map((off, i) => (
                  <div
                    key={off}
                    className="absolute bottom-[9%] h-[74%] rounded-[4%]"
                    style={{
                      left: `${-off * 0.25}%`,
                      width: open ? `${100 + off * 0.5}%` : `${50 + off * 0.5}%`,
                      transform: `translateY(${off * 0.55}%)`,
                      background: i === 0 ? hide.edge : hide.outer[2],
                      opacity: 0.9,
                    }}
                  />
                ))}

                {/* LEFT PANEL — the lining, fixed. */}
                <div className="absolute bottom-[9%] left-0 h-[74%] w-1/2">
                  <LeatherPanel
                    hide={hide}
                    thread={thread}
                    w={315}
                    h={260}
                    radius={14}
                    face="lining"
                    seed={7}
                    className="absolute inset-0 h-full w-full"
                  />
                  {/* THE MONEY, in the bill compartment: after the lining and
                      BEFORE the card slots, because in a real bifold the notes
                      sit behind the leaves rather than on top of them. Indian
                      notes are folded in half to fit — a Rs 500 is 150mm and a
                      bifold is about 115mm — which is why they occupy one half
                      of the wallet rather than spanning the spine.

                      The whole panel is covered by the flap when the wallet is
                      shut, so what you see then is the inch of note that clears
                      the top edge. That is the only thing telling you there is
                      money in it, so do not let it drop below the leather. */}
                  <CurrencyStack
                    notes={notes}
                    landing={landing}
                    open={open}
                    still={still}
                    className="bottom-[72%] left-[8%] w-[76%]"
                  />
                  <CardSlots hide={hide} />
                </div>

                {/* RIGHT PANEL — hinged on the spine. */}
                <motion.div
                  className="absolute bottom-[9%] left-1/2 h-[74%] w-1/2"
                  style={{ transformStyle: "preserve-3d", transformOrigin: "0% 50%" }}
                  initial={false}
                  animate={{ rotateY: open ? 0 : -180 }}
                  transition={leatherSpring}
                >
                  {/* Inner face: the lining, seen when open. */}
                  <motion.div
                    className="absolute inset-0"
                    style={{ transform: "translateZ(5px)" }}
                    initial={false}
                    animate={{ opacity: open ? 1 : 0 }}
                    transition={faceSwap}
                  >
                    <LeatherPanel
                      hide={hide}
                      thread={thread}
                      w={315}
                      h={260}
                      radius={14}
                      face="lining"
                      seed={11}
                      className="absolute inset-0 h-full w-full"
                    />
                    <CardSlots hide={hide} />
                  </motion.div>

                  {/* Outer face: the wallet as you see it shut. */}
                  <motion.div
                    className="absolute inset-0"
                    style={{ transform: "rotateY(180deg) translateZ(5px)" }}
                    initial={false}
                    animate={{ opacity: open ? 0 : 1 }}
                    transition={faceSwap}
                  >
                    <LeatherPanel
                      hide={hide}
                      thread={thread}
                      w={315}
                      h={260}
                      radius={14}
                      face="outer"
                      seed={3}
                      className="absolute inset-0 h-full w-full"
                    >
                      {/* Metal nameplate, sunk into the hide */}
                      <g transform="translate(150 176)">
                        <rect
                          x="-1.5"
                          y="-1.5"
                          width="153"
                          height="41"
                          rx="6"
                          fill="#000"
                          opacity="0.45"
                        />
                        <defs>
                          <linearGradient id={`np-${hide.id}-${plate.id}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={plate.face[0]} />
                            <stop offset="48%" stopColor={plate.face[1]} />
                            <stop offset="100%" stopColor={plate.face[2]} />
                          </linearGradient>
                        </defs>
                        <rect
                          width="150"
                          height="38"
                          rx="5"
                          fill={`url(#np-${hide.id}-${plate.id})`}
                        />
                        <rect
                          width="150"
                          height="38"
                          rx="5"
                          fill="none"
                          stroke={plate.rim}
                          strokeWidth="1.2"
                        />
                        <text
                          x="75"
                          y="24.5"
                          textAnchor="middle"
                          fontFamily="ui-monospace, monospace"
                          fontSize={nameplate.length > 14 ? 10 : 12}
                          letterSpacing="1.6"
                          fill={plate.letter}
                        >
                          {nameplate || "LAWFIC"}
                        </text>
                      </g>

                      {/* Blind emboss: no ink, so it is a shadow with a
                          highlight under it rather than coloured text. */}
                      <g fontFamily="ui-monospace, monospace" fontSize="12" letterSpacing="3">
                        <text x="30" y="222" fill="#000" opacity="0.5">
                          LAWFIC
                        </text>
                        <text x="30" y="223" fill="#FFF" opacity="0.09">
                          LAWFIC
                        </text>
                      </g>
                    </LeatherPanel>
                  </motion.div>
                </motion.div>

                {/* The spine, drawn last so it sits over the seam. Only when
                    open — shut, it is the folded edge on the left. */}
                <motion.div
                  className="pointer-events-none absolute bottom-[9%] left-1/2 h-[74%] w-[5.5%] -translate-x-1/2"
                  initial={false}
                  animate={{ opacity: open ? 1 : 0 }}
                  transition={{ duration: still ? 0 : 0.35 }}
                  style={{
                    /* A fold, not a gap. The crease is darkest at its floor
                       with a lit lip either side, which is what joins the two
                       panels into one object instead of two cards side by
                       side. */
                    background: `linear-gradient(90deg, ${hide.edgeHi}22 0%, ${hide.liningDeep} 22%, #000 50%, ${hide.liningDeep} 78%, ${hide.edgeHi}22 100%)`,
                    boxShadow: "0 0 14px 4px rgba(0,0,0,0.55)",
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </button>

      {/* The affordance. A wallet that opens has to say so once, and then stop
          saying it. */}
      <motion.p
        className="mt-1 text-center font-mono text-[10.5px] uppercase tracking-[0.22em]"
        style={{ color: "var(--wallet-fg-muted)" }}
        animate={{ opacity: open ? 0 : 0.55 }}
        transition={{ duration: still ? 0 : 0.3 }}
        aria-hidden
      >
        Tap to open
      </motion.p>
    </div>
  );
}
