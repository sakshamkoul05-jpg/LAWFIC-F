"use client";

import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isAlreadyConfirmed, signUpWasDeclinedAsDuplicate } from "@/lib/auth-signals";

/**
 * TWO WAYS IN. NOT THREE.
 *
 * There used to be a third — an emailed code that both created an account and
 * signed you in. It worked, and it was still the wrong thing to offer, because
 * a customer standing at this page cannot tell "Email code" and "Create
 * account" apart. Two of the three tabs did overlapping jobs and the reader had
 * to understand the difference in order to pick, which is work this page should
 * be doing for them. One route in, one route back.
 *
 *   CREATE ACCOUNT — email, a password, then the code from the email, then the
 *   profile form. Nobody reaches the site until that form is filled in; the
 *   gate is in proxy.ts, not here, because a check that lives in the page it
 *   protects is a check anybody can walk around by typing a different URL.
 *
 *   SIGN IN — email and password. No mail, ever. Once an account exists,
 *   getting back into it must not depend on an inbox, on a site where mail has
 *   been the failure point more than once.
 *
 * WHY THE CODE COMES AFTER THE PASSWORD AND NOT INSTEAD OF IT
 *
 * `signUp` creates the account and Supabase holds it unconfirmed until the
 * address is proven. So the password is chosen in the same breath as the
 * address, and the code that follows proves the address belongs to whoever
 * chose it. The alternative — confirm first, set a password later — leaves a
 * live account with no password on it for as long as the customer takes to
 * come back, and that is a worse thing to have lying around than an
 * unconfirmed one.
 *
 * FORGETTING A PASSWORD IS NOT A THIRD WAY IN
 *
 * It is something that happens to you, not a route you would pick off a list,
 * so it is a link inside the sign-in form. The tab strip stays on screen while
 * you are there with neither tab pressed — hiding it once made the reset view a
 * room whose only door was a link inside the form, so anything that stopped the
 * form rendering stopped the reader leaving.
 *
 * WHAT THE EMAILS HAVE TO CONTAIN
 *
 * `{{ .Token }}` in the "Confirm signup" template. That is the one a new
 * customer meets and the one that gets forgotten, because the default template
 * ships with only a link in it — and a link cannot be typed into the code box.
 * The link still works as well: it lands on /auth/callback.
 *
 * Mail goes out through Resend on lawfic.pro; the setup, and the DNS records
 * that decide whether any of it reaches an inbox rather than a spam folder, are
 * in the README. Nothing about Resend appears in this codebase — Supabase sends
 * over SMTP, so the API key lives in the Supabase dashboard and there is no
 * environment variable here to leak or forget to rotate.
 *
 * The loud failures stay. A refused send says so in words, because a domain can
 * fall out of verification and a sign-up page that goes quiet when mail stops
 * is one nobody can report a fault on.
 */

type Mode = "password" | "signup" | "forgot";

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
    return "New accounts are switched off at the moment. Contact us and we will sort it out.";
  }
  return message;
}

