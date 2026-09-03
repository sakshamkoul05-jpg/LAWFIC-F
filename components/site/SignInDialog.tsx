"use client";

import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useEffect } from "react";

/**
 * Sign in, over a blurred page.
 *
 * The blur is doing a real job, not a decorative one: it holds the page you
 * were on visibly behind the panel, so signing in reads as a step inside what
 * you were already doing rather than as being sent somewhere else and having to
 * find your way back. Navigating away to /login loses that thread entirely, and
 * on a site where people arrive mid-task from a service page that matters.
 *
 * The panel is a doorway, not a form. Both routes go to the real pages, which
 * already handle validation, errors and the resume flow — duplicating a
 * credential form here would mean two places to keep correct and two places for
 * a bug to hide.
 *
 * Escape closes it, focus is trapped by the browser's own dialog semantics via
 * aria-modal, and the page underneath stops scrolling while it is up.
 */
export default function SignInDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to LAWFIC"
        >
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />

          <motion.div
            className="relative w-full max-w-[380px] overflow-hidden rounded-3xl border border-border bg-surface p-7 text-center shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7)]"
            initial={reduced ? false : { opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lawfic-logo.png"
              alt=""
              className="mx-auto h-12 w-12 object-contain"
            />
            <h2 className="mt-3 font-display text-[19px] font-bold tracking-tight text-foreground">
              Sign in to LAWFIC
            </h2>
            <p className="mx-auto mt-2 max-w-[26ch] text-[13px] leading-relaxed text-muted-foreground">
              Track every filing, keep your documents in one place, and pay from
              your wallet without re-entering a card.
            </p>

            <Link
              href="/login"
              className="mt-6 block rounded-full bg-primary px-6 py-3 text-[14px] font-medium text-background transition-colors hover:bg-primary-hover"
            >
              Continue with email
            </Link>
            <Link
              href="/login?mode=register"
              className="mt-2.5 block rounded-full border border-border px-6 py-3 text-[14px] text-foreground transition-colors hover:border-border-3"
            >
              Create an account
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-[12.5px] text-subtle transition-colors hover:text-muted-foreground"
            >
              Not now
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
