"use client";

import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Three journeys arrive at this page, and only one of them is signing in.
 *
 * A RETURNING CUSTOMER USES A PASSWORD
 *
 * It is the default tab and the one that happens most, forever. Once an account
 * exists, signing into it needs no mail at all — which matters on a site where
 * mail has been the failure point more than once. A code every time would be a
 * round trip to an inbox as the price of opening your own wallet.
 *
 * A NEW CUSTOMER GETS A CODE, NOT A PASSWORD FORM
 *
 * `signInWithOtp` with `shouldCreateUser` creates the account on first use, so
 * a new customer types one address and one code and is in. Nothing to invent,
 * nothing to remember, and — the part a password sign-up cannot do in one step
 * — the address is PROVEN before the account works. It also signs in an
 * existing address, so nobody who picks the wrong tab is stuck.
 *
 * A FORGOTTEN PASSWORD GETS A LINK
 *
 * Reached from the sign-in form rather than given a tab of its own: forgetting
 * a password is something that happens to you, not a way of signing in you
 * would choose from a list. The strip stays on screen while you are there, so
 * there is always a way back that is not inside the form.
 *
 * The password SIGN-UP mode is kept and unreachable from the tabs. It is one
 * `switchMode("signup")` from being offered again if a code-first sign-up turns
 * out to confuse people, and it costs nothing to leave wired up.
 *
 * THIS DEPENDS ON MAIL ACTUALLY LEAVING THE BUILDING
 *
 * Mail goes out through Resend on lawfic.pro; the setup and the traps in it are
 * in the README under "Email: sign-in codes go out through Resend". Nothing
 * about Resend appears in this codebase — Supabase sends over SMTP, so the API
 * key lives in the Supabase dashboard and there is no environment variable here
 * to leak, log or forget to rotate.
 *
 * The loud failures stay anyway. A refused send says so in words and points at
 * the password form, because a domain can fall out of verification and a
 * sign-in page that goes quiet when mail stops is one nobody can report a fault
 * on.
 *
 * WHAT THE CODE EMAIL HAS TO CONTAIN
 *
 * Supabase sends whatever the template says, and a link cannot be typed into
 * the code box, so `{{ .Token }}` has to be in TWO templates: "Magic link or
 * OTP" for an address that already has an account, and "Confirm signup" for the
 * first time an address is seen. The second is the one that gets forgotten, and
 * it is the one a new customer meets. The link still works either way — it
 * lands on /auth/callback — so whichever they reach for, they get in.
 */

type Mode = "code" | "password" | "signup" | "forgot";

const ERRORS: Record<string, string> = {
  link_expired: "That link has expired. Sign in again.",
  missing_code: "No verification code found. Sign in again.",
  not_configured: "Sign-in is not switched on yet.",
  reset_expired: "That reset link has expired. Ask for a new one.",
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
    return "Open the confirmation link we emailed you, then sign in. Check the spam folder if it is not there.";
  }
  if (m.includes("password should be")) {
    return "Use at least 8 characters for your password.";
  }
  /* The two the code path actually produces. "Token has expired or is invalid"
     covers a wrong digit and a code past its ten minutes alike, and telling
     someone which of those it was would also tell an attacker. */
  if (m.includes("token has expired") || m.includes("invalid token") || m.includes("otp_expired")) {
    return "That code is wrong or has expired. Ask for a new one, and use the newest email — an older code stops working as soon as a new one is sent.";
  }
  if (m.includes("for security purposes")) {
    return "That was too quick after the last one. Wait a moment and try again.";
  }
  /* The mailer, which on this project is the likeliest failure of all. Said
     plainly, because "Error sending email" leaves a customer thinking they
     mistyped something. */
  if (
    m.includes("rate limit") ||
    m.includes("error sending") ||
    m.includes("smtp") ||
    m.includes("confirmation email")
  ) {
    return "We could not send that email — our mail service is refusing messages right now. Use your password instead, or contact us and we will sort it out.";
  }
  if (m.includes("signups not allowed")) {
    return "That email has no account yet, and new accounts by code are switched off. Create one with a password instead.";
  }
  return message;
}

