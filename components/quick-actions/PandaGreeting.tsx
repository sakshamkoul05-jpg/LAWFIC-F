"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { greeting, palette } from "./quickActionsConfig";

/**
 * "Hi, do you need any help?" — the panda saying hello.
 *
 * ONCE PER VISIT, NOT ONCE PER PAGE
 *
 * The widget is mounted in ThemeShell, which survives client-side navigation,
 * so a naive greeting would pop on every route change and become the thing
 * people close rather than the thing they read. It is marked in sessionStorage
 * the first time it shows: once per visit, and again next time they come back.
 *
 * IT LEAVES ON ITS OWN
 *
 * A bubble that waits to be dismissed is a bubble in the way. This one appears
 * after a beat — long enough that it is noticed arriving rather than being
 * part of the page — and withdraws by itself. Clicking it opens the panel,
 * which is the only thing it is really for.
 */
export default function PandaGreeting({
  onAccept,
  suppressed,
}: {
  /** Opening the panel is what the greeting is inviting. */
  onAccept: () => void;
  /** The panel is already open, or the visitor has moved the ball. */
  suppressed: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!greeting.enabled) return;

    try {
      if (window.sessionStorage.getItem(greeting.storageKey)) return;
    } catch {
      /* Storage blocked. Greeting once in this tab is better than never. */
    }

    const appear = window.setTimeout(() => {
      setShow(true);
      try {
        window.sessionStorage.setItem(greeting.storageKey, "1");
      } catch {
        /* As above — the greeting still shows, it just may show again. */
      }
    }, greeting.delayMs);

    const leave = window.setTimeout(
      () => setShow(false),
      greeting.delayMs + greeting.visibleMs,
    );

    return () => {
      window.clearTimeout(appear);
      window.clearTimeout(leave);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && !suppressed && (
        <motion.div
          className="qa-greeting"
          initial={{ opacity: 0, y: 8, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            onClick={() => {
              setShow(false);
              onAccept();
            }}
            className="qa-greeting-text"
          >
            {greeting.text}
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShow(false);
            }}
            aria-label="Dismiss"
            className="qa-greeting-close"
          >
            <X size={13} strokeWidth={2.5} />
          </button>

          {/* The tail. Purely decorative, and drawn rather than rotated so it
              does not inherit the bubble's own rounding. */}
          <span aria-hidden className="qa-greeting-tail" style={{ color: palette.surfaceLift }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
