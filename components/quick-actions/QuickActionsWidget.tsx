"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useDragControls,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { X } from "lucide-react";
import PandaFace from "./PandaFace";
import PandaGreeting from "./PandaGreeting";
import PandaOrb from "./PandaOrb";
import QuickActionsPanel, { type PanelView } from "./QuickActionsPanel";
import { dragging, geometry, orb, palette, tooltip } from "./quickActionsConfig";
import { useQuickActions } from "./QuickActionsContext";

/**
 * The floating LAWFIC ball and the panel it opens.
 *
 * Mounted ONCE, in ThemeShell, so it is on every page of the shopfront and
 * nowhere in the back office. The home page's own logo trigger does not render
 * a second copy — it flips the shared flag in QuickActionsContext, which is the
 * whole reason that context exists.
 *
 * WHY z-index 65 AND NOT 9999
 *
 * "Above everything" is the instinct and it is wrong. The sign-in dialog sits
 * at 70 and the wallet celebration at 120; a ball hovering on top of a modal
 * looks like a bug and, worse, can be clicked instead of the modal behind it.
 * 65 clears the sticky header (50–60) and all ordinary content while staying
 * under anything that has deliberately taken over the screen. A cookie banner
 * or a mobile nav placed above 65 will likewise win, which is correct.
 *
 * WHY THE PANEL IS NOT A FOCUS TRAP
 *
 * It is a popup, not a modal — the page behind it stays usable, which the brief
 * asks for explicitly. So focus moves INTO it on open and returns to the ball
 * on Escape, but Tab is allowed to walk out the far side rather than cycling
 * forever inside eight links.
 */
