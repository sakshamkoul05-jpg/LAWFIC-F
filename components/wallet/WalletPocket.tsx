"use client";

import { motion, useReducedMotion } from "motion/react";
import { type ReactNode } from "react";

/**
 * Physical card pocket — the card sits inside with a serrated top edge.
 * Click to pull the card out; click again to put it back.
 * All motion respects prefers-reduced-motion.
 */
export default function WalletPocket({
  cardOut,
  onToggleCard,
  children,
  actions,
}: {
  cardOut: boolean;
  onToggleCard: () => void;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="wallet-pocket relative px-4 pt-6 pb-5 sm:px-6">
      {/* Serrated top edge */}
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 w-full"
        height="10"
        preserveAspectRatio="none"
        viewBox="0 0 400 10"
        aria-hidden
      >
        <path
          d="M0,10 L5,0 L10,10 L15,0 L20,10 L25,0 L30,10 L35,0 L40,10 L45,0 L50,10 L55,0 L60,10 L65,0 L70,10 L75,0 L80,10 L85,0 L90,10 L95,0 L100,10 L105,0 L110,10 L115,0 L120,10 L125,0 L130,10 L135,0 L140,10 L145,0 L150,10 L155,0 L160,10 L165,0 L170,10 L175,0 L180,10 L185,0 L190,10 L195,0 L200,10 L205,0 L210,10 L215,0 L220,10 L225,0 L230,10 L235,0 L240,10 L245,0 L250,10 L255,0 L260,10 L265,0 L270,10 L275,0 L280,10 L285,0 L290,10 L295,0 L300,10 L305,0 L310,10 L315,0 L320,10 L325,0 L330,10 L335,0 L340,10 L345,0 L350,10 L355,0 L360,10 L365,0 L370,10 L375,0 L380,10 L385,0 L390,10 L395,0 L400,10"
          fill="none"
          stroke="var(--wallet-divider)"
          strokeWidth="1"
        />
      </svg>

      {/* Card + actions */}
      <motion.div
        animate={cardOut ? { y: -16 } : { y: 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 260, damping: 24, mass: 0.8 }
        }
        className="cursor-pointer"
        onClick={onToggleCard}
      >
        {children}
      </motion.div>

      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
}
