"use client";

import Link from "next/link";
import { useState } from "react";
import { AVATAR_SEEDS, DEFAULT_PREFS, type WalletPrefs } from "@/lib/wallet-custom";
import WalletSection from "@/components/wallet/WalletSection";
import WalletAvatar from "@/components/wallet/WalletAvatar";
import WalletQuickActions from "@/components/wallet/WalletQuickActions";
import WalletMenu from "@/components/wallet/WalletMenu";
import WalletOnboarding from "@/components/wallet/WalletOnboarding";

const DEMO_BALANCE_PAISE = 2435000;

/* Sample rows for the signed-out preview.
   These once read as a real statement — "Court filing fee — Delhi HC" — shown
   with nothing marking them as illustrative. Invented records presented as
   genuine on a real company's page, describing litigation LAWFIC does not do.
   The rows below name only what LAWFIC sells, and the panel is labelled. */
const DEMO_TXNS = [
  { id: "d1", reason: "GST Registration — professional fee", date: "28 Aug 2026", amount: -149900, dir: "debit" as const },
  { id: "d2", reason: "Wallet top-up", date: "25 Aug 2026", amount: 500000, dir: "credit" as const },
  { id: "d3", reason: "PAN Services — government fee", date: "20 Aug 2026", amount: -10700, dir: "debit" as const },
];

/**
 * What a signed-out visitor sees at /wallet: the real wallet, filled with a
 * sample balance, openable, and fully customisable. Someone deciding whether to
 * sign up should be able to hold the thing first.
 *
 * The layout deliberately mirrors the signed-in page section for section, so
 * signing in reveals the visitor's own numbers rather than a different page.
 * The only differences are the labels that say this is a sample and the CTA,
 * which goes to sign-in rather than to top-up.
 */
export default function WalletDemo() {
  const [prefs] = useState<WalletPrefs>({ ...DEFAULT_PREFS, nameplate: "YOUR NAME" });
  const [seed, setSeed] = useState(DEFAULT_PREFS.avatarSeed);

  return (
    <div className="mx-auto w-full max-w-[860px]" style={{ color: "var(--wallet-fg)" }}>
      <WalletOnboarding />

      <header className="mb-10 flex items-center justify-between px-1">
        <div>
          <p className="cred-label">Welcome to</p>
          <p className="mt-2 text-[17px] font-medium tracking-tight">LAWFIC Wallet</p>
        </div>
        <WalletAvatar seed={seed} size={44} />
      </header>

      <div className="cred-stage">
        <WalletSection
          prefs={{ ...prefs, avatarSeed: seed }}
          balancePaise={DEMO_BALANCE_PAISE}
          lastEntry={{
            id: DEMO_TXNS[0].id,
            reason: DEMO_TXNS[0].reason,
            direction: DEMO_TXNS[0].dir,
            amountPaise: Math.abs(DEMO_TXNS[0].amount),
          }}
          actions={
            <Link
              href="/login?next=/wallet"
              className="cred-cta rounded-full bg-primary px-8 py-3 text-[13.5px] font-medium text-background transition-colors hover:bg-primary-hover"
            >
              Add balance
            </Link>
          }
        />
      </div>

      <p
        className="mt-4 text-center text-[11.5px]"
        style={{ color: "var(--wallet-fg-muted)" }}
      >
        Sample balance. Sign in for your own.
      </p>

      <div className="mt-16">
        <WalletQuickActions />
      </div>

      {/* SAMPLE STATEMENT. Labelled twice — a heading and a badge — because
          invented rows on a real company's page must never be mistakable for
          somebody's actual record. */}
      <section className="mt-16">
        <div className="mb-4 flex items-baseline justify-between px-1">
          <h2 className="cred-label">Example statement</h2>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]"
            style={{ background: "var(--wallet-icon-circle)", color: "var(--wallet-icon-fg)" }}
          >
            Sample
          </span>
        </div>

        <div className="cred-slab overflow-hidden">
          <ul className="divide-y" style={{ borderColor: "var(--wallet-divider)" }}>
            {DEMO_TXNS.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-4">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full"
                  style={{ background: "var(--wallet-btn-bg)", color: "var(--wallet-icon-fg)" }}
                  aria-hidden
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {t.dir === "credit" ? (
                      <path d="M10 15.5v-11M5.5 9L10 4.5 14.5 9" />
                    ) : (
                      <path d="M10 4.5v11M5.5 11l4.5 4.5L14.5 11" />
                    )}
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{t.reason}</p>
                  <p
                    className="mt-0.5 font-mono text-[11px]"
                    style={{ color: "var(--wallet-fg-muted)" }}
                  >
                    {t.date}
                  </p>
                </div>
                <p
                  className="shrink-0 font-mono text-[13.5px] tabular-nums"
                  style={{
                    color:
                      t.dir === "credit" ? "var(--color-success, #2f9e63)" : "var(--wallet-fg)",
                  }}
                >
                  {t.dir === "credit" ? "+ " : "− "}₹
                  {Math.abs(t.amount / 100).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The face on the wallet. The material is chosen on the wallet itself. */}
      <section className="mt-16 scroll-mt-24" id="demo-customize">
        <p className="cred-label mb-4 px-1">Your face</p>
        <div className="cred-slab flex flex-wrap justify-center gap-2.5 p-6">
          {AVATAR_SEEDS.slice(0, 10).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeed(s)}
              aria-label={`Choose avatar ${s}`}
              aria-pressed={seed === s}
              className="rounded-full transition-transform duration-200 hover:scale-105"
              style={{
                outline: seed === s ? "2px solid var(--wallet-icon-fg)" : "2px solid transparent",
                outlineOffset: 2,
              }}
            >
              <WalletAvatar seed={s} size={40} />
            </button>
          ))}
        </div>
        <p
          className="mt-4 px-1 text-[12px]"
          style={{ color: "var(--wallet-fg-muted)" }}
        >
          Sign in to keep the material, colour and engraving you choose.
        </p>
      </section>

      <div className="mt-16">
        <p className="cred-label mb-4 px-1">Wallet</p>
        <WalletMenu />
      </div>

      <p
        className="mt-10 px-1 text-[11.5px] leading-relaxed"
        style={{ color: "var(--wallet-fg-muted)" }}
      >
        Balance is usable only for LAWFIC services. It is not transferable, not
        refundable to a third party, and cannot be withdrawn as cash.
      </p>
    </div>
  );
}
