"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Where a password-reset link lands.
 *
 * HOW SOMEBODY GETS HERE, AND WHY THERE IS NOTHING TO PROVE ON THIS PAGE
 *
 * The mail carries a one-time code. /auth/callback exchanges it for a session
 * and sends the reader here, so by the time this form renders the browser is
 * already signed in as the account being recovered. Receiving the mail WAS the
 * proof; asking again for the old password would be asking for the one thing
 * the person demonstrably does not have.
 *
 * That is also why this page checks for a session before it shows anything. A
 * new-password form that anyone can open, on a URL that will be guessed the
 * moment it exists, is an invitation — and without the check the form would
 * render, take a password, and fail on submit with a message about being
 * signed out, which reads like a bug rather than like a refusal.
 *
 * The write goes through /api/profile/password, which is the same route the
 * profile page uses. One place decides what a valid password is.
 */

type Stage = "checking" | "ready" | "no-session" | "done";

export default function ResetForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setStage("no-session");
      return;
    }
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      if (data.user) {
        setEmail(data.user.email ?? null);
        setStage("ready");
      } else {
        setStage("no-session");
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const passwordOk = password.length >= 8;
  const matches = password === confirm;
  const canSubmit = passwordOk && matches && !busy;

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
            ? "That reset link has expired. Ask for a new one."
            : (body.error ?? "Could not set that password."),
        );
        return;
      }
      setStage("done");
      /* Straight to the account rather than back to a sign-in form. They are
         signed in already — sending them to /login to type the password they
         just chose would be asking them to prove something twice. */
      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1200);
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-2 w-full rounded-lg border border-border-2 bg-background/60 px-3.5 py-2.5 text-[14px] text-foreground outline-none placeholder:text-subtle focus:border-primary/50";

  return (
    <div className="mx-auto w-full max-w-md px-5 py-16 sm:px-8">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-7 py-5">
          <p className="type-label text-primary">Reset password</p>
          <h2 className="type-h2 mt-2 text-foreground">
            {stage === "done" ? "Password changed" : "Choose a new password"}
          </h2>
        </div>

        <div className="p-7">
          {stage === "checking" && (
            <p className="text-[13px] text-muted">Checking your link…</p>
          )}

          {stage === "no-session" && (
            <>
              <p className="text-[13px] leading-relaxed text-muted">
                This link has expired, or it has already been used. Reset links
                are good for one hour and one visit.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-primary-hover"
              >
                Ask for a new link
              </Link>
            </>
          )}

          {stage === "done" && (
            <p role="status" className="text-[13px] leading-relaxed text-muted">
              Done. Your new password is set and you are signed in — taking you
              to your account.
            </p>
          )}

          {stage === "ready" && (
            <form onSubmit={submit}>
              {email && (
                <p className="mb-5 text-[12.5px] text-subtle">
                  Setting a new password for <span className="text-foreground">{email}</span>.
                </p>
              )}

              <label htmlFor="password" className="type-label block text-muted">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={field}
                required
                minLength={8}
                autoFocus
              />

              <label htmlFor="confirm" className="type-label mt-5 block text-muted">
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Type it again"
                className={field}
                required
              />
              {confirm.length > 0 && !matches && (
                <p className="mt-2 text-[12.5px] text-destructive">
                  Those two passwords do not match.
                </p>
              )}

              {error && (
                <p role="alert" className="mt-5 text-[13px] leading-relaxed text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-6 w-full rounded-full bg-primary py-3 text-[13px] font-medium text-background transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle"
              >
                {busy ? "Saving…" : "Set new password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