/** Supabase refuses a second send inside a minute, so the button says so. */
const RESEND_SECONDS = 60;

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/wallet";

  /* THE PASSWORD FORM IS WHAT /login OPENS ON.
     Three journeys arrive here and only one of them is signing in: a returning
     customer with a password, someone creating an account, and someone who has
     forgotten a password. The first is the one that happens most, forever, so
     it gets the default and the other two are a tab and a link away. */
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  /* The code form has two stages behind one mode: ask for the address, then
     ask for the digits. A separate mode for the second stage would put a tab
     on the strip that nobody can click into. */
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(ERRORS[params.get("error") ?? ""] ?? "");
  const [notice, setNotice] = useState("");

  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  /* Focus the digits the moment the form asks for them. Otherwise the reader
     comes back from their inbox, types, and nothing appears. */
  useEffect(() => {
    if (sent) codeRef.current?.focus();
  }, [sent]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const passwordOk = password.length >= 8;
  const matches = mode === "signup" ? password === confirm : true;
  /* SUPABASE DECIDES HOW LONG THE CODE IS, NOT THIS FORM.
     The dashboard's OTP length is configurable from 6 to 10 digits, and this
     project is currently emitting 8 — so a form hardcoded to exactly six
     refused a code that had just been emailed, with no way for the customer to
     tell whose fault it was. Accepting the whole legal range means changing
     that setting never breaks the page again. The range is not open-ended: it
     is Supabase's own, so a short paste is still caught. */
  const tokenOk = /^\d{6,10}$/.test(token);

  const canSubmit =
    !busy &&
    (mode === "code"
      ? sent
        ? tokenOk
        : emailOk
      : mode === "forgot"
        ? emailOk
        : emailOk && passwordOk && matches);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setError("");
    setNotice("");
    setConfirm("");
    setToken("");
    setSent(false);
  }, []);

  /**
   * Where Supabase should send someone who clicks the link instead of typing
   * the code.
   *
   * NEXT_PUBLIC_SITE_URL WINS OVER THE BROWSER'S OWN ORIGIN
   *
   * This used to be `window.location.origin` alone, which is right in
   * development and quietly wrong everywhere else: request a code from
   * localhost and the email that lands in your inbox carries a localhost link,
   * so opening it on a phone — or on any machine that is not the one that asked
   * — goes nowhere. The same happens from a preview deployment, which mails a
   * preview URL that expires.
   *
   * With the variable set, every environment mails the real site. Without it,
   * the origin is still the sensible fallback for local work.
   */
  const callback = (target: string) => {
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || window.location.origin;
    return `${origin}/auth/callback?next=${encodeURIComponent(target)}`;
  };

  async function sendCode(supabase: NonNullable<ReturnType<typeof createClient>>) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        /* This is the sign-up. A first-time address gets an account the moment
           its owner proves the address is theirs, which is a better order than
           creating the account first and hoping. */
        shouldCreateUser: true,
        emailRedirectTo: callback(next),
      },
    });
    if (error) {
      setError(readable(error.message));
      return;
    }
    setSent(true);
    setCooldown(RESEND_SECONDS);
    setNotice(`We sent a code to ${email}. It is good for ten minutes.`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");

    const supabase = createClient();
    if (!supabase) {
      setError("Sign-in is not switched on yet.");
      return;
    }

    setBusy(true);
    try {
      /* ── A code to your email ─────────────────────────────── */
      if (mode === "code") {
        if (!sent) {
          setNotice("");
          await sendCode(supabase);
          return;
        }

        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          /* "email" covers both the sign-in code and the one a brand-new
             address gets; there is no separate signup type to branch on. */
          type: "email",
        });
        if (error) {
          setError(readable(error.message));
          return;
        }

        /* A user created by this verification has no profile yet, and the
           same test the auth callback uses decides where they land. */
        const fresh = !data.user?.user_metadata?.onboarded;
        router.push(fresh ? "/profile/setup" : next);
        router.refresh();
        return;
      }

      /* ── Forgot password ──────────────────────────────────── */
      if (mode === "forgot") {
        setNotice("");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callback("/auth/reset"),
        });
        if (error) {
          setError(readable(error.message));
          return;
        }
        setCooldown(RESEND_SECONDS);
        /* Said the same way whether or not that address has an account.
           "No account with that email" on a reset form is a way to find out
           which of a list of addresses is registered here, one request at a
           time. */
        setNotice(
          `If ${email} has an account, a link to set a new password is on its way. It expires in an hour.`,
        );
        return;
      }

      /* ── Create an account with a password ────────────────── */
      if (mode === "signup") {
        setNotice("");

        /* SUPABASE'S OWN SIGN-UP, WHICH MEANS A CONFIRMATION EMAIL.
           This used to POST to /api/auth/signup, which created the account
           already confirmed — an accepted trade while the mailer was broken,
           because an unusable sign-up is worse than an unverified one. It also
           meant nobody proved they owned the address they registered: you
           could sign up as somebody else, and a customer who mistyped theirs
           got an account they could never receive mail at.

           Mail works now, so the trade is off. The route refuses with a 410
           and this calls Supabase directly. */
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callback("/profile/setup"),
            /* Chose a password on the way in, so profile setup must not turn
               round and offer to set one. See the note in
               /api/profile/password for why this has to be remembered rather
               than read off the user. */
            data: { has_password: true },
          },
        });

        if (error) {
          setError(readable(error.message));
          return;
        }

        /* `session` is null when a confirmation is pending, which is the
           normal path now. Saying "check your email" and switching to the
           sign-in tab is honest; pushing them to /profile/setup would land
           them on a page that bounces them back out, signed out. */
        if (!data.session) {
          setMode("password");
          setNotice(
            `Account created. We have sent a confirmation link to ${email} — open it, then sign in.`,
          );
          return;
        }

        router.push("/profile/setup");
        router.refresh();
        return;
      }

      /* ── Email and password ───────────────────────────────── */
      setNotice("");
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

  const heading: Record<Mode, { label: string; title: string }> = {
    password: { label: "Sign in", title: "Welcome back" },
    code: { label: "Create account", title: "Start with your email" },
    signup: { label: "Create account", title: "Create your LAWFIC account" },
    forgot: { label: "Reset password", title: "Set a new password" },
  };

  const submitLabel = () => {
    if (busy) return "Working…";
    if (mode === "code") return sent ? "Verify and continue" : "Email me a code";
    if (mode === "forgot") return "Email me a reset link";
    if (mode === "signup") return "Create account";
    return "Sign in";
  };

  return (
    <div className="w-full max-w-md justify-self-center lg:justify-self-end">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-7 py-5">
          <p className="type-label text-primary">{heading[mode].label}</p>
          <h2 className="type-h2 mt-2 text-foreground">{heading[mode].title}</h2>
        </div>

        <div className="p-7">
          {/* Three tabs, not four. Forgetting a password is something that
              happens to you, not a way of signing in you would choose from a
              list, so it is reached from the password form rather than given a
              permanent seat.

              But the strip STAYS ON SCREEN while you are there, with none of
              the three pressed. Hiding it made the reset view a room with one
              door, and that door was a link inside the form — so anything that
              stopped the form rendering stopped the reader leaving. A control
              that is the only way out of a state should not be inside the part
              of the page that state is re-rendering. */}
          <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border">
            {(
              [
                ["code", "Email code"],
                ["password", "Password"],
                ["signup", "Create account"],
              ] as [Mode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                aria-pressed={mode === m}
                className={`py-2.5 text-[12px] font-medium transition-colors ${
                  mode === m
                    ? "bg-primary-light text-primary"
                    : "bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* NO `AnimatePresence`, AND THAT IS THE POINT.

              It was here in "wait" mode, which does not mount the incoming
              child until the outgoing one has finished its exit — and an exit
              runs on animation frames, which a browser suspends for a hidden
              tab. Caught mid-switch, the heading changed and the form did not,
              leaving the password fields sitting under "Set a new password"
              with no way out: the tab strip was hidden in that mode and the
              only link back was inside the form that never mounted. Observed,
              not theorised — it survived several seconds of a visible page.

              A login form must not depend on an animation finishing in order
              to exist. Changing `key` remounts it anyway, so the entry
              animation still plays; all that is given up is the outgoing fade,
              and what is bought is a form that is always the mode it says it
              is. The same reasoning keeps `sent` out of the key: the step after
              the send is "go and look in your email", which is an instruction
              to switch tabs, so the code box is a plain conditional inside one
              form rather than a second keyed child. */}
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
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
                /* Locked once the code is out. Changing the address here and
                   then typing the digits sent to the old one produces an
                   "invalid token" that looks like the code was wrong. */
                readOnly={mode === "code" && sent}
              />

              {mode === "code" && sent && (
                <>
                  <label htmlFor="token" className="type-label mt-5 block text-muted">
                    Code from your email
                  </label>
                  <input
                    ref={codeRef}
                    id="token"
                    /* `inputMode` and not `type="number"`: a number field on a
                       code strips leading zeros, accepts a minus sign and puts
                       spinner arrows on a thing that is not a quantity. */
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6,10}"
                    maxLength={10}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="000000"
                    className={`${field} text-center text-[20px] tracking-[0.3em]`}
                    required
                  />

                  <div className="mt-3 flex items-center justify-between text-[12.5px]">
                    <button
                      type="button"
                      onClick={() => {
                        setSent(false);
                        setToken("");
                        setNotice("");
                        setError("");
                      }}
                      className="text-muted transition-colors hover:text-foreground"
                    >
                      Use a different email
                    </button>
                    <button
                      type="button"
                      disabled={cooldown > 0 || busy}
                      onClick={async () => {
                        const supabase = createClient();
                        if (!supabase) return;
                        setError("");
                        setBusy(true);
                        try {
                          await sendCode(supabase);
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="text-primary transition-colors hover:text-primary-hover disabled:text-subtle disabled:hover:text-subtle"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </button>
                  </div>
                </>
              )}

              {(mode === "password" || mode === "signup") && (
                <>
                  <label htmlFor="password" className="type-label mt-5 block text-muted">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                    className={field}
                    required
                    minLength={8}
                  />
                </>
              )}

              {mode === "password" && (
                <p className="mt-3 text-right text-[12.5px]">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-primary transition-colors hover:text-primary-hover"
                  >
                    Forgot your password?
                  </button>
                </p>
              )}

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
                {submitLabel()}
              </button>

              {mode === "code" && !sent && (
                <p className="mt-4 text-center text-[12px] leading-relaxed text-subtle">
                  No password to invent. We email you a code, and typing it both
                  proves the address is yours and creates your account. Already
                  have one? This signs you straight in.
                </p>
              )}

              {mode === "forgot" && (
                <p className="mt-5 text-center text-[12.5px] text-muted">
                  <button
                    type="button"
                    onClick={() => switchMode("password")}
                    className="text-primary hover:text-primary-hover"
                  >
                    ← Back to sign in
                  </button>
                </p>
              )}
          </motion.form>

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
