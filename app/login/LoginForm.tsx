"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Email and password.
 *
 * This replaced an OTP flow, and the reason is worth recording. OTP is the
 * better experience on paper, but every code has to arrive by email, and
 * Supabase's built-in sender delivers two messages an hour and only to
 * addresses on the project team. Until custom SMTP is configured, an OTP form
 * is a sign-in page that cannot sign anybody in. A password needs no mail at
 * all, so the site works today and OTP can come back the moment mail does.
 *
 * One caveat this form has to handle honestly: Supabase can still be set to
 * require a confirmation email on sign-up, which puts mail back in the path.
 * When that happens the API returns a user with no session, and the copy below
 * says to check the inbox rather than pretending the account is ready.
 */

type Mode = "signin" | "signup";

const ERRORS: Record<string, string> = {
  link_expired: "That link has expired. Sign in again.",
  missing_code: "No verification code found. Sign in again.",
  not_configured: "Sign-in is not switched on yet.",
};

/** Supabase's messages are terse and sometimes alarming. These are plainer. */
function readable(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "That email and password do not match an account.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "That email already has an account. Sign in instead.";
  }
  if (m.includes("email not confirmed")) {
    return "This account still needs its email confirmed before you can sign in.";
  }
  if (m.includes("password should be")) {
    return "Use at least 8 characters for your password.";
  }
  if (m.includes("error sending") || m.includes("smtp")) {
    return "We could not send the confirmation email. Contact us and we will finish setting up your account.";
  }
  return message;
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/wallet";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(ERRORS[params.get("error") ?? ""] ?? "");
  const [notice, setNotice] = useState("");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const passwordOk = password.length >= 8;
  const matches = mode === "signin" || password === confirm;
  const canSubmit = emailOk && passwordOk && matches && !busy;

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setNotice("");
    setConfirm("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setNotice("");

    const supabase = createClient();
    if (!supabase) {
      setError("Sign-in is not switched on yet.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(readable(error.message));
          return;
        }
        /* No session means the project requires a confirmation email. The
           account exists but cannot be used yet, and saying "welcome" here
           would be a lie the customer discovers one click later. */
        if (!data.session) {
          setNotice(
            "Account created. Check your email for a confirmation link, then come back and sign in.",
          );
          return;
        }
        router.push("/profile/setup");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(readable(error.message));
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-2 w-full rounded-lg border border-border-2 bg-background/60 px-3.5 py-2.5 text-[14px] text-foreground outline-none placeholder:text-subtle focus:border-primary/50";

  return (
    <div className="w-full max-w-md justify-self-center lg:justify-self-end">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-7 py-5">
          <p className="type-label text-primary">
            {mode === "signin" ? "Sign in" : "Create account"}
          </p>
          <h2 className="type-h2 mt-2 text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your LAWFIC account"}
          </h2>
        </div>

        <div className="p-7">
          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                aria-pressed={mode === m}
                className={`py-2.5 text-[12.5px] font-medium transition-colors ${
                  mode === m
                    ? "bg-primary-light text-primary"
                    : "bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={submit}
            >
              <label htmlFor="email" className="type-label block text-muted">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={field}
                required
              />

              <label htmlFor="password" className="type-label mt-5 block text-muted">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                className={field}
                required
                minLength={8}
              />

              {mode === "signup" && (
                <>
                  <label htmlFor="confirm" className="type-label mt-5 block text-muted">
                    Confirm password
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
                </>
              )}

              {error && (
                <p role="alert" className="mt-5 text-[13px] leading-relaxed text-destructive">
                  {error}
                </p>
              )}

              {notice && (
                <p
                  role="status"
                  className="mt-5 rounded-lg border border-border bg-surface-2 px-3.5 py-3 text-[13px] leading-relaxed text-muted"
                >
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-6 w-full rounded-full bg-primary py-3 text-[13px] font-medium text-background transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle"
              >
                {busy
                  ? mode === "signup"
                    ? "Creating account…"
                    : "Signing in…"
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>

              <p className="mt-5 text-center text-[12.5px] text-muted">
                {mode === "signin" ? (
                  <>
                    No account yet?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="text-primary hover:text-primary-hover"
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="text-primary hover:text-primary-hover"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </motion.form>
          </AnimatePresence>

          {!isSupabaseConfigured && (
            <p className="mt-6 border-t border-border pt-5 text-[12.5px] leading-relaxed text-subtle">
              Sign-in is not switched on for this deployment yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
