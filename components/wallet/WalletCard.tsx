"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { formatPaise } from "@/lib/money";
import { getEntity, getFinish, type WalletPrefs } from "@/lib/wallet-custom";
import { signatureFor, type CategorySpend } from "@/lib/wallet-card";
import CardSignature from "./CardSignature";
import WalletAvatar from "./WalletAvatar";

export type CardPhase = "idle" | "forming" | "settled";

/**
 * The card face.
 *
 * It carries three things that differ between holders, and only one of them
 * was chosen from a menu:
 *
 *   - the ENTITY's statutory identifier — a company shows a CIN where an
 *     individual shows a PAN, so the card states a different fact per holder;
 *   - the FINISH, the one openly cosmetic pick;
 *   - the SIGNATURE, generated from the account id and the customer's real
 *     filing history, so no two cards are alike and a card earns its
 *     appearance instead of selecting it.
 *
 * The ground stays warm ink in every case. Variety comes from the signature,
 * not from five unrelated gradients — that is what kept the old card types
 * from ever looking like one product.
 */
export default function WalletCard({
  prefs,
  balancePaise,
  accountId = "guest",
  spend = {},
  holderName,
  statutoryId,
  phase = "idle",
  animateBalance = false,
  className = "",
}: {
  prefs: WalletPrefs;
  balancePaise: number;
  /** Seeds the guilloché — stable per account. */
  accountId?: string;
  /** Real paise spent per service category. */
  spend?: CategorySpend;
  holderName?: string;
  /** The holder's real identifier, when we have one on file. */
  statutoryId?: string;
  phase?: CardPhase;
  animateBalance?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const entity = getEntity(prefs.entity) ?? getEntity("individual")!;
  const finish = getFinish(prefs.finish) ?? getFinish("matte")!;
  const signature = signatureFor(accountId, spend);

  const shown = useMotionValue(balancePaise);
  const [shownText, setShownText] = useState(formatPaise(balancePaise));
  useEffect(() => {
    const unsub = shown.on("change", (v) => setShownText(formatPaise(Math.round(v))));
    return () => unsub();
  }, [shown]);
  useEffect(() => {
    if (!animateBalance || reduced) {
      shown.set(balancePaise);
      return;
    }
    shown.set(0);
    const c = animate(shown, balancePaise, { duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 });
    return () => c.stop();
  }, [balancePaise, animateBalance, reduced, shown]);
  const balanceLabel = animateBalance ? shownText : formatPaise(balancePaise);

  /* Pointer tilt: the card leans toward the cursor with a specular highlight
     tracking it, on springs so it settles rather than snaps. Inert under
     reduced motion and without a fine pointer — a phone would otherwise leave
     the card stuck at whatever angle the last tap implied. */
  const faceRef = useRef<HTMLDivElement>(null);
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);
  const tiltActive = canHover && !reduced;

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 220, damping: 22, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 220, damping: 22, mass: 0.6 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-9, 9]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [7, -7]);
  const glareX = useTransform(sx, [-0.5, 0.5], ["18%", "82%"]);
  const glareY = useTransform(sy, [-0.5, 0.5], ["12%", "88%"]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!tiltActive) return;
    const el = faceRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const resetTilt = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      className={`relative aspect-[1.586] w-full max-w-sm select-none ${className}`}
      style={{ perspective: 1200 }}
      initial={reduced ? false : { opacity: 0, y: 40, rotateX: -12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
    >
      <motion.div
        ref={faceRef}
        onPointerMove={onPointerMove}
        onPointerLeave={resetTilt}
        className="absolute inset-0 overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #3A3630 0%, #2C2823 45%, #211E1A 100%)",
          rotateX: tiltActive ? rotateX : 0,
          rotateY: tiltActive ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        animate={
          phase === "forming"
            ? { boxShadow: "0 24px 80px -20px rgba(208,174,85,0.25), inset 0 0 0 1px rgba(208,174,85,0.2)" }
            : phase === "settled"
              ? { scale: 1.01, boxShadow: "0 28px 80px -20px rgba(208,174,85,0.3)" }
              : { scale: 1, boxShadow: "var(--wallet-card-shadow)" }
        }
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <CardSignature signature={signature} finish={finish} />

        {tiltActive && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(180px circle at var(--gx) var(--gy), rgba(208,174,85,0.16), transparent 70%)",
              ["--gx" as string]: glareX,
              ["--gy" as string]: glareY,
            }}
            aria-hidden
          />
        )}

        <AnimatePresence>
          {phase === "settled" && !reduced && (
            <motion.div
              className="pointer-events-none absolute inset-y-0 left-0 w-1/4"
              style={{ background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.18), transparent)" }}
              initial={{ x: "-150%" }}
              animate={{ x: "500%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              aria-hidden
            />
          )}
        </AnimatePresence>

        <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div
              className="h-7 w-10 rounded-md"
              style={{
                background: "linear-gradient(135deg, #E8C86A 0%, #D0AE55 35%, #A8842F 70%, #7A5E14 100%)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.18)",
              }}
              aria-hidden
            >
              <div className="flex h-full flex-col justify-center gap-[2px] px-1.5">
                <div className="h-px rounded-full bg-black/20" />
                <div className="h-px rounded-full bg-black/20" />
                <div className="h-px rounded-full bg-black/20" />
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D0AE55]/75">
              {entity.name}
            </span>
          </div>

          <div className="flex flex-1 items-center gap-4">
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.25 }}
              className="rounded-full"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}
            >
              <WalletAvatar seed={prefs.avatarSeed} size={52} />
            </motion.div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold tracking-tight text-[#F3EFE8]">
                {holderName || "LAWFiC"}
              </p>
              {/* The statutory identifier is what actually differs between
                  entity types. Until one is on file we show its shape, not a
                  fake number. */}
              <p className="mt-0.5 font-mono text-[10px] tracking-[0.08em] text-[#F3EFE8]/45">
                <span className="text-[#D0AE55]/70">{entity.idLabel}</span>{" "}
                {statutoryId || entity.idFormat}
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#F3EFE8]/45">Balance</p>
              <p className="mt-0.5 font-mono text-[clamp(26px,5.5vw,34px)] font-semibold leading-none tabular-nums tracking-tight text-[#D0AE55]">
                {balanceLabel}
              </p>
            </div>
            {signature.blank && (
              <p className="max-w-[38%] text-right text-[9.5px] leading-tight text-[#F3EFE8]/35">
                Your card marks itself as you file
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
