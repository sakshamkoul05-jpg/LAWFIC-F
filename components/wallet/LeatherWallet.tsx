"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { formatPaise } from "@/lib/money";
import { getHide, getPlate, threadColour } from "@/lib/wallet-leather";
import type { HideId, PlateId, ThreadId } from "@/lib/wallet-leather";
import { animationPlan, breakdown, describeBreakdown, widthPct } from "@/lib/denominations";
import { useObserverBroken } from "@/lib/use-in-view-safe";
import Banknote from "./Banknote";
import WalletAvatar from "./WalletAvatar";

/**
 * The wallet, as an object rather than a card.
 *
 * A bifold in full-grain leather: pebbled surface, burnished edge, saddle
 * stitch, a bill compartment the notes sit in, and a metal plate stamped with
 * the holder's name. It replaces a credit-card face that was never true —
 * LAWFIC issues no card, and nothing here can be tapped.
 *
 * Adding money puts the actual denominations in. ₹2,700 becomes five ₹500
 * notes and one ₹200, drawn at the sizes the RBI really mills them, and they
 * land in a stack — counting them is the confirmation.
 *
 * HOW THE LEATHER IS MADE, AND WHY IT IS NOT NOISE
 *
 * The first version textured the hide with high-frequency `feTurbulence` laid
 * over the fill at low opacity. That is film grain: flat, directionless, and
 * it reads as paper or concrete, never as leather. Full-grain leather is a
 * *lit* surface — pebbles raised by tumbling, each catching light on one side
 * and shading on the other — so the grain here is low-frequency turbulence run
 * through `feDiffuseLighting` with a single distant light, then multiplied
 * back over the hide colour. That is what makes it read as something with a
 * surface rather than a coloured rectangle.
 *
 * Three rules the motion keeps, all of them pre-existing:
 *   - nothing animates while money is being committed. Notes fly only after a
 *     credit is confirmed in the ledger, so this animates a fact, not a hope;
 *   - `prefers-reduced-motion` shows the stack already inside and the balance
 *     already correct;
 *   - if animation frames never arrive, the same is true. A balance must never
 *     be invisible because a browser did not composite.
 */

export type WalletLook = {
  hide: HideId;
  plate: PlateId;
  thread: ThreadId;
  nameplate: string;
  avatarSeed: string;
};

