"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Method = "email" | "phone";
type Stage = "enter" | "sent" | "otp";

const ERRORS: Record<string, string> = {
  link_expired: "That link has expired. Send yourself a fresh one.",
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
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        setStage("sent");
      } else {
        const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
        if (error) throw error;
        setStage("otp");
      }
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
      const { error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: code,
        type: "sms",
      });
      if (error) throw error;
      router.push(next);
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
      <div className="overflow-hidden rounded-xl border border-line-2 bg-gradient-to-b from-surface-2 to-ink-2 shadow-2xl shadow-black/60">
        <div className="border-b border-line px-7 py-5">
          <p className="label text-slate">
            {stage === "enter" ? "Step 1 of 2" : stage === "otp" ? "Step 2 of 2" : "Check your inbox"}
          </p>
          <h2 className="mt-2 font-display text-[22px] text-bone">
            {stage === "sent" ? "Link sent" : stage === "otp" ? "Enter the code" : "Sign in or create an account"}
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
                {/* method toggle */}
                <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded border border-line-2 bg-line">
                  {(["email", "phone"] as Method[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMethod(m); setError(""); }}
                      className={`py-2.5 text-[13px] transition-colors ${
                        method === m ? "bg-brass/12 text-brass-hi" : "bg-ink/50 text-ash hover:text-bone"
                      }`}
                    >
                      {m === "email" ? "Email link" : "Mobile OTP"}
                    </button>
                  ))}
                </div>

                {method === "email" ? (
                  <>
                    <label htmlFor="email" className="label text-slate">Email address</label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2.5 w-full rounded border border-line-2 bg-ink/60 px-3.5 py-3.5 text-[15px] text-bone outline-none transition-colors focus:border-brass-lo placeholder:text-slate/60"
                    />
                  </>
                ) : (
                  <>
                    <label htmlFor="phone" className="label text-slate">Mobile number</label>
                    <div className="mt-2.5 flex items-center gap-2 rounded border border-line-2 bg-ink/60 px-3 focus-within:border-brass-lo">
                      <span className="font-mono text-[15px] text-slate">+91</span>
                      <span className="h-5 w-px bg-line-2" aria-hidden />
                      <input
                        id="phone"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="w-full bg-transparent py-3.5 font-mono text-[15px] tracking-[0.08em] text-bone outline-none placeholder:text-slate/60"
                      />
                    </div>
                  </>
                )}

                {error && <p className="mt-4 text-[13px] leading-relaxed text-rust">{error}</p>}

                <button
                  type="submit"
                  disabled={!canSend || busy}
                  className="mt-6 w-full rounded-full bg-brass py-3.5 text-sm font-medium text-ink transition-all hover:bg-brass-hi disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-slate"
                >
                  {busy ? "Sending…" : method === "email" ? "Email me a link" : "Send code"}
                </button>

                <p className="mt-5 text-[12px] leading-relaxed text-slate">
                  By continuing you agree to our Terms and Privacy Policy. We use your details to
                  sign you in and to update you on your filings.
                </p>
              </motion.form>
            )}

            {stage === "sent" && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-start gap-3.5">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0" aria-hidden>
                    <rect x="2" y="4.5" width="16" height="11" rx="2" stroke="var(--color-brass)" strokeWidth="1.2" />
                    <path d="m2.8 5.5 7.2 5 7.2-5" stroke="var(--color-brass)" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <p className="text-[14.5px] leading-relaxed text-ash">
                    We sent a sign-in link to{" "}
                    <span className="text-bone">{email}</span>. Open it on this device and you are in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStage("enter")}
                  className="mt-6 text-[13px] text-ash hover:text-bone"
                >
                  Use a different address
                </button>
              </motion.div>
            )}

            {stage === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.22 }}
              >
                <p className="text-[14px] text-ash">
                  Sent to <span className="font-mono text-bone">+91 {phone}</span>
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
                      className="h-13 w-full rounded border border-line-2 bg-ink/60 text-center font-mono text-[19px] text-bone outline-none transition-colors focus:border-brass"
                    />
                  ))}
                </div>

                {error && <p className="mt-4 text-[13px] leading-relaxed text-rust">{error}</p>}

                <button
                  type="button"
                  onClick={verify}
                  disabled={busy || otp.join("").length !== 6}
                  className="mt-6 w-full rounded-full bg-brass py-3.5 text-sm font-medium text-ink transition-colors hover:bg-brass-hi disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-slate"
                >
                  {busy ? "Checking…" : "Verify and continue"}
                </button>

                <button
                  type="button"
                  onClick={() => { setStage("enter"); setOtp(["", "", "", "", "", ""]); }}
                  className="mt-5 text-[13px] text-ash hover:text-bone"
                >
                  Change number
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isSupabaseConfigured && (
          <p className="border-t border-line bg-ink/40 px-7 py-3.5 text-[11.5px] text-slate">
            Sign-in is not connected yet — add the Supabase keys to switch it on.
          </p>
        )}
      </div>
    </div>
  );
}
