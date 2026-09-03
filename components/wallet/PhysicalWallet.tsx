"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { getHide, getPlate } from "@/lib/wallet-leather";
import type { HideId, PlateId, ThreadId } from "@/lib/wallet-leather";
import { restingStack } from "@/lib/denominations";
import { useObserverBroken } from "@/lib/use-in-view-safe";
import WalletLeaf from "./leather/WalletLeaf";
import CurrencyStack from "./CurrencyStack";

/**
 * A bifold wallet, built as an object.
 *
 * WHAT THE PREVIOUS VERSION GOT WRONG, SO IT IS NOT REPEATED
 *
 * It was a rectangle of leather seen dead on. It had grain, stitching, a
 * burnished edge and a contact shadow, and it still read as a card — because a
 * flat rectangle seen dead on is exactly what a card is. Texture was never the
 * missing thing. Two things were:
 *
 *   THICKNESS. A wallet is fifteen millimetres of folded hide and paper. That
 *   is invisible from straight ahead, so the halves are slabs with real edge
 *   surfaces (see WalletLeaf) rather than planes.
 *
 *   A CAMERA. Everything here is turned about twenty degrees off axis and
 *   tipped forward, because you cannot see an edge you are looking straight at.
 *   The angle is what makes the thickness do any work at all.
 *
 * HOW IT IS ASSEMBLED
 *
 * The right half is fixed and holds the money. The left half hinges on the
 * spine between them and folds a half turn onto the right one to shut — which
 * is what a bifold physically is. Shut, you are looking at the OUTSIDE of the
 * folding half, so that is a real back surface on that slab rather than a
 * second copy of its front. The rounded spine stands proud on one side and the
 * parted, layered edge faces the camera on the other, and that layered edge
 * carries a band of banknote paper through the middle of it. That band is why a
 * shut wallet looks like it has money in it.
 *
 * There are no card slots. This holds a prepaid balance for filings, and
 * drawing card pockets into it would be furniture for a product that does not
 * exist.
 *
 * UNITS
 *
 * Container query units throughout, never percentages. 3D needs real lengths —
 * `translateZ(50%)` means nothing — and `cqw` is a real length that still
 * scales with its container, so this is one object that resizes rather than a
 * desktop build and a mobile build. The scene sets `container-type`.
 */

/* Geometry, in cqw. A closed bifold is about 11.5 x 9.5cm, so a half is roughly
   1.2:1, and it runs about 7mm thick per half against 115mm of width.

   The panel is 46cqw, not 40, and the container it sits in is far wider than it
   was: open, the wallet spans 4cqw to 96cqw and very nearly fills its frame.
   The previous version was the right shape and a quarter of the right size,
   which is a worse failure than being the wrong shape — an object that small
   reads as an icon whatever is drawn on it, and no amount of grain or stitching
   registers at 230 pixels across. */
