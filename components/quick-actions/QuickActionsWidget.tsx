"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { X } from "lucide-react";
import QuickActionsPanel, { type PanelView } from "./QuickActionsPanel";
import { geometry, logoSrc, palette, tooltip } from "./quickActionsConfig";
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
  const sweep = useTransform(progress, [0, 1], [0, 540]);
  const lift = useTransform(progress, [0, 0.5, 1], [1, 1.18, 1]);

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

  if (!ctx) return null;

  const duration = reduceMotion ? 0 : 0.24;

  return (
    <div
      ref={rootRef}
      className="qa-root print:hidden"
      style={
        {
          "--qa-bottom": `${geometry.offsetBottom.desktop}px`,
          "--qa-bottom-m": `${geometry.offsetBottom.mobile}px`,
          "--qa-right": `${geometry.offsetRight.desktop}px`,
          "--qa-right-m": `${geometry.offsetRight.mobile}px`,
          "--qa-ball": `${geometry.ballSize.desktop}px`,
          "--qa-ball-m": `${geometry.ballSize.mobile}px`,
          "--qa-w": `${geometry.panelWidth}px`,
          "--qa-gold": palette.gold,
          "--qa-edge": palette.edge,
        } as React.CSSProperties
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
              transformOrigin: "bottom right",
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

      <button
        ref={ballRef}
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={isOpen ? "Close quick actions" : tooltip}
        data-open={isOpen || undefined}
        className="qa-ball group"
      >
        {/* The scroll-driven layer. Decorative, so it is hidden from readers;
            it sits under the face and inside the ball's rounded clip. */}
        <motion.span
          aria-hidden
          className="qa-sheen"
          style={reduceMotion ? undefined : { rotate: sweep, scale: lift }}
        />

        {/* The attention halo. One slow gold ring every eight seconds, stopped
            while the panel is open and under prefers-reduced-motion — the brief
            asked for presence, not for a bouncing ball. */}
        <span aria-hidden className="qa-halo" />

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
                {/* A PLAIN <img>, DELIBERATELY.
                    This was a next/image and it shipped blank. next/image
                    lazy-loads by default, and native lazy loading decides
                    when to fetch from the image's intersection with the
                    SCROLLING viewport — which a position:fixed element never
                    enters. The request was never made at all: currentSrc
                    empty, naturalWidth 0, ball bare.
                    Marking it eager fixes that, but the optimizer was buying
                    nothing here anyway: this is an 11 KB asset already cut to
                    160px for exactly this 62px box. Served straight from
                    /public, there is no lazy heuristic and no optimizer route
                    left to decide against us. */}
                <img
                  src={logoSrc}
                  alt=""
                  width={160}
                  height={141}
                  draggable={false}
                  className="block h-full w-full object-contain p-[7px]"
                />
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
    </div>
  );
}