export default function QuickActionsWidget() {
  const ctx = useQuickActions();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const [view, setView] = useState<PanelView>("actions");
  const ballRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  /* THE BALL'S BACKGROUND MOVES WITH THE PAGE.
     scrollYProgress is 0 at the top of the document and 1 at the bottom; it
     turns a conic gold sweep inside the ball and breathes it slightly at the
     halfway mark, so the ball reads as alive without ever moving position.
     The spring stops it twitching on a trackpad's high-frequency events, and
     both values drive `transform` alone — no layout, no repaint of the page.
     Under prefers-reduced-motion the sweep is pinned and nothing animates. */
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.4 });
  /* The orb turns as the page moves. */
  const sweep = useTransform(progress, [0, 1], [0, 540]);
  /* ...and the ball itself walks DOWN the screen as the page is scrolled.
     Negative at the top means "above the resting corner", zero at the bottom
     means "in it", so scrolling down moves the panda down — which is the way
     round it has to be, since the corner is already at the bottom and there is
     nowhere below it to go.

     HOW FAR IS NOT A CONSTANT. A fixed 150px lifts the ball into the header on
     a short window — measured at 374x334, where it landed on the logo and the
     account button. The distance is capped to what is actually free below the
     header, and on a genuinely short screen it is zero: the ball stays in its
     corner rather than climbing over the navigation. Read through a ref so the
     transform always sees the current window without being rebuilt. */
  const travelRef = useRef<number>(dragging.scrollTravel);
  const travel = useTransform(progress, (v) => -(1 - v) * travelRef.current);

  useEffect(() => {
    const measure = () => {
      const size = window.innerWidth <= 640 ? geometry.ballSize.mobile : geometry.ballSize.desktop;
      const bottom =
        window.innerWidth <= 640 ? geometry.offsetBottom.mobile : geometry.offsetBottom.desktop;
      /* Enough room for the sticky header and the section strip beneath it. */
      const headroom = 150;
      const free = window.innerHeight - size - bottom - headroom;
      travelRef.current =
        window.innerHeight < 560 ? 0 : Math.max(0, Math.min(dragging.scrollTravel, free));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* WHERE THE VISITOR PUT IT.
     x/y are an offset from the resting corner, not absolute coordinates, so a
     ball dragged to the middle of a laptop screen does not end up off-screen
     on a phone — the offset is re-clamped to the viewport on mount and on
     resize. Remembered per browser; see restoreDragged below. */
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [dragged, setDragged] = useState(false);
  const dragControls = useDragControls();
  const [bounds, setBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  /* Which way the panel opens, and how much room it has there. Recomputed on
     every open, because the ball may have been dragged since the last one. */
  const [placement, setPlacement] = useState({ flipY: false, flipX: false, avail: 0 });
  /* Pointer travel since the gesture began. A ball you can drag is also a ball
     you can nudge by two pixels while meaning to click it, so the click is
     only honoured when the pointer effectively stayed put. */
  const movedRef = useRef(0);
  const originRef = useRef({ x: 0, y: 0 });

  const isOpen = ctx?.isOpen ?? false;
  const close = ctx?.close;
  const toggle = ctx?.toggle;

  /* Every close goes through here so the help view never survives into the
     next opening — reopening should always land on the eight actions. */
  const dismiss = useCallback(
    (returnFocus: boolean) => {
      close?.();
      setView("actions");
      if (returnFocus) ballRef.current?.focus();
    },
    [close],
  );

  /* A route change means the visitor took one of the links. Leaving the panel
     open over the page they just asked for would be the widget arguing with
     them. */
  useEffect(() => {
    dismiss(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* Escape closes and hands focus back; a click anywhere outside closes and
     does not, because the visitor has already moved their attention. */
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        dismiss(true);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) dismiss(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen, dismiss]);

  /* Announce the panel by moving focus to it. The container is focusable but
     not tabbable, so this does not add a stop to the page's tab order. */
  useEffect(() => {
    if (isOpen) panelRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  /* WHICH SIDE OF THE BALL THE PANEL OPENS ON.
     While the ball was welded to the bottom-right corner, "above and to the
     left" was always right. Now that it can be dragged, a ball near the top of
     the window would open a panel off the top of it — so the side is measured
     rather than assumed, and the panel is told how much room it actually got
     so the list can scroll inside instead of overflowing.

     Measured on open and while open, because the window can be resized and the
     page can scroll under it. */
  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      const ball = ballRef.current?.getBoundingClientRect();
      if (!ball) return;
      const gap = 14;
      const margin = 12;
      const above = ball.top - gap - margin;
      const below = window.innerHeight - ball.bottom - gap - margin;
      /* Prefer above, as the brief asks. Flip only when below genuinely has
         more room, so the panel does not jitter between sides. */
      const flipY = below > above;
      const flipX = ball.left < geometry.panelWidth - ball.width;
      setPlacement({ flipY, flipX, avail: Math.max(160, flipY ? below : above) });
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [isOpen]);

  /* Restore the remembered position, and keep it inside the window when that
     window changes size. A position saved on a wide monitor is off-screen on a
     phone, and a ball you cannot reach is worse than one in the wrong place. */
  useEffect(() => {
    if (!dragging.enabled || !dragging.storageKey) return;

    const clamp = (x: number, y: number) => {
      const size = window.innerWidth <= 640 ? geometry.ballSize.mobile : geometry.ballSize.desktop;
      const right = window.innerWidth <= 640 ? geometry.offsetRight.mobile : geometry.offsetRight.desktop;
      const bottom = window.innerWidth <= 640 ? geometry.offsetBottom.mobile : geometry.offsetBottom.desktop;
      const pad = dragging.edgePadding;
      /* x is negative going left, positive going right, from the rest corner. */
      const minX = -(window.innerWidth - size - right - pad);
      const maxX = right - pad;
      const minY = -(window.innerHeight - size - bottom - pad);
      const maxY = bottom - pad;
      return [Math.min(Math.max(x, minX), maxX), Math.min(Math.max(y, minY), maxY)] as const;
    };

    try {
      const saved = window.localStorage.getItem(dragging.storageKey);
      if (saved) {
        const { x, y } = JSON.parse(saved) as { x: number; y: number };
        if (Number.isFinite(x) && Number.isFinite(y)) {
          const [cx, cy] = clamp(x, y);
          dragX.set(cx);
          dragY.set(cy);
          setDragged(cx !== 0 || cy !== 0);
        }
      }
    } catch {
      /* Private mode, blocked storage, or something else wrote nonsense here.
         The ball simply starts in its corner. */
    }

    const sync = () => {
      const [cx, cy] = clamp(dragX.get(), dragY.get());
      dragX.set(cx);
      dragY.set(cy);
      const [minX, minY] = clamp(-1e6, -1e6);
      const [maxX, maxY] = clamp(1e6, 1e6);
      setBounds({ left: minX, top: minY, right: maxX, bottom: maxY });
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [dragX, dragY]);

  if (!ctx) return null;

  const duration = reduceMotion ? 0 : 0.24;

  return (
    /* The ROOT is what moves, not the ball alone — the panel is anchored to the
       ball and has to travel with it. Drag is started from the ball only
       (dragListener={false} + dragControls), so dragging inside the open panel
       still selects text and scrolls the list. */
    <motion.div
      ref={rootRef}
      className="qa-root print:hidden"
      drag={dragging.enabled && !reduceMotion ? true : dragging.enabled}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={bounds}
      data-dragged={dragged || undefined}
      data-flip-y={placement.flipY ? "down" : undefined}
      data-flip-x={placement.flipX ? "left" : undefined}
      onDragEnd={() => {
        if (!dragging.storageKey) return;
        try {
          window.localStorage.setItem(
            dragging.storageKey,
            JSON.stringify({ x: Math.round(dragX.get()), y: Math.round(dragY.get()) }),
          );
        } catch {
          /* Storage blocked. The ball stays where it was dragged for this
             visit and returns to the corner on the next one. */
        }
        setDragged(dragX.get() !== 0 || dragY.get() !== 0);
      }}
      style={
        {
          x: dragX,
          y: dragY,
          "--qa-bottom": `${geometry.offsetBottom.desktop}px`,
          "--qa-bottom-m": `${geometry.offsetBottom.mobile}px`,
          "--qa-right": `${geometry.offsetRight.desktop}px`,
          "--qa-right-m": `${geometry.offsetRight.mobile}px`,
          "--qa-ball": `${geometry.ballSize.desktop}px`,
          "--qa-ball-m": `${geometry.ballSize.mobile}px`,
          "--qa-w": `${geometry.panelWidth}px`,
          "--qa-gold": palette.gold,
          "--qa-edge": palette.edge,
          "--qa-orb-core": orb.core,
          "--qa-orb-deep": orb.deep,
          "--qa-orb-hot": orb.hot,
          "--qa-orb-bloom": `${orb.bloom}px`,
          "--qa-avail": placement.avail ? `${placement.avail}px` : undefined,
        } as unknown as React.CSSProperties
      }
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-label="Quick actions and help"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
            style={{
              transformOrigin: `${placement.flipY ? "top" : "bottom"} ${placement.flipX ? "left" : "right"}`,
              background: palette.surface,
              border: `1px solid ${palette.edge}`,
              boxShadow: "0 28px 64px -24px rgba(0,0,0,0.75), 0 2px 8px rgba(0,0,0,0.3)",
            }}
            className="qa-panel rounded-[22px] outline-none backdrop-blur-xl"
          >
            <QuickActionsPanel
              view={view}
              onOpenHelp={() => setView("help")}
              onOpenView={setView}
              onBack={() => setView("actions")}
              onNavigate={() => dismiss(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The scroll drift lives on a wrapper rather than on the ball, so it
          composes with the ball's own idle float instead of fighting it for
          the same transform. */}
      <motion.span
        className="qa-ball-wrap"
        /* Once the visitor has placed the ball themselves, it stays where they
           put it: their placement outranks ours, and travel from a dragged
           position could carry it off the screen. */
        style={reduceMotion || dragged ? undefined : { y: travel }}
      >
      <button
        ref={ballRef}
        type="button"
        onPointerDown={(event) => {
          movedRef.current = 0;
          originRef.current = { x: event.clientX, y: event.clientY };
          if (dragging.enabled) dragControls.start(event);
        }}
        onPointerMove={(event) => {
          if (!event.buttons) return;
          movedRef.current = Math.hypot(
            event.clientX - originRef.current.x,
            event.clientY - originRef.current.y,
          );
        }}
        onClick={() => {
          /* A drag ends in a click event too. Opening the panel because
             somebody moved the ball would be maddening. */
          if (movedRef.current > dragging.threshold) return;
          toggle?.();
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={isOpen ? "Close quick actions" : tooltip}
        data-open={isOpen || undefined}
        className="qa-ball group"
      >
        {/* The glowing sphere. Original work; see PandaOrb.tsx for why it is
            not the clip the client sent. */}
        <PandaOrb spin={reduceMotion ? undefined : sweep} />

        <motion.span
          aria-hidden
          className="qa-face"
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: duration * 0.7 }}
                className="grid h-full w-full place-items-center"
                style={{ color: palette.gold }}
              >
                <X size={24} strokeWidth={2.25} />
              </motion.span>
            ) : (
              <motion.span
                key="logo"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: duration * 0.7 }}
                className="relative block h-full w-full"
              >
                <PandaFace className="block h-full w-full p-[5px]" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>

        {/* Visible on hover and on keyboard focus, never on touch, where it
            would linger after a tap. */}
        <span aria-hidden className="qa-tip">
          {tooltip}
        </span>
      </button>

      <PandaGreeting suppressed={isOpen} onAccept={() => ctx.open()} />
      </motion.span>
    </motion.div>
  );
}
