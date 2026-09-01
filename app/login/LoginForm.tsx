"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Method = "email" | "phone";
type Stage = "enter" | "otp";

const ERRORS: Record<string, string> = {
  link_expired: "That link has expired. Try signing in again.",
  missing_code: "That link was incomplete. Try signing in again.",
  not_configured: "Sign-in is not switched on yet.",
};

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/wallet";

  const [method, setMethod] = useState<Method>("email");
  const [stage, setStage] = useState<Stage>("enter");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(ERRORS[params.get("error") ?? ""] ?? "");
  const [sentTo, setSentTo] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const phoneOk = /^[6-9]\d{9}$/.test(phone);
  const canSend = method === "email" ? emailOk : phoneOk;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || busy) return;
    setError("");

    const supabase = createClient();
    if (!supabase) {
      setError("Sign-in is not switched on yet.");
      return;
    }

    setBusy(true);
    try {
      if (method === "email") {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setSentTo(email);
      } else {
        const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
        if (error) throw error;
        setSentTo(`+91 ${phone}`);
      }
      setStage("otp");
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    const code = otp.join("");
    if (code.length !== 6 || busy) return;
    setError("");

    const supabase = createClient();
    if (!supabase) return;

    setBusy(true);
    try {
      const result =
        method === "email"
          ? await supabase.auth.verifyOtp({ email, token: code, type: "email" })
          : await supabase.auth.verifyOtp({ phone: `+91${phone}`, token: code, type: "sms" });

      if (result.error) throw result.error;

      const { data } = await supabase.auth.getUser();
      const isNew = data.user && !data.user.user_metadata?.onboarded;
      router.push(isNew ? "/profile/setup" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code did not work.");
      setBusy(false);
    }
  }

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[i] = d;
    setOtp(nextOtp);
    if (d && i < 5) boxes.current[i + 1]?.focus();
  }

  return (
    <div className="w-full max-w-md justify-self-center lg:justify-self-end">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
        <div className="border-b border-border px-7 py-5">
          <p className="label text-muted">
            {stage === "enter" ? "Sign in" : "Enter the code"}
          </p>
          <h2 className="mt-2 font-display text-[22px] text-foreground">
            {stage === "enter" ? "Sign in or create an account" : "Check your inbox"}
          </h2>
        </div>

        <div className="p-7">
          <AnimatePresence mode="wait" initial={false}>
            {stage === "enter" && (
              <motion.form
                key="enter"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                onSubmit={send}
              >
                <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded border border-border">
                  {(["email", "phone"] as Method[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMethod(m); setError(""); }}
                      className={`py-2.5 text-[13px] transition-colors ${
                        method === m ? "bg-primary-light text-primary" : "bg-surface-2 text-muted hover:text-foreground"
                      }`}
                    >
                      {m === "email" ? "Email OTP" : "Mobile OTP"}
                    </button>
                  ))}
                </div>

                {method === "email" ? (
                  <>
                    <label htmlFor="email" className="label text-muted">Email address</label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2.5 w-full rounded border border-border bg-surface-2 px-3.5 py-3.5 text-[15px] text-foreground outline-none transition-colors focus:border-primary placeholder:text-subtle"
                    />
                  </>
                ) : (
                  <>
                    <label htmlFor="phone" className="label text-muted">Mobile number</label>
                    <div className="mt-2.5 flex items-center gap-2 rounded border border-border bg-surface-2 px-3 focus-within:border-primary">
                      <span className="font-mono text-[15px] text-muted">+91</span>
                      <span className="h-5 w-px bg-border" aria-hidden />
                      <input
                        id="phone"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="w-full bg-transparent py-3.5 font-mono text-[15px] tracking-[0.08em] text-foreground outline-none placeholder:text-subtle"
                      />
                    </div>
                  </>
                )}

                {error && <p className="mt-4 text-[13px] leading-relaxed text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={!canSend || busy}
                  className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle"
                >
                  {busy ? "Sending…" : "Send code"}
                </button>

                <p className="mt-5 text-[12px] leading-relaxed text-subtle">
                  By continuing you agree to our Terms and Privacy Policy. We use your details to
                  sign you in and to update you on your filings.
                </p>
              </motion.form>
            )}

            {stage === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.22 }}
              >
                <p className="text-[14px] text-muted">
                  A 6-digit code was sent to{" "}
                  <span className="font-mono text-foreground">{sentTo}</span>
                </p>

                <div className="mt-5 flex gap-2">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { boxes.current[i] = el; }}
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i] && i > 0) boxes.current[i - 1]?.focus();
                      }}
                      aria-label={`Digit ${i + 1}`}
                      className="h-13 w-full rounded border border-border bg-surface-2 text-center font-mono text-[19px] text-foreground outline-none transition-colors focus:border-primary"
                    />
                  ))}
                </div>

                {error && <p className="mt-4 text-[13px] leading-relaxed text-destructive">{error}</p>}

                <button
                  type="button"
                  onClick={verify}
                  disabled={busy || otp.join("").length !== 6}
                  className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle"
                >
                  {busy ? "Verifying…" : "Verify and continue"}
                </button>

                <div className="mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStage("enter")}
                    className="text-[13px] text-muted hover:text-foreground"
                  >
                    Change {method === "email" ? "address" : "number"}
                  </button>
                  <button
                    type="button"
                    onClick={send}
                    disabled={busy}
                    className="text-[13px] text-primary hover:text-primary-hover disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isSupabaseConfigured && (
          <p className="border-t border-border bg-surface-2 px-7 py-3.5 text-[11.5px] text-subtle">
            Sign-in is not connected yet — add the Supabase keys to switch it on.
          </p>
        )}
      </div>
    </div>
  );
}