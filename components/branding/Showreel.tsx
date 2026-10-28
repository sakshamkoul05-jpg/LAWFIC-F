"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { SITES, WEBSITES_DELIVERED, type SiteProject } from "@/lib/branding";
import { SiteShot } from "./Shared";
import QuoteButton from "./QuoteButton";
import Reel, { REEL_CARD_W, ReelSide } from "./Reel";

/**
 * The recent websites as a showreel: one large browser window each, carried
 * past sideways as the page scrolls, each homepage sliding a little inside its
 * frame for depth.
 */

function Card({ site, i, progress }: { site: SiteProject; i: number; progress: MotionValue<number> }) {
  const shift = useTransform(progress, [0, 1], ["5%", "-5%"]);
  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="Visit"
      className={`group block ${REEL_CARD_W} shrink-0 focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-foreground`}
    >
      <div className="mb-4 flex items-baseline justify-between gap-4 text-[14px] text-muted">
        <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
        <span>{site.kind}</span>
      </div>
      <div className="overflow-hidden rounded-[clamp(12px,1.6vw,22px)] border border-border-2 bg-surface shadow-[0_50px_100px_-50px_rgba(0,0,0,0.45)]">
        <div className="flex h-9 items-center gap-3 border-b border-border px-4">
          <span className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((d) => (
              <span key={d} className="size-2.5 rounded-full bg-border-3" />
            ))}
          </span>
          <span className="mx-auto truncate rounded-full bg-surface-2 px-4 py-1 text-[12px] text-muted">{site.domain}</span>
          <span className="w-10" aria-hidden />
        </div>
        <div className="relative aspect-[16/10] overflow-hidden">
          <motion.div className="absolute inset-y-0 -left-[6%] w-[112%]" style={{ x: shift }}>
            <SiteShot site={site} bare className="size-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
          </motion.div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="text-[clamp(1.5rem,2.8vw,2.6rem)] font-medium leading-none tracking-[-0.045em] text-foreground">{site.domain}</span>
        <span className="max-w-[36ch] text-[14.5px] leading-snug text-muted">{site.line}</span>
      </div>
    </a>
  );
}

export default function Showreel() {
  return (
    <Reel
      label="Recent websites delivered"
      count={SITES.length}
      intro={
        <ReelSide>
          <h2 className="text-[clamp(2.4rem,5.4vw,5rem)] font-medium leading-[0.95] tracking-[-0.055em] text-foreground">
            Recent websites
            <br />
            delivered
          </h2>
          <p className="mt-6 max-w-[30ch] text-[15.5px] leading-relaxed text-muted">
            {WEBSITES_DELIVERED} websites delivered so far. These are some of the latest, each one live and running its business
            today.
          </p>
        </ReelSide>
      }
      outro={
        <ReelSide>
          <p className="text-[clamp(2rem,4.4vw,4rem)] font-medium leading-[0.98] tracking-[-0.05em] text-foreground">
            Part of {WEBSITES_DELIVERED} websites delivered to customers.
          </p>
          <div className="mt-8">
            <QuoteButton service="web" label="Start yours" />
          </div>
        </ReelSide>
      }
      cards={(p) => SITES.map((s, i) => <Card key={s.domain} site={s} i={i} progress={p} />)}
    />
  );
}
