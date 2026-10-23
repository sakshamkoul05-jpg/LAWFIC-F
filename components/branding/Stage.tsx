"use client";

import Lenis from "lenis";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { APPS, INTRO_KEY, SITES } from "@/lib/branding";
import { usePointerFine } from "./Shared";

/**
 * The stage the studio page plays on: an intro curtain, smooth scrolling and
 * the page's own cursor. All three switch off under reduced motion; the
 * cursor also needs a mouse, and the intro plays once per visit.
 */

/* ── shared state: has the intro finished, and the scroller ─────────────── */

let introDone = false;
const listeners = new Set<() => void>();
function markIntroDone() {
  introDone = true;
  listeners.forEach((f) => f());
}
export function useIntroDone() {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    () => introDone,
    () => false,
  );
}

let lenis: Lenis | null = null;
/** Scroll to an element through the smooth scroller when it is running. */
export function studioScrollTo(el: HTMLElement | null, offset = -110) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}


/* ── the intro ─────────────────────────────────────────────────────────── */

const FLASH = [...SITES.map((s) => s.domain), ...APPS.map((a) => a.name.replace(/ — .*/, ""))];

function Intro() {
  const reduced = !!useReducedMotion();
  const [phase, setPhase] = useState<"count" | "leave" | "gone">("count");
  const [n, setN] = useState(0);
  const [word, setWord] = useState(0);

  useEffect(() => {
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(INTRO_KEY);
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}
    if (reduced || seen) {
      setPhase("gone");
      markIntroDone();
      return;
    }
    lenis?.stop();
    const start = performance.now();
    const D = 1900;
    let raf = 0;
    let leave: ReturnType<typeof setTimeout>;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / D);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else
        leave = setTimeout(() => {
          setPhase("leave");
          markIntroDone();
          lenis?.start();
        }, 220);
    };
    raf = requestAnimationFrame(tick);
    const w = setInterval(() => setWord((v) => v + 1), 130);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(w);
      clearTimeout(leave);
      lenis?.start();
    };
  }, [reduced]);

  if (phase === "gone") return null;
  return (
    <motion.div
      className="studio-intro fixed inset-0 z-[200] text-background"
      initial={false}
      animate={{ y: phase === "leave" ? "-122%" : "0%" }}
      transition={{ duration: 1.15, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => phase === "leave" && setPhase("gone")}
      aria-hidden
    >
      <div className="absolute inset-0 bg-foreground" />
      {/* the curved lip the curtain drags behind it */}
      <motion.div
        className="absolute inset-x-[-10%] top-[99.5%] h-[18vh] rounded-b-[50%] bg-foreground"
        initial={false}
        animate={{ scaleY: phase === "leave" ? 1 : 0 }}
        style={{ originY: 0 }}
        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
      />
      <div className="relative flex h-full flex-col justify-between p-5 sm:p-10">
        <div className="flex items-center justify-between text-[14px] text-background/70">
          <span className="font-medium text-background">LAWFIC Studio</span>
          <span>Websites, apps and brands</span>
        </div>
        <div className="flex items-center justify-center">
          <span className="relative block h-[1.3em] overflow-hidden text-[clamp(1.6rem,5vw,4.5rem)] font-medium leading-[1.3] tracking-[-0.045em]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={word}
                className="block whitespace-nowrap"
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.12, ease: "linear" }}
              >
                {FLASH[word % FLASH.length]}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <div className="flex items-end justify-between gap-6">
          <span className="max-w-[18ch] text-[14px] leading-snug text-background/60">
            {SITES.length} websites and {APPS.length} apps, live right now
          </span>
          <span className="text-[clamp(5rem,19vw,17rem)] font-medium leading-[0.8] tracking-[-0.07em] tabular-nums">{n}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── the cursor ────────────────────────────────────────────────────────── */

function Cursor() {
  const x = useSpring(-200, { stiffness: 600, damping: 42, mass: 0.35 });
  const y = useSpring(-200, { stiffness: 600, damping: 42, mass: 0.35 });
  const [state, setState] = useState<{ inside: boolean; label: string | null; hide: boolean; link: boolean }>({
    inside: false,
    label: null,
    hide: false,
    link: false,
  });

  useEffect(() => {
    const root = document.getElementById("top");
    if (!root) return;
    root.classList.add("studio-cursor");
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest) return;
      const tagged = t.closest("[data-cursor]");
      const v = tagged?.getAttribute("data-cursor") ?? null;
      setState({
        inside: root.contains(t),
        label: v && v !== "hide" ? v : null,
        hide: v === "hide" || !!t.closest("input,textarea"),
        link: !!t.closest("a,button,label,[role=tab]"),
      });
    };
    const leave = () => setState((s) => ({ ...s, inside: false }));
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      root.classList.remove("studio-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  const scale = !state.inside || state.hide ? 0 : state.label ? 1 : state.link ? 0.5 : 0.14;
  return (
    <motion.div className="pointer-events-none fixed left-0 top-0 z-[150]" style={{ x, y }} aria-hidden>
      <motion.div
        className={`-ml-12 -mt-12 flex size-24 items-center justify-center rounded-full text-[13px] font-medium ${
          state.label ? "bg-primary text-background" : state.link ? "border-2 border-foreground" : "bg-foreground"
        }`}
        animate={{ scale }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <AnimatePresence>
          {state.label && (
            <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {state.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ── put together ──────────────────────────────────────────────────────── */

export default function Stage() {
  const reduced = !!useReducedMotion();
  const fine = usePointerFine();

  useEffect(() => {
    if (reduced) return;
    const l = new Lenis({ autoRaf: true, lerp: 0.085, anchors: { offset: -110 } });
    lenis = l;
    if (!introDone && !document.documentElement.classList.contains("studio-intro-seen")) l.stop();
    return () => {
      l.destroy();
      if (lenis === l) lenis = null;
    };
  }, [reduced]);

  return (
    <>
      <Intro />
      {fine && !reduced && <Cursor />}
    </>
  );
}
