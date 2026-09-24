"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Info, Lock, TriangleAlert } from "lucide-react";
import type React from "react";

/**
 * The parts both application forms are built from.
 *
 * WHY THESE EXIST RATHER THAN <select> AND <input>
 *
 * A government filing form has a shape people already dread. The way out is
 * not decoration — a rounded corner on a dropdown is still a dropdown — it is
 * changing what the form ASKS FOR at each moment:
 *
 *   - one decision per screen, with the decisions as objects you press rather
 *     than options you reveal. A six-item <select> hides five of its answers
 *     until you open it; six cards show all six and their consequences at once;
 *   - every answer says what it means immediately. Pick "trading" and the form
 *     tells you, before you pay, that traders get priority-sector lending and
 *     not the rest of the schemes;
 *   - the form knows things. It classifies, it counts, it warns. A form that
 *     only collects is a paper form with a cursor in it.
 *
 * Everything here is real markup — <button>, <input>, <fieldset>, <legend> —
 * because a card that is a <div> with an onClick is invisible to a keyboard,
 * and a filing form is exactly the kind of thing somebody fills in with a
 * screen reader.
 */

/* ══════════════════════════════════════════════════════════════════════════
   PROGRESS
   ══════════════════════════════════════════════════════════════════════════ */

export function Stepper({
  steps,
  current,
  onJump,
}: {
  steps: string[];
  current: number;
  /** Only ever backwards — see below. */
  onJump?: (index: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current;
        const here = i === current;
        /* Backwards only. Letting somebody skip ahead to step 3 means the form
           can be submitted with step 2 empty, and the validation that catches
           it arrives as a wall of red rather than as a question. */
        const canJump = done && onJump;

        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
            <button
              type="button"
              disabled={!canJump}
              onClick={canJump ? () => onJump(i) : undefined}
              aria-current={here ? "step" : undefined}
              aria-label={`Step ${i + 1} of ${steps.length}: ${label}${done ? ", done" : ""}`}
              className="group flex min-w-0 flex-1 flex-col gap-1.5 text-left disabled:cursor-default"
            >
              <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-surface-3">
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  initial={false}
                  animate={{ width: done ? "100%" : here ? "45%" : "0%" }}
                  transition={{ type: "spring", stiffness: 180, damping: 26 }}
                />
              </span>
              <span
                className={`truncate text-[10.5px] font-medium uppercase tracking-[0.12em] transition-colors ${
                  here ? "text-foreground" : done ? "text-muted-foreground" : "text-subtle"
                }`}
              >
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CHOICES
   ══════════════════════════════════════════════════════════════════════════ */

export type Choice = {
  id: string;
  label: string;
  hint?: string;
  /** Rendered at 18px on the left. */
  icon?: React.ReactNode;
  /** Shown as a small chip on the right — a limit, a count, a status. */
  chip?: string;
  disabled?: boolean;
  disabledReason?: string;
};

/**
 * A grid of answers you press.
 *
 * Single-select is a radiogroup, multi-select is a group of toggle buttons —
 * not the same role, because a screen reader announces "1 of 6 selected" for
 * one and "pressed" for the other, and getting it wrong makes a multi-select
 * sound like it just discarded your other answers.
 */
export function ChoiceGrid({
  legend,
  choices,
  value,
  onChange,
  multiple,
  columns = 2,
}: {
  legend: string;
  choices: Choice[];
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  columns?: 1 | 2 | 3;
}) {
  const pick = (id: string) => {
    if (multiple) {
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      onChange([id]);
    }
  };

  const cols = columns === 1 ? "sm:grid-cols-1" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div role={multiple ? "group" : "radiogroup"} aria-label={legend} className={`grid gap-2.5 ${cols}`}>
        {choices.map((c) => {
          const on = value.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              role={multiple ? undefined : "radio"}
              aria-checked={multiple ? undefined : on}
              aria-pressed={multiple ? on : undefined}
              disabled={c.disabled}
              onClick={() => pick(c.id)}
              title={c.disabled ? c.disabledReason : undefined}
              className={[
                "group relative flex min-h-[64px] items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all",
                c.disabled
                  ? "cursor-not-allowed border-border bg-surface opacity-50"
                  : on
                    ? "border-primary bg-primary-lighter shadow-[0_0_0_1px_var(--brand)]"
                    : "border-border bg-surface hover:border-border-3 hover:bg-surface-2",
              ].join(" ")}
            >
              {c.icon && (
                <span className={`mt-0.5 shrink-0 ${on ? "text-primary" : "text-muted-foreground"}`}>
                  {c.icon}
                </span>
              )}

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-foreground">{c.label}</span>
                  {c.chip && (
                    <span className="shrink-0 rounded-full bg-surface-3 px-2 py-0.5 text-[10.5px] text-muted-foreground">
                      {c.chip}
                    </span>
                  )}
                </span>
                {(c.hint || (c.disabled && c.disabledReason)) && (
                  <span className="mt-1 block text-[12px] leading-relaxed text-muted-foreground">
                    {c.disabled ? c.disabledReason : c.hint}
                  </span>
                )}
              </span>

              <AnimatePresence>
                {on && (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-background"
                  >
                    <Check size={12} strokeWidth={3} aria-hidden />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TEXT
   ══════════════════════════════════════════════════════════════════════════ */

export function Field({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  /** Shown only once the field has been left — see below. */
  error,
  onBlur,
  maxLength,
  inputMode,
  autoComplete,
  uppercase,
  prefix,
  locked,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  onBlur?: () => void;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
  autoComplete?: string;
  uppercase?: boolean;
  prefix?: string;
  /** A note that this value never leaves the browser, or is never stored. */
  locked?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-medium text-foreground">
        {label}
      </label>

      <div
        className={[
          "mt-1.5 flex items-center gap-2 rounded-xl border bg-surface px-3.5 transition-colors",
          error ? "border-destructive" : "border-border focus-within:border-border-3",
        ].join(" ")}
      >
        {prefix && <span className="shrink-0 font-mono text-[13.5px] text-muted-foreground">{prefix}</span>}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`min-h-[48px] w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-subtle ${
            uppercase || inputMode === "numeric" ? "font-mono tracking-wide" : ""
          }`}
        />
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[11.5px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[11.5px] leading-relaxed text-subtle">
          {hint}
        </p>
      ) : null}

      {locked && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-subtle">
          <Lock size={11} className="mt-0.5 shrink-0" aria-hidden />
          {locked}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NOTICES
   ══════════════════════════════════════════════════════════════════════════ */

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn";
  title?: string;
  children: React.ReactNode;
}) {
  const warn = tone === "warn";
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${
        warn ? "border-[color:var(--destructive)] bg-destructive-light" : "border-border bg-surface-2"
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${warn ? "text-destructive" : "text-muted-foreground"}`}>
        {warn ? <TriangleAlert size={16} aria-hidden /> : <Info size={16} aria-hidden />}
      </span>
      <div className="min-w-0 text-[12.5px] leading-relaxed text-foreground">
        {title && <p className="mb-0.5 font-medium">{title}</p>}
        <div className="text-muted-foreground">{children}</div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════════════════════════════════ */

export function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  /** One line under the button saying what it will NOT do yet. */
  reassurance,
  back = true,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  reassurance?: string;
  back?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        {back && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[48px] items-center gap-1 rounded-xl border border-border px-4 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft size={15} aria-hidden />
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-[14.5px] font-medium text-background transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {nextLabel}
          <ChevronRight size={15} aria-hidden />
        </button>
      </div>
      {reassurance && (
        <p className="text-center text-[11.5px] text-subtle">{reassurance}</p>
      )}
    </div>
  );
}

/** Wraps each step so they cross-fade rather than snapping. */
export function StepPanel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5"
    >
      {children}
    </motion.div>
  );
}

export function StepHeading({ kicker, title, blurb }: { kicker: string; title: string; blurb?: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">{kicker}</p>
      <h3 className="mt-2 font-display text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
        {title}
      </h3>
      {blurb && <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{blurb}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   VALIDATION — the formats a filing actually bounces on
   ══════════════════════════════════════════════════════════════════════════ */

/** Five letters, four digits, a letter. The fourth letter encodes the holder type. */
export function panError(v: string): string | null {
  const s = v.trim().toUpperCase();
  if (!s) return null;
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(s)) {
    return "A PAN is five letters, four digits, then a letter — like ABCDE1234F.";
  }
  return null;
}

/** Two-digit state code, the ten-character PAN, an entity digit, Z, a checksum. */
export function gstinError(v: string): string | null {
  const s = v.trim().toUpperCase();
  if (!s) return null;
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(s)) {
    return "That is not a valid GSTIN. It is 15 characters and contains your PAN.";
  }
  return null;
}

/** Indian mobile numbers start 6–9 and are ten digits. */
export function mobileError(v: string): string | null {
  const s = v.replace(/\D/g, "");
  if (!s) return null;
  if (!/^[6-9][0-9]{9}$/.test(s)) return "Ten digits, starting 6, 7, 8 or 9.";
  return null;
}

export function digitsOnly(v: string, max: number): string {
  return v.replace(/\D/g, "").slice(0, max);
}