export default function LeatherWallet({
  look,
  balancePaise,
  /** Set to an amount in paise to play the deposit. Confirmed credits only. */
  depositPaise = 0,
  onDepositDone,
  className = "",
}: {
  look: WalletLook;
  balancePaise: number;
  depositPaise?: number;
  onDepositDone?: () => void;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const degraded = useObserverBroken();
  const still = Boolean(reduced) || degraded;

  const hide = getHide(look.hide) ?? getHide("midnight")!;
  const plate = getPlate(look.plate) ?? getPlate("brass")!;
  const thread = threadColour(hide, look.thread);

  const depositing = depositPaise > 0;
  const [open, setOpen] = useState(false);
  const [landed, setLanded] = useState(0);

  const runs = breakdown(depositPaise);
  const plan = animationPlan(runs);

  /* How full the wallet looks at rest. Capped, because a large balance should
     not try to draw a hundred slips. */
  const resting = Math.min(5, Math.max(0, Math.round(balancePaise / 100 / 500)));

  /* The whole stack has to stay inside the bill compartment, and it can be
     anything from one note to seventeen. A fixed per-note offset works for the
     first case and sends the last one clean off the top of the wallet, so the
     offset is derived from how many notes there are: the stack rises the same
     20px in total however many slips are in it. Same reason the fan stops
     widening after the sixth note. */
  const stackSize = resting + plan.flying.length;
  const step = Math.min(5, 20 / Math.max(1, stackSize - 1));
  const fan = (i: number) => (i % 2 ? 1 : -1) * (0.6 + Math.min(i, 6) * 0.32);
  /** Sideways scatter, so slips read as loose notes rather than a printed pad. */
  const drift = (i: number) => ((i % 3) - 1) * 2.5;

  const shown = useMotionValue(balancePaise);
  const [shownText, setShownText] = useState(formatPaise(balancePaise));
  useEffect(() => {
    const unsub = shown.on("change", (v) => setShownText(formatPaise(Math.round(v))));
    return () => unsub();
  }, [shown]);

  const doneRef = useRef(onDepositDone);
  doneRef.current = onDepositDone;

  useEffect(() => {
    if (!depositing) return;

    if (still) {
      setOpen(true);
      setLanded(plan.flying.length);
      shown.set(balancePaise);
      const t = setTimeout(() => doneRef.current?.(), 400);
      return () => clearTimeout(t);
    }

    setOpen(true);
    setLanded(0);
    shown.set(balancePaise - depositPaise);

    const timers: ReturnType<typeof setTimeout>[] = [];
    plan.flying.forEach((_, i) => {
      timers.push(setTimeout(() => setLanded(i + 1), 420 + i * 78));
    });

    const settle = 420 + plan.flying.length * 78 + 260;
    timers.push(
      setTimeout(() => {
        animate(shown, balancePaise, { duration: 0.7, ease: [0.16, 1, 0.3, 1] });
      }, settle),
    );
    timers.push(setTimeout(() => setOpen(false), settle + 520));
    timers.push(setTimeout(() => doneRef.current?.(), settle + 1000));

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositPaise, depositing, still, balancePaise]);

  useEffect(() => {
    if (!depositing) shown.set(balancePaise);
  }, [balancePaise, depositing, shown]);

  const gradOuter = `w-${hide.id}-outer`;
  const gradSheen = `w-${hide.id}-sheen`;
  const gradMetal = `w-${hide.id}-${plate.id}-metal`;
  const grainId = `w-${hide.id}-grain`;
  const backGrainId = `w-${hide.id}-grain-back`;
  const vignetteId = `w-${hide.id}-vignette`;

  return (
    <div className={`relative w-full max-w-[400px] select-none ${className}`}>
      <motion.div
        className="relative"
        style={{
          perspective: 1400,
          /* A midnight hide sits within a few points of lightness of the
             warm-ink ground. Without a shadow it reads as a hole cut in the
             page rather than an object resting on it. */
          filter: "drop-shadow(0 18px 34px rgba(0,0,0,0.55))",
        }}
        initial={still ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 110, damping: 20 }}
      >
        {/* Back panel. Sets the height everything else positions against.

            420x300, not the 420x250 this started at. A closed bifold is around
            1.4:1; 1.68:1 is a credit card, and at that ratio the object read as
            exactly the card this redesign exists to stop being. */}
        <svg viewBox="0 0 420 300" className="block w-full" aria-hidden>
          {/* Its own grain, with its own id. The fold's defs cannot be reached
              from here — that is the cross-SVG paint-server problem noted
              below — and without any texture the interior of a midnight wallet
              is flat black, which reads as a hole the notes are falling into
              rather than the back of the object holding them. */}
          <defs>
            <filter
              id={backGrainId}
              x="0"
              y="0"
              width="100%"
              height="100%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.13"
                numOctaves="4"
                seed="4"
                result="n"
              />
              <feDiffuseLighting
                in="n"
                lightingColor="#FFFFFF"
                surfaceScale={1.1 * hide.grain}
                diffuseConstant="1"
                result="lit"
              >
                <feDistantLight azimuth="228" elevation="60" />
              </feDiffuseLighting>
              <feComposite
                in="lit"
                in2="SourceGraphic"
                operator="arithmetic"
                k1="0.85"
                k2="0"
                k3="0"
                k4="0"
              />
            </filter>
          </defs>
          <rect x="4" y="6" width="412" height="288" rx="18" fill={hide.outer[2]} />
          <rect x="10" y="12" width="400" height="276" rx="15" fill={hide.lining} />
          <rect
            x="10"
            y="12"
            width="400"
            height="276"
            rx="15"
            fill={hide.lining}
            filter={`url(#${backGrainId})`}
          />
          <rect x="10" y="12" width="400" height="276" rx="15" fill="#000" opacity="0.34" />
        </svg>

        {/* Notes in the bill compartment.

            The container is sized to a ₹500 and every other denomination draws
            itself shorter by the millimetres it really is, so a mixed stack has
            the ragged right edge real cash has. Tuned so about the top 40% of a
            note clears the fold: enough to read the denomination panel in the
            corner, little enough that the wallet is holding the money rather
            than wearing it. */}
        <div className="absolute inset-x-[16%] top-[10%] z-10 h-[43%]">
          {/* z-index runs backwards down the stack, so the LOWEST note is in
              front. In plain DOM order each note paints over the one behind it,
              and since every note but the topmost sits lower — and everything
              lower is already behind the fold — five notes render as a single
              slab. Ordering front-to-back is the difference between a stack you
              can count and a rectangle. It is set here rather than by reversing
              the array because the notes that fly in have to stay in landing
              order for their animation. */}
          {Array.from({ length: resting }).map((_, i) => (
            <div
              key={`rest-${i}`}
              className="absolute bottom-0 left-1/2"
              style={{
                width: `${widthPct(500)}%`,
                zIndex: stackSize - i,
                transform: `translateX(calc(-50% + ${drift(i)}px)) translateY(${
                  -i * step
                }px) rotate(${fan(i)}deg)`,
              }}
            >
              <Banknote value={500} className="block h-auto w-full" />
            </div>
          ))}

          <AnimatePresence>
            {depositing &&
              plan.flying.slice(0, landed).map((value, i) => (
                <motion.div
                  key={`fly-${i}-${value}`}
                  className="absolute bottom-0 left-1/2"
                  style={{ width: `${widthPct(value)}%`, zIndex: stackSize - (resting + i) }}
                  initial={
                    still
                      ? false
                      : { x: "-50%", y: -230, rotate: (i % 2 ? 1 : -1) * 24, opacity: 0, scale: 0.9 }
                  }
                  animate={{
                    x: `calc(-50% + ${drift(resting + i)}px)`,
                    y: -(resting + i) * step,
                    rotate: fan(resting + i),
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{ type: "spring", stiffness: 190, damping: 17, mass: 0.7 }}
                >
                  <Banknote value={value} className="block h-auto w-full" />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* The front fold, which lifts.
            Every paint server it uses is defined INSIDE it. A url(#…) paint
            reference cannot be relied on to resolve across separate inline SVG
            roots, and when it silently fails the leather does not paint at all
            — which is exactly what happened when these lived in the panel
            above. Keep defs and their users in the same <svg>. */}
        <motion.div
          className="absolute inset-x-0 bottom-0 z-20 origin-bottom"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: open && !still ? -26 : 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        >
          <svg
            viewBox="0 0 420 220"
            className="block w-full"
            role="img"
            aria-label="Your LAWFIC wallet"
          >
            <defs>
              <linearGradient id={gradOuter} x1="0.05" y1="0" x2="0.95" y2="1">
                <stop offset="0%" stopColor={hide.outer[0]} />
                <stop offset="50%" stopColor={hide.outer[1]} />
                <stop offset="100%" stopColor={hide.outer[2]} />
              </linearGradient>
              <linearGradient id={gradSheen} x1="0" y1="0" x2="0.65" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity={hide.sheen * 0.22} />
                <stop offset="52%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={gradMetal} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={plate.face[0]} />
                <stop offset="48%" stopColor={plate.face[1]} />
                <stop offset="100%" stopColor={plate.face[2]} />
              </linearGradient>

              {/* Corners of a used wallet are darker than its middle. */}
              <radialGradient id={vignetteId} cx="0.5" cy="0.42" r="0.75">
                <stop offset="55%" stopColor="#000000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
              </radialGradient>

              {/* Pebble grain. Low-frequency turbulence lit by one distant
                  light, multiplied back over the hide — a raised surface, not
                  a dusting of noise. surfaceScale is what makes a suede hide
                  softer than a hard-grain black one. */}
              {/* colorInterpolationFilters is sRGB, not the linearRGB an SVG
                  filter defaults to. In linear space the multiply below runs on
                  gamma-decoded values and is converted back, and near black
                  that curve is steep enough to pull a three-point channel
                  difference into a visible cast — the midnight hide (#2A2827:
                  R42 G40 B39) came out with a brown cloud across the lower half
                  of the wallet. */}
              <filter
                id={grainId}
                x="0"
                y="0"
                width="100%"
                height="100%"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.12"
                  numOctaves="4"
                  seed="9"
                  result="n"
                />
                <feDiffuseLighting
                  in="n"
                  lightingColor="#FFFFFF"
                  surfaceScale={1.9 * hide.grain}
                  diffuseConstant="1"
                  result="lit"
                >
                  <feDistantLight azimuth="228" elevation="58" />
                </feDiffuseLighting>
                <feComposite
                  in="lit"
                  in2="SourceGraphic"
                  operator="arithmetic"
                  k1="1"
                  k2="0"
                  k3="0"
                  k4="0"
                />
              </filter>
            </defs>

            {/* The hide, then the same shape lit into grain, then the sheen */}
            <rect x="4" y="2" width="412" height="214" rx="18" fill={`url(#${gradOuter})`} />
            <rect
              x="4"
              y="2"
              width="412"
              height="214"
              rx="18"
              fill={`url(#${gradOuter})`}
              filter={`url(#${grainId})`}
            />
            <rect x="4" y="2" width="412" height="214" rx="18" fill={`url(#${gradSheen})`} />
            <rect x="4" y="2" width="412" height="214" rx="18" fill={`url(#${vignetteId})`} />

            {/* Burnished edge. On a real wallet the cut edge is sanded, waxed
                and rubbed until it is darker and glossier than the face — it is
                the single detail that separates a finished piece from a cut
                rectangle, so it gets three strokes: the dark burnish, a waxed
                highlight just inside it, and the crisp outline. */}
            <rect
              x="4"
              y="2"
              width="412"
              height="214"
              rx="18"
              fill="none"
              stroke={hide.edge}
              strokeWidth="6"
            />
            <rect
              x="8"
              y="6"
              width="404"
              height="206"
              rx="15"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity={0.06 + hide.sheen * 0.08}
              strokeWidth="1"
            />
            <rect
              x="4"
              y="2"
              width="412"
              height="214"
              rx="18"
              fill="none"
              stroke="#000000"
              strokeOpacity="0.5"
              strokeWidth="1.2"
            />

            {/* The lit top edge. A folded piece of leather catches light along
                the fold, and without that line the flap is just a rounded
                rectangle sitting on another rounded rectangle — which is what
                kept making this read as a card. */}
            <path
              d="M4 20 A16 16 0 0 1 20 4 H400 A16 16 0 0 1 416 20"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity={0.12 + hide.sheen * 0.18}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Saddle stitch, inset the way a real one is. Two passes: the dark
                one is the recessed hole the thread sits in, the light one the
                waxed thread itself, offset a whisker so the stitches read as
                slanted rather than as a dashed line. A saddle stitch is sewn
                with two needles and it shows. */}
            <g strokeDasharray="5 5.5" strokeLinecap="round">
              <rect
                x="18"
                y="16"
                width="384"
                height="186"
                rx="12"
                fill="none"
                stroke="#000000"
                strokeOpacity="0.45"
                strokeWidth="3.4"
              />
              <rect
                x="18"
                y="15.2"
                width="384"
                height="186"
                rx="12"
                fill="none"
                stroke={thread}
                strokeWidth="2.1"
                opacity="0.92"
              />
            </g>

            {/* Metal nameplate, lower right, sunk into the leather */}
            <g transform="translate(244 150)">
              <rect
                x="-1.5"
                y="-1.5"
                width="155"
                height="43"
                rx="6"
                fill="#000000"
                opacity="0.4"
              />
              <rect width="152" height="40" rx="5" fill={`url(#${gradMetal})`} />
              <rect
                width="152"
                height="40"
                rx="5"
                fill="none"
                stroke={plate.rim}
                strokeWidth="1.2"
              />
              <text
                x="76"
                y="25.5"
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
                fontSize={look.nameplate.length > 14 ? 10.5 : 12.5}
                letterSpacing="1.5"
                fill={plate.letter}
              >
                {look.nameplate || "LAWFIC"}
              </text>
            </g>

            {/* Blind-embossed mark, lower left. Blind means no ink: the mark is
                pressed into the hide, so it is drawn as a shadow with a
                highlight a hair below rather than as coloured text. */}
            <g fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2.6">
              <text x="32" y="182" fill="#000000" opacity="0.45">
                LAWFIC
              </text>
              <text x="32" y="183" fill="#FFFFFF" opacity={0.07 + hide.sheen * 0.08}>
                LAWFIC
              </text>
            </g>
          </svg>
        </motion.div>

        {/* Balance, sitting on the leather above the nameplate. The padding is
            a percentage because it has to clear the nameplate, and the plate is
            placed in the fold's viewBox — so it scales with the wallet's width
            while a pixel padding would not. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-8 pb-[30%]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p
                className="font-mono text-[9.5px] uppercase tracking-[0.22em]"
                style={{ color: hide.inkSoft }}
              >
                Balance
              </p>
              <p
                className="mt-1 font-mono text-[clamp(23px,6vw,32px)] font-semibold leading-none tabular-nums"
                style={{ color: hide.ink }}
              >
                {shownText}
              </p>
            </div>
            <div className="pb-1">
              <WalletAvatar seed={look.avatarSeed} size={38} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* What landed, in words. The animation is not the only record of it. */}
      <AnimatePresence>
        {depositing && runs.length > 0 && (
          <motion.p
            initial={still ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="mt-4 text-center font-mono text-[12px] text-muted"
          >
            {describeBreakdown(runs)}
            {/* Only worth a total when there is more than one denomination to
                add up. On a single run it just repeats the line before it —
                "20 × ₹500 · 20 notes in". */}
            {plan.grouped > 0 && runs.length > 1 && ` · ${plan.total} notes in`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
