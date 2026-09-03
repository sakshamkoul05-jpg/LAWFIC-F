"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getHide, getPlate } from "@/lib/wallet-leather";
import type { HideId, PlateId, ThreadId } from "@/lib/wallet-leather";
import { restingStack } from "@/lib/denominations";
import { useObserverBroken } from "@/lib/use-in-view-safe";
import WalletLeaf from "./leather/WalletLeaf";
import WalletZip from "./leather/WalletZip";
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
  /**
   * 0 shut and zipped, 1 fully open. Given, it drives the whole sequence and
   * `open` is ignored for animation; omitted, `open` maps to 0 or 1 so callers
   * that only want a toggle keep working.
   */
  progress?: number;
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
  progress,
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

  /* ONE TIMELINE, THREE STAGES, in the order the range sheet shows them:
     the zip runs, the top edge gapes, and only then does the wallet unfold.
     A wallet whose halves start parting while the zip is still travelling is
     the tell that the zip is decoration, so the stages do not overlap. */
  const target = progress ?? (open ? 1 : 0);
  const [prog, setProg] = useState(target);
  const progRef = useRef(prog);
  progRef.current = prog;
  const tween = useRef<number | null>(null);
  const drag = useRef<{ x: number; from: number } | null>(null);
  /* A tap fires pointerup AND click; a drag fires only pointerup. Taps are
     therefore handled in onClick — which is also what a <button> synthesises
     for Enter and Space, so the keyboard keeps working — and a drag sets this
     to swallow the click that follows it. Handling taps in onPointerUp instead
     silently breaks keyboard operation, which is exactly what it did. */
  const swallowClick = useRef(false);

  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTween = useCallback(() => {
    if (tween.current !== null) cancelAnimationFrame(tween.current);
    tween.current = null;
    if (watchdog.current !== null) clearTimeout(watchdog.current);
    watchdog.current = null;
  }, []);

  /* Walk to a target over time. 900ms end to end, which is long enough to read
     as three separate things happening and short enough not to feel slow. */
  const runTo = useCallback(
    (to: number) => {
      stopTween();
      if (still) return setProg(to);
      const from = progRef.current;
      if (Math.abs(to - from) < 0.001) return;
      const ms = 900 * Math.abs(to - from);
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        setProg(from + (to - from) * e);
        tween.current = k < 1 ? requestAnimationFrame(step) : null;
      };
      tween.current = requestAnimationFrame(step);

      /* Frames are not guaranteed. Browsers pause requestAnimationFrame for a
         hidden or backgrounded tab, and some embedded contexts never deliver it
         at all — so without this the wallet reports itself open, reads as open
         to a screen reader, and sits there visibly shut. A timer is not
         throttled the same way, so it lands the animation wherever the frames
         gave up. A wallet must never be stuck half-unzipped because a browser
         declined to composite. */
      watchdog.current = setTimeout(() => {
        if (tween.current !== null) {
          cancelAnimationFrame(tween.current);
          tween.current = null;
        }
        setProg(to);
      }, ms + 260);
    },
    [still, stopTween],
  );

  useEffect(() => {
    runTo(target);
  }, [target, runTo]);
  useEffect(() => stopTween, [stopTween]);

  const p = prog;
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const zipT = clamp01(p / 0.45);
  const gapeT = clamp01((p - 0.45) / 0.15);
  const foldT = clamp01((p - 0.6) / 0.4);
  const lerp = (a: number, b: number) => a + (b - a) * foldT;

  /* Shut, the pair sits on the right of its own box, so the assembly shifts
     left to centre. Kept off the camera element: combining the translate with
     the rotation makes the wallet swing rather than slide. */
  const shift = lerp(-PANEL_W / 2, 0);

  return (
    <div className={`relative mx-auto w-full ${className}`}
        style={{ maxWidth: "clamp(340px, 94vw, 1060px)" }}>
      <button
        type="button"
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onPointerDown={(e) => {
          stopTween();
          drag.current = { x: e.clientX, from: progRef.current };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          setProg(Math.max(0, Math.min(1, d.from + (e.clientX - d.x) / 260)));
        }}
        onClick={() => {
          if (swallowClick.current) {
            swallowClick.current = false;
            return;
          }
          toggle();
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (!d) return;
          /* Barely moved? Leave it to the click that is about to arrive. */
          if (Math.abs(progRef.current - d.from) < 0.02) return;
          swallowClick.current = true;
          const wantOpen = progRef.current > 0.5;
          if (wantOpen === open) runTo(wantOpen ? 1 : 0);
          else toggle();
        }}
        onPointerCancel={() => {
          drag.current = null;
          runTo(target);
        }}
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
              width: `${lerp(42, 76)}cqw`,
              height: `${lerp(6, 7)}cqw`,
              filter: hover && foldT === 0 ? "blur(3.2cqw)" : "blur(2.2cqw)",
              opacity: hover && foldT === 0 ? 0.45 : lerp(0.72, 0.5),
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
              rotateX: lerp(17, 26),
              rotateY: lerp(21, 6),
              rotateZ: lerp(-1.5, 0),
              y: hover && foldT === 0 ? "-1.6cqw" : "0cqw",
            }}
            transition={leather}
          >
            <motion.div
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d" }}
              initial={false}
              animate={{ x: `${shift}cqw`, scale: lerp(1.32, 1.02) }}
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
                  style={{ opacity: foldT }}
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
                animate={{
                  /* The gape: the folding half tips off the stack by a few
                     degrees before the hinge starts, which is what the sheet's
                     "ZIP OPENED" frame shows and what stops the unfold from
                     looking like a page turn. */
                  rotateY: 180 - foldT * 180,
                  rotateX: -gapeT * (1 - foldT) * 9,
                }}
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
                      {/* The zip, on the face you are looking at when the
                          wallet is shut. Drawn in the leaf's own user units so
                          it scales with the panel. */}
                      <svg
                        viewBox={`0 0 300 ${Math.round((300 * PANEL_H) / PANEL_W)}`}
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        preserveAspectRatio="none"
                        aria-hidden
                      >
                        <WalletZip
                          hide={hide}
                          t={zipT}
                          w={300}
                          h={Math.round((300 * PANEL_H) / PANEL_W)}
                        />
                      </svg>

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
                animate={{ opacity: 1 - foldT }}
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
                animate={{ opacity: foldT }}
                transition={{ duration: still ? 0 : 0.35 }}
              />
            </motion.div>
          </motion.div>
        </div>
      </button>
    </div>
  );
}
