"use client";

import Link from "next/link";
import { useState } from "react";
import { HIDES, AVATAR_SEEDS, DEFAULT_PREFS, type WalletPrefs, type HideId } from "@/lib/wallet-custom";
import LeatherWallet from "@/components/wallet/LeatherWallet";
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
 * sample balance, and enough of the customisation to make the object feel
 * like something they would own.
 */
export default function WalletDemo() {
  const [draft, setDraft] = useState<WalletPrefs>({ ...DEFAULT_PREFS, nameplate: "YOUR NAME" });
  const [customSeed, setCustomSeed] = useState("");

  const pickHide = (id: HideId) => setDraft((d) => ({ ...d, hide: id }));
  const applySeed = (seed: string) => {
    setCustomSeed(seed);
    setDraft((d) => ({ ...d, avatarSeed: seed }));
  };

  return (
    <div className="mx-auto max-w-lg" style={{ color: "var(--wallet-fg)" }}>
      <WalletOnboarding />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[13px]" style={{ color: "var(--wallet-fg-muted)" }}>Welcome to</p>
          <h1 className="text-[20px] font-semibold tracking-tight">LAWFiC Wallet</h1>
        </div>
        <WalletAvatar seed={draft.avatarSeed} size={40} />
      </div>

      <div className="flex justify-center">
        <LeatherWallet look={draft} balancePaise={DEMO_BALANCE_PAISE} />
      </div>

      <div className="mt-7 flex justify-center">
        <Link
          href="/login?next=/wallet"
          className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-primary-hover"
        >
          Add balance
        </Link>
      </div>

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

      {/* A taste of the customisation, so the object reads as ownable */}
      <div id="demo-customize" className="mt-10 scroll-mt-24">
        <p className="mb-5 text-center text-[13px] opacity-45">
          Pick your leather and your face. Sign in to stamp your name on it.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="wallet-glass rounded-2xl p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
              Leather
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {HIDES.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => pickHide(h.id)}
                  aria-pressed={draft.hide === h.id}
                  className="overflow-hidden rounded-xl border text-left transition-transform hover:-translate-y-0.5"
                  style={{
                    borderColor:
                      draft.hide === h.id ? "var(--wallet-icon-fg)" : "var(--wallet-input-border)",
                  }}
                >
                  <span
                    className="block h-12 w-full"
                    style={{
                      background: `linear-gradient(150deg, ${h.outer[0]}, ${h.outer[1]} 55%, ${h.outer[2]})`,
                    }}
                  />
                  <span className="block px-2.5 py-1.5 text-[11.5px] font-medium">{h.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="wallet-glass rounded-2xl p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
              Your avatar
            </p>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_SEEDS.map((seed) => {
                const on = draft.avatarSeed === seed && !customSeed;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => applySeed(seed)}
                    aria-label={`Choose avatar ${seed}`}
                    aria-pressed={on}
                    className="rounded-full transition-transform duration-200 hover:scale-105"
                    style={{
                      outline: on ? "2px solid var(--wallet-icon-fg)" : "2px solid transparent",
                      outlineOffset: 2,
                    }}
                  >
                    <WalletAvatar seed={seed} size={40} />
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={customSeed}
              onChange={(e) => applySeed(e.target.value)}
              placeholder="Or type your name…"
              className="mt-3 w-full rounded-xl border px-3.5 py-2.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/40"
              style={{
                borderColor: "var(--wallet-input-border)",
                background: "var(--wallet-input-bg)",
                color: "var(--wallet-input-text)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
