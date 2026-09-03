"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { Hide } from "@/lib/wallet-leather";

/**
 * The wallet, as photography.
 *
 * WHY THIS REPLACED A DRAWN ONE
 *
 * Six rounds went into drawing this object in CSS and SVG — pebble grain from
 * lit turbulence, real edge surfaces, a hinged fold, a three-quarter camera —
 * and it never survived comparison to a photograph, because nothing drawn by
 * hand in a medium with no concept of geometry or materials ever will. The
 * ceiling was the medium, not the effort. A product shot clears it instantly.
 *
 * The drawn wallet is still in the tree and still used: see the fallback below.
 * It is not dead code and should not be deleted.
 *
 * WHAT THE PHOTOGRAPHS COST US
 *
 * The nameplate. Every wallet in the range is embossed LAWFIC in the leather,
 * so a customer's own name cannot appear on one — you cannot stamp a
 * photograph. That was a real feature and it is gone, deliberately, because the
 * object being believable is worth more than the object being personalised.
 * `nameplate` is still stored and still edited; it simply is not shown here.
 *
 * The notes are in the photographs rather than drawn, so `CurrencyStack` is not
 * used in this path either. The licence for the imagery covers them.
 *
 * FAILING TO A DRAWING RATHER THAN TO A HOLE
 *
 * A missing file is detected on the client and falls back to the drawn wallet,
 * because a hero that renders as a broken image icon is worse than one that
 * renders as the old version. That matters most for a hide added to the range
 * before its photography is shot — the site keeps working that day rather than
 * the day the photographer delivers.
 */

export type WalletPhotoProps = {
  hide: Hide;
  open: boolean;
  onToggle?: () => void;
  /** Rendered when a photograph is missing. */
  fallback: React.ReactNode;
  className?: string;
};

export default function WalletPhoto({
  hide,
  open,
  onToggle,
  fallback,
  className = "",
}: WalletPhotoProps) {
  const reduced = useReducedMotion();
  const [broken, setBroken] = useState<Record<string, true>>({});
  const [hover, setHover] = useState(false);

  const closedSrc = `/wallet/${hide.photo}-closed.jpg`;
  const openSrc = `/wallet/${hide.photo}-open.jpg`;
  const src = open ? openSrc : closedSrc;

  /* If either state of a hide is missing, use the drawing for BOTH. Switching
     media halfway through opening a wallet is more jarring than either medium
     on its own. */
  if (broken[closedSrc] || broken[openSrc]) return <>{fallback}</>;

  return (
    <div className={`relative mx-auto w-full ${className}`} style={{ maxWidth: "clamp(340px, 94vw, 1060px)" }}>
      <button
        type="button"
        onClick={onToggle}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        aria-expanded={open}
        aria-label={open ? "Close your wallet" : "Open your wallet"}
        className="block w-full cursor-pointer rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <motion.div
          className="relative w-full overflow-hidden rounded-2xl"
          style={{ aspectRatio: "3 / 2" }}
          animate={{ scale: hover && !reduced ? 1.012 : 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={src}
              className="absolute inset-0"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.42, ease: [0.4, 0, 0.2, 1] }}
            >
              <Image
                src={src}
                alt={
                  open
                    ? `${hide.name} LAWFIC wallet, open, with rupee notes in the bill compartment`
                    : `${hide.name} LAWFIC wallet, closed`
                }
                fill
                /* The wallet is the widest thing on the page at every size, so
                   it is never a thumbnail and the browser should not fetch one. */
                sizes="(max-width: 1024px) 94vw, 1060px"
                priority={!open}
                className="object-cover"
                onError={() => setBroken((b) => ({ ...b, [src]: true }))}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </button>

      {/* Preload the other state so the first click is not a blank frame. */}
      <Preload src={open ? closedSrc : openSrc} />
    </div>
  );
}

/**
 * A one-pixel, hidden copy of the state we are not showing.
 *
 * `<link rel=preload>` would be tidier but Next rewrites these URLs through the
 * image optimiser, so the only reliable way to warm exactly the variant that
 * will be requested is to ask for it the same way the real one is asked for.
 */
function Preload({ src }: { src: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
      <Image src={src} alt="" width={1060} height={707} sizes="1060px" />
    </div>
  );
}
