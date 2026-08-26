import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to LAWFIC with your mobile number.",
};

export default function LoginPage() {
  return (
    <section className="grain bloom relative min-h-[calc(100vh-4.5rem)] overflow-hidden">
      <div className="relative z-2 mx-auto grid max-w-6xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="label text-brass">Your account</p>
          <h1 className="mt-6 max-w-md font-display text-[clamp(32px,4.6vw,48px)] leading-[1.08] text-bone">
            One number. Every filing you have ever sent us.
          </h1>
          <p className="mt-7 max-w-md text-[16px] leading-relaxed text-ash">
            Signing in gives you the wallet, the status of each order down to its reference number,
            and a jobs feed narrowed to your city and trade.
          </p>

          <ul className="mt-10 flex flex-col gap-4">
            {[
              "Track every filing to its certificate",
              "Pay from a prepaid balance, no card re-entry",
              "Jobs matched to your profile — free, always",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[14.5px] text-ash">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden>
                  <circle cx="8" cy="8" r="7" stroke="var(--color-brass-lo)" strokeWidth="1.1" />
                  <path d="m5 8.2 2 2 4-4.2" stroke="var(--color-brass)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <LoginForm />
      </div>
    </section>
  );
}
