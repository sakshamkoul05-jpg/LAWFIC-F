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
import { getCardType, type WalletPrefs } from "@/lib/wallet-custom";
import WalletAvatar from "./WalletAvatar";

export type CardPhase = "idle" | "forming" | "settled";

export default function WalletCard({
  prefs,
  balancePaise,
  phase = "idle",
  animateBalance = false,
  className = "",
}: {
  prefs: WalletPrefs;
  balancePaise: number;
  phase?: CardPhase;
  animateBalance?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ct = getCardType(prefs.cardType) ?? getCardType("standard")!;

  const shown = useMotionValue(balancePaise);
  const [shownText, setShownText] = useState(formatPaise(balancePaise));
  useEffect(() => {
    const unsub = shown.on("change", (v) => setShownText(formatPaise(Math.round(v))));
    return () => unsub();
  }, [shown]);
  useEffect(() => {
    if (!animateBalance || reduced) { shown.set(balancePaise); return; }
    shown.set(0);
    const c = animate(shown, balancePaise, { duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 });
    return () => c.stop();
  }, [balancePaise, animateBalance, reduced, shown]);
  const balanceLabel = animateBalance ? shownText : formatPaise(balancePaise);

  /* Pointer tilt.
     The card leans towards the cursor and a specular highlight tracks it, so
     the surface reads as something physical catching a light rather than a
     flat rectangle. Springs rather than raw values, so it settles instead of
     snapping, and the whole thing is inert under reduced motion or on a
     device with no hover — a phone would otherwise leave the card stuck at
     whatever angle the last tap implied. */
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
          background: ct.gradient,
          rotateX: tiltActive ? rotateX : 0,
          rotateY: tiltActive ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        animate={
          phase === "forming"
            ? { boxShadow: `0 24px 80px -20px ${ct.accent}40, inset 0 0 0 1px ${ct.accent}30` }
            : phase === "settled"
              ? { scale: 1.01, boxShadow: `0 28px 80px -20px ${ct.accent}50` }
              : { scale: 1, boxShadow: "var(--wallet-card-shadow)" }
        }
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Subtle texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
          aria-hidden
        />

        {/* Inner edge — very subtle */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1)" }}
          aria-hidden
        />

        {/* Specular highlight that follows the pointer. */}
        {tiltActive && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(180px circle at var(--gx) var(--gy), ${ct.accent}22, transparent 70%)`,
              ["--gx" as string]: glareX,
              ["--gy" as string]: glareY,
            }}
            aria-hidden
          />
        )}

        {/* Shine sweep on settle */}
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

        {/* Card content */}
        <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
          {/* Top: chip + type */}
          <div className="flex items-start justify-between">
            <div
              className="h-7 w-10 rounded-md"
              style={{
                background: ct.chipGradient,
                boxShadow: "0 1px 4px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.15)",
              }}
              aria-hidden
            >
              <div className="flex h-full flex-col justify-center gap-[2px] px-1.5">
                <div className="h-px rounded-full bg-black/20" />
                <div className="h-px rounded-full bg-black/20" />
                <div className="h-px rounded-full bg-black/20" />
              </div>
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: ct.accentSub }}
            >
              {ct.name}
            </span>
          </div>

          {/* Center: avatar + brand */}
          <div className="flex flex-1 items-center gap-4">
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.25 }}
              className="rounded-full"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
            >
              <WalletAvatar seed={prefs.avatarSeed} size={52} />
            </motion.div>
            <div>
              <span className="text-[14px] font-semibold tracking-tight" style={{ color: ct.accent }}>
                LAWFiC
              </span>
              <p className="text-[10px]" style={{ color: ct.accentSub }}>
                {prefs.cardType === "advocate"
                  ? "Advocate"
                  : prefs.cardType === "business"
                    ? "Business"
                    : prefs.cardType === "student"
                      ? "Student"
                      : "Member"}
              </p>
            </div>
          </div>

          {/* Bottom: balance */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: ct.accentSub }}>
              Balance
            </p>
            <p
              className="mt-0.5 text-[clamp(28px,6vw,36px)] font-semibold leading-none tabular-nums tracking-tight"
              style={{ color: ct.accent }}
            >
              {balanceLabel}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
