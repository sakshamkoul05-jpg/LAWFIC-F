"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "lawfic-wallet-intro-seen";

const STEPS = [
  {
    key: "closed",
    title: "A balance, not a payment method",
    body: "Top up once, then pay for filings without re-entering a card every time.",
  },
  {
    key: "separate",
    title: "Two fees, always itemised",
    body: "What the government charges and what LAWFIC charges are never shown as one number.",
  },
  {
    key: "quote",
    title: "Nothing moves until you accept",
    body: "You send the request, we quote the exact cost, and only then is the balance touched.",
  },
] as const;

/**
 * A short introduction the first time someone opens the wallet.
 *
 * It runs once — the flag is per-browser, and it is skippable at any point,
 * because an animation someone has already seen is an obstacle rather than a
 * welcome. Under `prefers-reduced-motion` the panels still appear and are
 * still readable; only the movement between them is dropped.
 *
 * There is one rule this deliberately follows: no motion runs over a screen
 * where money is being committed. This plays on arrival, before any amount
 * has been entered, and it is gone before the top-up form is reachable.
 */
export default function WalletOnboarding() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setStep(0);
    } catch {
      /* Private mode, or storage blocked. Skipping the intro is the right
         failure: it is a nicety, not a gate. */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* Nothing to do — worst case they see it again next visit. */
    }
    setStep(null);
  };

  const next = () => {
    if (step === null) return;
    if (step >= STEPS.length - 1) dismiss();
    else setStep(step + 1);
  };

  if (step === null) return null;
  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        key="intro"
        className="fixed inset-0 z-[60] grid place-items-end sm:place-items-center"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-intro-title"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Skip introduction"
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        <motion.div
          key={current.key}
          initial={reduced ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="relative m-3 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)] sm:m-0 sm:p-7"
        >
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i <= step ? "bg-primary" : "bg-border-2"
                }`}
              />
            ))}
          </div>

          <p className="type-label mt-6 text-primary">
            LAWFIC Wallet · {step + 1} of {STEPS.length}
          </p>

          <h2
            id="wallet-intro-title"
            className="mt-2.5 text-[22px] font-semibold leading-tight tracking-[-0.025em] text-foreground"
          >
            {current.title}
          </h2>

          <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{current.body}</p>

          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={dismiss}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={next}
              autoFocus
              className="rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-medium text-background transition-colors hover:bg-primary-hover"
            >
              {step >= STEPS.length - 1 ? "Open my wallet" : "Next"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
