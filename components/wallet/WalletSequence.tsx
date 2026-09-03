"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { Hide } from "@/lib/wallet-leather";

/**
 * The wallet as a scrubbed frame sequence: unzip, then unfold.
 *
 * Twelve stills per hide, played in order, which is how every product page you
 * have ever seen do this actually does it — Apple's scroll-driven hardware
 * shots are frame sequences, not 3D. It gets you photographic lighting and real
 * hardware moving, for the price of some images and none of a WebGL runtime.
 *
 *   1–5   the zip: closed, pull engaged, slider moving, almost open, fully open
 *   6–11  the fold: hold and lift, pull apart, left side, right side, mostly,
 *         fully open
 *   12    open, with the notes in the compartment
 *
 * PLAIN <img>, NOT next/image, AND THAT IS DELIBERATE
 *
 * next/image optimises on demand, so a hundred and twenty frames is a hundred
 * and twenty optimiser round trips the first time each is seen, and on Vercel
 * it is a hundred and twenty billable transformations. For a sequence the
 * frames are known ahead of time and identical for everyone, so they are
 * pre-compressed and served straight from /public. The two-state fallback still
 * uses next/image, where on-demand sizing is worth having.
 *
 * NOTHING ANIMATES UNTIL EVERY FRAME IS DECODED
 *
 * A sequence that starts playing while frames are still arriving does not look
 * like a wallet opening, it looks like a broken GIF — and it is worse on the
 * slow connection where it is most likely to happen. So the sequence stays a
 * still until all twelve are in cache, and a tap before then jumps straight to
 * the open frame. Slower to become interactive, never ugly.
 *
 * DRAG SCRUBS IT
 *
 * Because a zip is a thing you pull. Dragging maps distance onto frames so the
 * hardware tracks your finger; releasing past the midpoint completes the
 * opening, releasing before it returns. A click still works and plays the whole
 * thing, since not everyone will think to drag and it must not be the only way
 * in.
 */

/** Frames per hide. Every sequence is exported at this length. */
export const FRAMES = 12;

/** How long a click-driven play takes, in ms. */
const PLAY_MS = 620;

/** Drag distance, in px, that covers the whole sequence. */
const DRAG_SPAN = 260;

export type WalletSequenceProps = {
  hide: Hide;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rendered when the sequence is unavailable. */
  fallback: React.ReactNode;
  className?: string;
};

const frameSrc = (photo: string, i: number) =>
  `/wallet/${photo}/${String(i + 1).padStart(2, "0")}.jpg`;

export default function WalletSequence({
  hide,
  open,
  onOpenChange,
  fallback,
  className = "",
}: WalletSequenceProps) {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState(open ? FRAMES - 1 : 0);
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const raf = useRef<number | null>(null);
  const drag = useRef<{ x: number; from: number } | null>(null);

  /* Decode every frame for this hide before allowing the sequence to move.
     Changing hide starts again, and only the selected hide is ever fetched —
     ten sequences eagerly loaded would be most of a phone's data allowance. */
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setMissing(false);

    const load = (i: number) =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(frameSrc(hide.photo, i)));
        img.src = frameSrc(hide.photo, i);
      });

    Promise.all(Array.from({ length: FRAMES }, (_, i) => load(i)))
      .then(() => !cancelled && setReady(true))
      .catch(() => !cancelled && setMissing(true));

    return () => {
      cancelled = true;
    };
  }, [hide.photo]);

  const stop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };
  useEffect(() => stop, []);

  /* playTo reads the live frame without re-creating itself every frame. */
  const frameRef = useRef(frame);
  frameRef.current = frame;

  /** Run the sequence to `to`, from wherever it currently is. */
  const playTo = useCallback(
    (to: number) => {
      stop();
      if (reduced || !ready) {
        setFrame(to);
        return;
      }
      const from = frameRef.current;
      const distance = Math.abs(to - from);
      if (distance === 0) return;
      const duration = (PLAY_MS * distance) / (FRAMES - 1);
      const t0 = performance.now();

      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        /* Eased rather than linear: a zip starts slow, runs, and arrives. */
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        setFrame(Math.round(from + (to - from) * e));
        if (p < 1) raf.current = requestAnimationFrame(step);
        else raf.current = null;
      };
      raf.current = requestAnimationFrame(step);
    },
    [reduced, ready],
  );

  /* Follow the controlled prop — the skin selector and anything else can open
     or shut the wallet without going through this component. */
  useEffect(() => {
    playTo(open ? FRAMES - 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ready]);

  if (missing) return <>{fallback}</>;

  const onPointerDown = (e: React.PointerEvent) => {
    if (!ready) return;
    stop();
    drag.current = { x: e.clientX, from: frameRef.current };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const delta = ((e.clientX - d.x) / DRAG_SPAN) * (FRAMES - 1);
    setFrame(Math.max(0, Math.min(FRAMES - 1, Math.round(d.from + delta))));
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    /* Moved barely at all? Treat it as a tap and toggle. */
    if (Math.abs(frameRef.current - d.from) < 1) return onOpenChange(!open);
    onOpenChange(frameRef.current > (FRAMES - 1) / 2);
  };

  return (
    <div
      className={`relative mx-auto w-full ${className}`}
      style={{ maxWidth: "clamp(340px, 94vw, 1060px)" }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={open ? "Close your wallet" : "Open your wallet"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenChange(!open);
          }
        }}
        className="relative w-full cursor-grab overflow-hidden rounded-2xl active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        style={{ aspectRatio: "3 / 2", touchAction: "pan-y" }}
      >
        {/* Every frame is in the DOM and only one is visible. Swapping the src
            of a single element makes the browser drop the decoded bitmap and
            decode again on the way back, which is what makes naive sequence
            players flicker on the return pass. */}
        {Array.from({ length: FRAMES }, (_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={frameSrc(hide.photo, i)}
            alt={
              i === FRAMES - 1
                ? `${hide.name} LAWFIC wallet, open, with rupee notes in the bill compartment`
                : ""
            }
            aria-hidden={i !== frame}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover"
            style={{ opacity: i === frame ? 1 : 0 }}
          />
        ))}
      </div>

      <p
        className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.24em]"
        style={{ color: "var(--wallet-fg-muted)", opacity: open ? 0 : 0.5 }}
        aria-hidden
      >
        {ready ? "Drag the zip to open" : "Loading the wallet"}
      </p>
    </div>
  );
}
