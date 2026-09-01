import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to LAWFIC with your email or phone number.",
};

export default function LoginPage() {
  return (
    <section className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-surface">
      <div className="relative z-2 mx-auto grid max-w-6xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="label text-primary">Your account</p>
          <h1 className="mt-6 max-w-md font-display text-[clamp(32px,4.6vw,48px)] leading-[1.08] text-foreground">
            One code. Every filing you have ever sent us.
          </h1>
          <p className="mt-7 max-w-md text-[16px] leading-relaxed text-muted">
            Enter your email or phone, get a one-time code, and you're in.
            Wallet, order tracking, and a jobs feed matched to your profile.
          </p>

          <ul className="mt-10 flex flex-col gap-4">
            {[
              "Track every filing to its certificate",
              "Pay from a prepaid balance, no card re-entry",
              "Jobs matched to your profile — free, always",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[14.5px] text-muted">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden>
                  <circle cx="8" cy="8" r="7" stroke="var(--color-primary)" strokeWidth="1.1" />
                  <path d="m5 8.2 2 2 4-4.2" stroke="var(--color-primary)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <Suspense
          fallback={
            <div className="h-[420px] w-full max-w-md justify-self-center rounded-xl border border-border bg-surface lg:justify-self-end" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