const PANEL_W = 48;
const PANEL_H = 40;
const DEPTH = 3.6;
const SPINE_X = 50;
const PANEL_TOP = 27;

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
  const degraded = useObserverBroken();
  const still = Boolean(reduced) || degraded;

  const [selfOpen, setSelfOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const open = openProp ?? selfOpen;
  const toggle = onToggle ?? (() => setSelfOpen((o) => !o));

  const hide = getHide(hideId) ?? getHide("midnight")!;
  const plate = getPlate(plateId) ?? getPlate("brass")!;
  const notes = restingStack(balancePaise, 5);

  /* Leather is heavy and a hinge is stiff. Underdamped enough to arrive with
     some weight in it, slow enough to read as a hand opening something. */
  const leather = still
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 78, damping: 15, mass: 1.15 };

  /* Shut, the pair sits on the right of its own box, so the assembly shifts
     left to centre. Kept off the camera element: combining the translate with
     the rotation makes the wallet swing rather than slide. */
  const shift = open ? 0 : -PANEL_W / 2;

  return (
    <div className={`relative mx-auto w-full ${className}`}
        style={{ maxWidth: "clamp(340px, 94vw, 1060px)" }}>
      <button
        type="button"
        onClick={toggle}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        aria-expanded={open}
        aria-label={open ? "Close your wallet" : "Open your wallet"}
        className="block w-full cursor-pointer rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <div
          className="relative w-full"
          style={{
            containerType: "inline-size",
            aspectRatio: "100 / 78",
            perspective: "135cqw",
            perspectiveOrigin: "50% 42%",
          }}
        >
          {/* Contact shadow. It belongs to the floor, not to the wallet, so it
              can spread and soften as the object lifts — which is most of what
              tells you it came off the surface. */}
          <motion.div
            className="absolute left-1/2 rounded-[50%]"
            style={{ bottom: "6cqw", background: "rgba(0,0,0,0.6)", x: "-50%" }}
            initial={false}
            animate={{
              width: open ? "76cqw" : "42cqw",
              height: open ? "7cqw" : "6cqw",
              filter: hover && !open ? "blur(3.2cqw)" : "blur(2.2cqw)",
              opacity: open ? 0.5 : hover ? 0.45 : 0.72,
            }}
            transition={leather}
          />

          {/* THE CAMERA. Off axis and tipped forward — an edge you look
              straight at is an edge you cannot see, and everything below
              depends on this one transform. */}
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
            initial={false}
            animate={{
              rotateX: open ? 26 : 17,
              rotateY: open ? 6 : 21,
              rotateZ: open ? 0 : -1.5,
              y: hover && !open ? "-1.6cqw" : "0cqw",
            }}
            transition={leather}
          >
            <motion.div
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d" }}
              initial={false}
              animate={{ x: `${shift}cqw`, scale: open ? 1.02 : 1.32 }}
              transition={leather}
            >
              {/* THE FIXED HALF — the back of the wallet, and the half the
                  money sits in. */}
              <div
                style={{
                  position: "absolute",
                  left: `${SPINE_X}cqw`,
                  top: `${PANEL_TOP}cqw`,
                  transformStyle: "preserve-3d",
                }}
              >
                <WalletLeaf
                  hide={hide}
                  thread={thread}
                  openEdge="right"
                  face="lining"
                  w={PANEL_W}
                  h={PANEL_H}
                  depth={DEPTH}
                  holdsNotes
                  seed={7}
                >
                  {/* The bill compartment: a seam across the panel with the
                      money behind it. The only pocket in the wallet. */}
                  <div
                    className="pointer-events-none absolute inset-x-[6%] bottom-[6%] top-[36%] rounded-[4px]"
                    style={{
                      background: `linear-gradient(180deg, ${hide.liningDeep} 0%, ${hide.lining} 55%)`,
                      boxShadow: `0 -0.5cqw 1.2cqw rgba(0,0,0,0.55), inset 0 1px 0 ${hide.edgeHi}55`,
                    }}
                  />
                </WalletLeaf>
              </div>

              {/* THE MONEY. Tucked into the compartment on the FIXED half, so
                  it stays where it is while the other half swings. Money does
                  not travel with the flap. */}
              <div
                style={{
                  position: "absolute",
                  left: `${SPINE_X}cqw`,
                  top: `${PANEL_TOP}cqw`,
                  width: `${PANEL_W}cqw`,
                  height: `${PANEL_H}cqw`,
                  transform: `translateZ(${-DEPTH * 0.45}cqw)`,
                  transformStyle: "preserve-3d",
                }}
              >
                <CurrencyStack
                  notes={notes}
                  landing={landing}
                  open={open}
                  still={still}
                  className="bottom-[72%] left-[9%] w-[82%]"
                />
              </div>

              {/* THE FOLDING HALF, hinged on the spine at its right border. */}
              <motion.div
                style={{
                  position: "absolute",
                  left: `${SPINE_X - PANEL_W}cqw`,
                  top: `${PANEL_TOP}cqw`,
                  width: `${PANEL_W}cqw`,
                  height: `${PANEL_H}cqw`,
                  transformStyle: "preserve-3d",
                  transformOrigin: "100% 50%",
                }}
                initial={false}
                animate={{ rotateY: open ? 0 : 180 }}
                transition={leather}
              >
                <WalletLeaf
                  hide={hide}
                  thread={thread}
                  openEdge="left"
                  face="lining"
                  backFace="outer"
                  w={PANEL_W}
                  h={PANEL_H}
                  depth={DEPTH}
                  seed={11}
                  children={
                    <div
                      className="pointer-events-none absolute inset-x-[9%] top-[46%] h-px"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${hide.edgeHi}55 15%, ${hide.edgeHi}55 85%, transparent)`,
                        boxShadow: `0 1px 0 rgba(0,0,0,0.5)`,
                      }}
                    />
                  }
                  backChildren={
                    <>
                      {/* Metal nameplate, sunk into the hide */}
                      <div
                        className="absolute rounded-[3px]"
                        style={{
                          right: "8%",
                          bottom: "13%",
                          width: "44%",
                          height: "13%",
                          background: `linear-gradient(135deg, ${plate.face[0]}, ${plate.face[1]} 48%, ${plate.face[2]})`,
                          border: `1px solid ${plate.rim}`,
                          boxShadow: "0 0.3cqw 0.7cqw rgba(0,0,0,0.5)",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <span
                          className="font-mono"
                          style={{
                            color: plate.letter,
                            fontSize: "1.5cqw",
                            letterSpacing: "0.18em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {nameplate || "LAWFIC"}
                        </span>
                      </div>

                      {/* Blind emboss: no ink, so it is a shadow with a
                          highlight under it rather than coloured text. */}
                      <span
                        className="absolute font-mono"
                        style={{
                          left: "9%",
                          bottom: "15%",
                          fontSize: "1.5cqw",
                          letterSpacing: "0.3em",
                          color: "transparent",
                          textShadow:
                            "0 1px 0 rgba(255,255,255,0.1), 0 -1px 1px rgba(0,0,0,0.65)",
                        }}
                      >
                        LAWFIC
                      </span>
                    </>
                  }
                />
              </motion.div>

              {/* THE FOLD. Shut, it is the rounded spine standing proud of the
                  two halves; open, it is the crease they hinge on. One is a
                  surface and the other is a valley, so they are two elements
                  rather than one trying to be both. */}
              <motion.div
                style={{
                  position: "absolute",
                  left: `${SPINE_X}cqw`,
                  top: `${PANEL_TOP}cqw`,
                  width: `${DEPTH * 2.4}cqw`,
                  height: `${PANEL_H}cqw`,
                  transformOrigin: "0% 50%",
                  transform: `rotateY(90deg) translateZ(${DEPTH}cqw)`,
                  background: `linear-gradient(90deg, ${hide.outer[2]}, ${hide.edgeHi} 42%, ${hide.outer[1]} 62%, ${hide.outer[2]})`,
                  borderRadius: `${DEPTH}cqw`,
                }}
                initial={false}
                animate={{ opacity: open ? 0 : 1 }}
                transition={{ duration: still ? 0 : 0.25 }}
              />
              <motion.div
                style={{
                  position: "absolute",
                  left: `${SPINE_X}cqw`,
                  top: `${PANEL_TOP}cqw`,
                  width: `${DEPTH * 2.2}cqw`,
                  height: `${PANEL_H}cqw`,
                  transform: "translateX(-50%) translateZ(0.05cqw)",
                  background: `linear-gradient(90deg, ${hide.edgeHi}33, ${hide.liningDeep} 30%, #000 50%, ${hide.liningDeep} 70%, ${hide.edgeHi}33)`,
                  boxShadow: "0 0 1.4cqw 0.4cqw rgba(0,0,0,0.6)",
                }}
                initial={false}
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: still ? 0 : 0.35 }}
              />
            </motion.div>
          </motion.div>
        </div>
      </button>
    </div>
  );
}
