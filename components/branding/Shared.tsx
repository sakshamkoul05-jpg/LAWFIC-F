"use client";

import { motion, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { sitePreview, type AppProject, type SiteProject } from "@/lib/branding";

/** The time in India, ticking — the studio's clock in the hero and the footer. */
export function IndiaTime() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
    const tick = () => setT(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{t ?? "—"}</span>;
}

/** Leans toward the cursor; the label inside leans a little further. */
export function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const reduced = !!useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 15, mass: 0.6 });
  const y = useSpring(0, { stiffness: 220, damping: 15, mass: 0.6 });
  return (
    <motion.span
      ref={ref}
      className="inline-block"
      style={{ x, y }}
      onMouseMove={(e) => {
        if (reduced || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/**
 * A website's homepage. Shows the domain set in type until a real capture has
 * loaded (see sitePreview for why the width is checked).
 */
export function SiteShot({
  site,
  className = "",
  eager = false,
  bare = false,
}: {
  site: SiteProject;
  className?: string;
  eager?: boolean;
  /** Leave out the fallback's own browser bar (the frame already has one). */
  bare?: boolean;
}) {
  const img = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const check = () => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth >= 600) setReady(true);
  };
  /* The image may finish before hydration attaches onLoad. */
  useEffect(check, []);
  return (
    <span className={`relative block overflow-hidden bg-surface-2 [container-type:inline-size] ${className}`}>
      <span
        className={`absolute inset-0 flex flex-col transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
        aria-hidden
      >
        {!bare && (
          <span className="flex h-[9%] min-h-3 items-center gap-[3%] border-b border-border px-[4%]">
            {[0, 1, 2].map((d) => (
              <span key={d} className="aspect-square h-[34%] rounded-full bg-border-3" />
            ))}
          </span>
        )}
        <span className="flex flex-1 items-center justify-center px-[8%] text-center text-[clamp(0.7rem,2.4cqw,1.6rem)] font-medium tracking-[-0.03em] text-muted">
          {site.domain}
        </span>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        src={sitePreview(site)}
        alt=""
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={check}
        className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}

/** A Play Store icon, or a lettered tile if Google's image URL has moved. */
export function AppIcon({ app, className = "" }: { app: AppProject; className?: string }) {
  const [broken, setBroken] = useState(!app.icon);
  return broken ? (
    <span
      className={`flex items-center justify-center rounded-[22%] bg-foreground font-semibold tracking-[-0.04em] text-background ${className}`}
    >
      {app.mono}
    </span>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={app.icon}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={`rounded-[22%] object-cover ${className}`}
    />
  );
}

/** True with a mouse or trackpad; false on touch screens. */
export function usePointerFine() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const on = () => setFine(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return fine;
}
