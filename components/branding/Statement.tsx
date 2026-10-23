"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

/**
 * A paragraph that is read as it is scrolled: each word comes up from grey to
 * full ink as it passes through the middle of the screen. Under reduced
 * motion it is simply a paragraph.
 */

function Word({ progress, from, to, children }: { progress: MotionValue<number>; from: number; to: number; children: string }) {
  const opacity = useTransform(progress, [from, to], [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{" "}
    </motion.span>
  );
}

export default function Statement({ text }: { text: string }) {
  const reduced = !!useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = text.split(" ");
  const cls =
    "max-w-[30ch] text-[clamp(1.65rem,3.9vw,3.6rem)] font-medium leading-[1.1] tracking-[-0.04em] text-foreground";

  if (reduced) return <p className={cls}>{text}</p>;
  return (
    <p ref={ref} className={cls}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} from={i / words.length} to={(i + 1) / words.length}>
          {w}
        </Word>
      ))}
    </p>
  );
}
