"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

/**
 * Front-end only. Wired to Supabase Auth (phone OTP via MSG91) in Phase 1 —
 * the DLT template registration has to clear before real SMS will deliver.
 */
export default function LoginForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const valid = /^[6-9]\d{9}$/.test(phone);

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    if (d && i < 5) boxes.current[i + 1]?.focus();
  }

  return (
    <div className="w-full max-w-md justify-self-center lg:justify-self-end">
      <div className="overflow-hidden rounded-xl border border-line-2 bg-gradient-to-b from-surface-2 to-ink-2 shadow-2xl shadow-black/60">
        <div className="border-b border-line px-7 py-5">
          <p className="label text-slate">{step === "phone" ? "Step 1 of 2" : "Step 2 of 2"}</p>
          <h2 className="mt-2 font-display text-[22px] text-bone">
            {step === "phone" ? "Sign in or create an account" : "Enter the code"}
          </h2>
        </div>

        <div className="p-7">
          <AnimatePresence mode="wait" initial={false}>
            {step === "phone" ? (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (valid) setStep("otp");
                }}
              >
                <label htmlFor="phone" className="label text-slate">
                  Mobile number
                </label>
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

                <button
                  type="submit"
                  disabled={!valid}
                  className="mt-6 w-full rounded-full bg-brass py-3.5 text-sm font-medium text-ink transition-all hover:bg-brass-hi disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-slate"
                >
                  Send code
                </button>

                <p className="mt-5 text-[12px] leading-relaxed text-slate">
                  By continuing you agree to our Terms and Privacy Policy. We use your number to
                  sign you in and to update you on your filings.
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
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

                <button
                  type="button"
                  className="mt-6 w-full rounded-full bg-brass py-3.5 text-sm font-medium text-ink transition-colors hover:bg-brass-hi"
                >
                  Verify and continue
                </button>

                <div className="mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="text-[13px] text-ash hover:text-bone"
                  >
                    Change number
                  </button>
                  <span className="text-[13px] text-slate">Resend in 0:28</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="border-t border-line bg-ink/40 px-7 py-3.5 text-[11.5px] text-slate">
          Preview build — no code is sent yet.
        </p>
      </div>
    </div>
  );
}
