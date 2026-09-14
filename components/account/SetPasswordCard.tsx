"use client";

import { useState } from "react";

/**
 * "Add a password" — offered to someone who signed up with an email code.
 *
 * WHY IT EXISTS AT ALL
 *
 * A code-first sign-up leaves the account with no password, so the next visit
 * needs another code, and the one after that another one. That is a round trip
 * to an inbox as the price of opening your own wallet, and it gets worse on a
 * phone, on a train, or any time the mail is slow. One password, set once, ends
 * it.
 *
 * WHY IT IS OFFERED RATHER THAN REQUIRED
 *
 * The code sign-up's whole appeal is that there is nothing to invent. Demanding
 * a password at the end takes that back, thirty seconds after promising it —
 * and a customer who declines is not stuck: codes keep working, forever. So
 * this is a card with a skip on it, not a step, and the copy says what the
 * password BUYS rather than warning about what happens without one.
 *
 * WHY IT SITS ON THE FINISHED SCREEN
 *
 * Onboarding is three steps. Making it four for the subset of people who came
 * in by code would slow everybody's sense of the flow to serve some of them;
 * putting it at the end costs nothing to anyone who does not need it, because
 * they never see it.
 */

export default function SetPasswordCard({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const longEnough = password.length >= 8;
  const matches = password === confirm;
  const canSubmit = longEnough && matches && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body.error === "not_signed_in"
            ? "Your session has expired. Sign in again and you can set this from your profile."
            : "We could not save that just now. You can set it later from your profile.",
        );
        return;
      }
      setSaved(true);
      /* Tell the parent so the card does not reappear on a re-render. The
         server has already recorded it; this keeps the screen honest in the
         meantime without waiting for a reload. */
      onDone();
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <p
        role="status"
        className="mx-auto mt-6 max-w-sm rounded-xl border border-success/40 bg-success-light/40 px-4 py-3 text-[12.5px] leading-relaxed text-foreground"
      >
        Password saved. Next time you can sign in with your email and password —
        no waiting for a code.
      </p>
    );
  }

  const field =
    "mt-2 w-full rounded-lg border border-border-2 bg-background/60 px-3.5 py-2.5 text-[14px] text-foreground outline-none placeholder:text-subtle focus:border-primary/50";

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-8 max-w-sm rounded-xl border border-border bg-surface-2 p-5 text-left"
    >
      <p className="type-label text-primary">Optional</p>
      <h3 className="mt-2 text-[15px] font-semibold text-foreground">Add a password</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
        You signed up with an emailed code. Set a password and you can sign in
        straight away next time instead of waiting for another one. Codes keep
        working either way.
      </p>

      <label htmlFor="new-password" className="type-label mt-5 block text-muted">
        Password
      </label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        className={field}
        minLength={8}
      />

      <label htmlFor="confirm-password" className="type-label mt-4 block text-muted">
        Confirm password
      </label>
      <input
        id="confirm-password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Type it again"
        className={field}
      />
      {confirm.length > 0 && !matches && (
        <p className="mt-2 text-[12px] text-destructive">Those two do not match.</p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-[12.5px] leading-relaxed text-destructive">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-primary px-5 py-2.5 text-[12.5px] font-medium text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle"
        >
          {busy ? "Saving…" : "Save password"}
        </button>
        {/* A skip that says what skipping means. "Not now" alone leaves
            somebody wondering whether they have just locked themselves out. */}
        <button
          type="button"
          onClick={onDone}
          className="text-[12.5px] text-muted transition-colors hover:text-foreground"
        >
          Skip — keep using codes
        </button>
      </div>
    </form>
  );
}