/** Supabase refuses a second send inside a minute, so the button says so. */
const RESEND_SECONDS = 60;

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/wallet";

  /* Signing in is what this page opens on. It is the thing that happens most,
     forever — an account is created once and signed into for years. */
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  /* Creating an account is two stages behind one tab: take the address and a
     password, then take the code that proves the address. A separate mode for
     the second stage would put a tab on the strip nobody can click into. */
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
    (mode === "forgot"
      ? emailOk
      : mode === "signup"
        ? sent
          ? tokenOk
          : emailOk && passwordOk && matches
        : emailOk && passwordOk);

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

  /**
   * Send the confirmation code again.
   *
   * `auth.resend` and not `signUp` a second time. Calling signUp again for an
   * address that already exists is how you get "User already registered"
   * thrown at somebody whose only crime was that the first email did not
   * arrive — the single most common reason anyone presses this button.
   */
  async function resendCode(supabase: NonNullable<ReturnType<typeof createClient>>) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: callback("/profile/setup") },
    });
    if (error) {
      /* An address that is ALREADY confirmed has nothing to re-send, and
         Supabase says so plainly here rather than with a decoy. Pointing at
         the sign-in form is the useful answer; "resend failed" is not. */
      if (isAlreadyConfirmed(error.message)) {
        switchMode("password");
        setNotice(`${email} is already confirmed. Sign in with your password.`);
        return;
      }
      setError(readable(error.message));
      return;
    }
    setCooldown(RESEND_SECONDS);
    setNotice(`We sent another code to ${email}. Use the newest one — the older code stops working.`);
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

      /* ── Create an account: password first, then prove the address ── */
      if (mode === "signup") {
        /* Stage two. The account exists and is waiting to be confirmed. */
        if (sent) {
          const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            /* "signup" and not "email". They are different token types in
               Supabase and a confirmation issued by signUp only verifies
               against this one; passing "email" here fails with a message that
               reads exactly like a mistyped code. */
            type: "signup",
          });
          if (error) {
            setError(readable(error.message));
            return;
          }

          /* Straight to the form, and the proxy will keep them there until it
             is filled in. Not `next` — an account with no profile has nothing
             to show on a wallet page. */
          router.push("/profile/setup");
          router.refresh();
          return;
        }

        /* Stage one. */
        setNotice("");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            /* Where the LINK in the same email lands, for anyone who clicks it
               instead of typing the code. Both routes end at the same form. */
            emailRedirectTo: callback("/profile/setup"),
            /* Chose a password on the way in, so profile setup must not turn
               round and offer to set one. See the note in
               /api/profile/password for why this is remembered rather than
               read off the user. */
            data: { has_password: true },
          },
        });

        if (error) {
          setError(readable(error.message));
          return;
        }

        /* A session here means confirmations are switched OFF in the Supabase
           dashboard — the account is live already and there is no code coming,
           so asking for one would hang the customer on a screen waiting for an
           email nobody sent. */
        if (data.session) {
          router.push("/profile/setup");
          router.refresh();
          return;
        }

        /**
         * THE ADDRESS ALREADY HAS AN ACCOUNT, AND SUPABASE WILL NOT SAY SO.
         *
         * Signing up with an email that already exists returns 200 with a
         * plausible-looking user, a `confirmation_sent_at` timestamp, and NO
         * EMAIL SENT. That is deliberate on their side — an endpoint that
         * answered "already registered" would let anyone test a list of
         * addresses against this site and learn who has an account here.
         *
         * The one honest signal is `identities: []`. A genuinely new account
         * comes back with one identity; the decoy comes back with none. The
         * timestamp is part of the decoy and means nothing, which is exactly
         * how this shipped broken: the code checked `session`, saw none, and
         * announced "We sent a code" for an email that was never sent. The
         * customer then waited for a code that did not exist, tried again, and
         * got the same lie — with the send counter in the mail provider
         * showing nothing, because nothing was sent.
         *
         * Saying "that email already has an account" here gives away no more
         * than the sign-in form already does, and is the only thing that gets
         * somebody unstuck.
         */
        if (signUpWasDeclinedAsDuplicate(data.user)) {
          /* switchMode clears the notice; both calls are in this one handler,
             so React batches them and the setNotice below is the one that
             lands. Written in this order deliberately. */
          switchMode("password");
          setNotice(
            `${email} already has an account. Sign in with your password — or use "Forgot your password?" if you do not have it.`,
          );
          return;
        }

        setSent(true);
        setCooldown(RESEND_SECONDS);
        setNotice(`We sent a code to ${email}. It is good for ten minutes.`);
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
    signup: {
      label: "Create account",
      /* The title follows the stage, because "Create your account" over a
         single code box reads as though the first step did not take. */
      title: sent ? "Check your email" : "Create your LAWFIC account",
    },
    forgot: { label: "Reset password", title: "Set a new password" },
  };

  const submitLabel = () => {
    if (busy) return "Working…";
    if (mode === "forgot") return "Email me a reset link";
    if (mode === "signup") return sent ? "Verify and continue" : "Create account";
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
          {/* Two tabs. There is no third way in — see the note at the top of
              this file for why the emailed-code route was taken out rather
              than kept "in case".

              Resetting a password is reached from the sign-in form, and the
              strip STAYS ON SCREEN while you are there with neither tab
              pressed. Hiding it once made the reset view a room whose only
              door was a link inside the form, so anything that stopped the
              form rendering stopped the reader leaving. A control that is the
              only way out of a state must not live inside the part of the page
              that state re-renders. */}
          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border">
            {(
              [
                ["password", "Sign in"],
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
                readOnly={mode === "signup" && sent}
              />

              {mode === "signup" && sent && (
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
                    {/* "Start again" and not "Use a different email".
                        The account already exists at this point, unconfirmed —
                        going back does not delete it, and offering to change
                        the address would imply it does. What this actually
                        does is return to the form, and a second address makes
                        a second account. Saying "start again" is the honest
                        description of that. */}
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
                      Start again
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
                          await resendCode(supabase);
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

              {(mode === "password" || (mode === "signup" && !sent)) && (
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

              {mode === "signup" && !sent && (
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

              {mode === "signup" && !sent && (
                <p className="mt-4 text-center text-[12px] leading-relaxed text-subtle">
                  We will email you a code to confirm the address, then ask for
                  a few details. After that you sign in with your password —
                  no code needed again.
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
