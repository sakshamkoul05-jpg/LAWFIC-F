"use client";

import Link from "next/link";
import { useState } from "react";
import { AVATAR_SEEDS, DEFAULT_PREFS, type WalletPrefs } from "@/lib/wallet-custom";
import WalletSection from "@/components/wallet/WalletSection";
import WalletAvatar from "@/components/wallet/WalletAvatar";
import WalletActions from "@/components/wallet/WalletActions";
import WalletMenu from "@/components/wallet/WalletMenu";
import WalletOnboarding from "@/components/wallet/WalletOnboarding";

const DEMO_BALANCE_PAISE = 2435000;

/* Sample rows for the signed-out preview.
   These once read as a real statement — "Court filing fee — Delhi HC" — shown
   with nothing marking them as illustrative. Invented records presented as
   genuine on a real company's page, describing litigation LAWFIC does not do.
   The rows below name only what LAWFIC sells, and the panel is labelled. */
const DEMO_TXNS = [
  { id: "d1", reason: "GST Registration — professional fee", date: "28 Aug 2026", amount: -149900, dir: "debit" as const, avatar: "Aneka" },
  { id: "d2", reason: "Wallet top-up", date: "25 Aug 2026", amount: 500000, dir: "credit" as const, avatar: "Felix" },
  { id: "d3", reason: "PAN Services — government fee", date: "20 Aug 2026", amount: -10700, dir: "debit" as const, avatar: "Jasper" },
];

/**
 * What a signed-out visitor sees at /wallet: the real wallet, filled with a
 * sample balance, openable, and with every leather selectable. Someone deciding
 * whether to sign up should be able to hold the thing first.
 */
export default function WalletDemo() {
  const [prefs] = useState<WalletPrefs>({ ...DEFAULT_PREFS, nameplate: "YOUR NAME" });
  const [seed, setSeed] = useState(DEFAULT_PREFS.avatarSeed);

  return (
    <div className="mx-auto max-w-lg" style={{ color: "var(--wallet-fg)" }}>
      <WalletOnboarding />

      <WalletSection
        prefs={{ ...prefs, avatarSeed: seed }}
        balancePaise={DEMO_BALANCE_PAISE}
        eyebrow={
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[13px]" style={{ color: "var(--wallet-fg-muted)" }}>
                Welcome to
              </p>
              <h1 className="text-[20px] font-semibold tracking-tight">LAWFiC Wallet</h1>
            </div>
            <WalletAvatar seed={seed} size={40} />
          </div>
        }
        actions={
          <div className="mt-7 flex justify-center">
            <Link
              href="/login?next=/wallet"
              className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-primary-hover"
            >
              Add balance
            </Link>
          </div>
        }
      />

      <WalletActions />

      {/* Recent transactions */}
      <div className="wallet-glass mt-8 overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-50">
            Example statement
          </p>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em]"
            style={{ background: "var(--wallet-icon-circle)", color: "var(--wallet-icon-fg)" }}
          >
            Sample
          </span>
        </div>
        <ul style={{ borderColor: "var(--wallet-divider)" }} className="divide-y">
          {DEMO_TXNS.map((t) => (
            <li key={t.id} className="flex items-center gap-4 px-5 py-3.5">
              <WalletAvatar seed={t.avatar} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{t.reason}</p>
                <p className="mt-0.5 font-mono text-[11px] opacity-35">{t.date}</p>
              </div>
              <p
                className={`shrink-0 font-mono text-[13px] tabular-nums ${
                  t.dir === "credit" ? "text-success" : "opacity-50"
                }`}
              >
                {t.dir === "credit" ? "+" : "−"}₹{Math.abs(t.amount / 100).toLocaleString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <WalletMenu />

      {/* The face on the wallet. The leather is chosen on the wallet itself. */}
      <div id="demo-customize" className="mt-10 scroll-mt-24">
        <p
          className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.24em]"
          style={{ color: "var(--wallet-fg-muted)" }}
        >
          Your face
        </p>
        <div className="flex flex-wrap justify-center gap-2">
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
        <p className="mt-5 text-center text-[12.5px] opacity-45">
          Sign in to stamp your name on the plate.
        </p>
      </div>
    </div>
  );
}
