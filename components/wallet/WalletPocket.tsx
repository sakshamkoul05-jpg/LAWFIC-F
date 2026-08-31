"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Physical wallet pocket — a curved container with a serrated top edge
 * that the card sits inside. The card peeks out from behind the pocket rim.
 *
 * Click the card to pull it out (spring animation). Click again to put it back.
 * The pocket adapts to light/dark via CSS variables.
 */
export default function WalletPocket({
  children,
  actions,
  cardOut,
  onToggleCard,
  className = "",
}: {
  children: ReactNode;
  actions?: ReactNode;
  cardOut: boolean;
  onToggleCard: () => void;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div className={`relative ${className}`}>
      {/* The pocket */}
      <div
        className="relative overflow-visible rounded-b-[2rem] rounded-t-[1rem] px-4 pt-4 pb-6 sm:px-5 sm:pt-5 sm:pb-7"
        style={{
          background: "var(--wallet-pocket-bg)",
          border: "1px solid var(--wallet-pocket-border)",
          boxShadow: "var(--wallet-pocket-shadow)",
        }}
      >
        {/* Pocket rim — serrated top edge */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden rounded-t-[1rem]">
          {/* Zigzag/serrated pattern */}
          <svg
            className="absolute top-0 left-0 w-full"
            viewBox="0 0 400 8"
            preserveAspectRatio="none"
            style={{ height: "8px" }}
            aria-hidden
          >
            <path
              d="M0,8 L0,4 L10,0 L20,4 L30,0 L40,4 L50,0 L60,4 L70,0 L80,4 L90,0 L100,4 L110,0 L120,4 L130,0 L140,4 L150,0 L160,4 L170,0 L180,4 L190,0 L200,4 L210,0 L220,4 L230,0 L240,4 L250,0 L260,4 L270,0 L280,4 L290,0 L300,4 L310,0 L320,4 L330,0 L340,4 L350,0 L360,4 L370,0 L380,4 L390,0 L400,4 L400,8 Z"
              fill="var(--wallet-pocket-bg)"
            />
          </svg>
          {/* Rim highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[1rem]"
            style={{ background: "var(--wallet-pocket-rim)" }}
          />
        </div>

        {/* Card — pulls out on click */}
        <motion.div
          className="relative z-10 cursor-pointer"
          onClick={onToggleCard}
          animate={
            cardOut
              ? { y: -60, scale: 1.03 }
              : { y: 0, scale: 1 }
          }
          transition={
            reduced
              ? { duration: 0.01 }
              : { type: "spring", stiffness: 180, damping: 22, mass: 0.8 }
          }
        >
          {children}
        </motion.div>

        {/* Actions inside the pocket body */}
        {actions && (
          <motion.div
            className="mt-4"
            animate={cardOut ? { opacity: 1, y: 0 } : { opacity: 0.7, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            {actions}
          </motion.div>
        )}
      </div>

      {/* Hint text */}
      <p className="mt-3 text-center text-[11px] opacity-40">
        {cardOut ? "Click the card to put it back" : "Click the card to pull it out"}
      </p>
    </div>
  );
}
