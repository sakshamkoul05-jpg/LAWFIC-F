"use client";

import Link from "next/link";
import { useState } from "react";
import { CARD_TYPES, AVATAR_SEEDS, type WalletPrefs, type CardTypeId } from "@/lib/wallet-custom";
import WalletCard from "@/components/wallet/WalletCard";
import WalletPocket from "@/components/wallet/WalletPocket";
import DiceBearAvatar from "@/components/wallet/DiceBearAvatar";

const DEMO_BALANCE_PAISE = 2435000;

/* Sample rows for the signed-out preview.
   These previously read as a real statement — "Court filing fee — Delhi HC",
   "Legal consultation — SME advisory" — shown to visitors with nothing marking
   them as illustrative. Two things were wrong with that: invented records were
   presented as genuine on a real company's public page, and they described
   litigation and advisory work LAWFIC does not do. It prepares registrations,
   licences and statutory filings. The rows below say only what LAWFIC actually
   sells, and the panel they render in is labelled as an example. */
const DEMO_TXNS = [
  { id: "d1", reason: "GST Registration — professional fee", date: "28 Aug 2026", amount: -149900, dir: "debit" as const, avatar: "Aneka" },
  { id: "d2", reason: "Wallet top-up", date: "25 Aug 2026", amount: 500000, dir: "credit" as const, avatar: "Felix" },
  { id: "d3", reason: "PAN Services — government fee", date: "20 Aug 2026", amount: -10700, dir: "debit" as const, avatar: "Jasper" },
];

export default function WalletDemo() {
  const [draft, setDraft] = useState<WalletPrefs>({ cardType: "standard", avatarSeed: "Felix" });
  const [cardOut, setCardOut] = useState(false);
  const [customSeed, setCustomSeed] = useState("");

  const applySeed = (seed: string) => {
    setCustomSeed(seed);
    setDraft((d) => ({ ...d, avatarSeed: seed }));
  };

  const pickCardType = (id: CardTypeId) => {
    setDraft((d) => ({ ...d, cardType: id }));
  };

  return (
    <div className="mx-auto max-w-lg" style={{ color: "var(--wallet-fg)" }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[13px]" style={{ color: "var(--wallet-fg-muted)" }}>Welcome to</p>
          <h1 className="text-[20px] font-semibold tracking-tight">LAWFiC Wallet</h1>
        </div>
        <DiceBearAvatar seed={draft.avatarSeed} size={40} />
      </div>

      {/* Card in pocket */}
      <WalletPocket cardOut={cardOut} onToggleCard={() => setCardOut((v) => !v)}>
        <WalletCard prefs={draft} balancePaise={DEMO_BALANCE_PAISE} animateBalance />
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/login?next=/wallet"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium transition-all duration-200"
            style={{ background: "var(--wallet-btn-bg)", color: "var(--wallet-btn-text)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Add Balance
          </Link>
          <button
            type="button"
            onClick={() => document.getElementById("demo-customize")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center justify-center rounded-xl px-4 py-3 text-[13px] font-medium transition-all duration-200"
            style={{ background: "var(--wallet-btn-bg)", color: "var(--wallet-btn-text)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.5 1.5l2 2-9 9H3.5v-2l9-9z" />
            </svg>
          </button>
        </div>
      </WalletPocket>

      {/* Quick actions */}
      {/* See the note in app/wallet/page.tsx: this wallet never pays out, so
          no payout affordance belongs here — not even a disabled one. */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { label: "Add money", icon: "M8 3v10M3 8h10" },
          { label: "Statement", icon: "M4 6h8M4 10h8" },
          { label: "Your filings", icon: "M3 3h10v10H3z" },
        ].map((a) => (
          <button
            key={a.label}
            type="button"
            className="wallet-glass flex flex-col items-center gap-2.5 rounded-2xl py-4 text-[11px] font-medium transition-all duration-200 hover:scale-[1.03]"
            style={{ color: "var(--wallet-fg)" }}
          >
            <div
              className="flex size-9 items-center justify-center rounded-full"
              style={{ background: "var(--wallet-icon-circle)", color: "var(--wallet-icon-fg)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={a.icon} />
              </svg>
            </div>
            {a.label}
          </button>
        ))}
      </div>

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
              <DiceBearAvatar seed={t.avatar} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{t.reason}</p>
                <p className="mt-0.5 font-mono text-[11px] opacity-35">{t.date}</p>
              </div>
              <p
                className={`shrink-0 font-mono text-[13px] tabular-nums ${
                  t.dir === "credit" ? "text-[#34c759]" : "opacity-50"
                }`}
              >
                {t.dir === "credit" ? "+" : "−"}₹{Math.abs(t.amount / 100).toLocaleString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Customize section */}
      <div id="demo-customize" className="mt-10 scroll-mt-24">
        <p className="mb-5 text-center text-[13px] opacity-45">
          Create your card — pick a type and your avatar.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Card type picker */}
          <div className="wallet-glass rounded-2xl p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
              Card type
            </p>
            <div className="space-y-2">
              {CARD_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCardType(c.id)}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all duration-200"
                  style={{
                    background: draft.cardType === c.id ? "var(--wallet-btn-bg-hover)" : "transparent",
                  }}
                >
                  <div className="h-7 w-10 shrink-0 rounded-lg" style={{ background: c.gradient }} />
                  <div>
                    <p className="text-[12px] font-medium">{c.name}</p>
                    <p className="text-[10px] opacity-40">{c.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Avatar seed picker */}
          <div className="wallet-glass rounded-2xl p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
              Your avatar
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AVATAR_SEEDS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => applySeed(seed)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200"
                  style={{
                    background: draft.avatarSeed === seed && !customSeed ? "var(--wallet-btn-bg-hover)" : "var(--wallet-btn-bg)",
                    color: draft.avatarSeed === seed && !customSeed ? "var(--wallet-fg)" : "var(--wallet-fg-muted)",
                  }}
                >
                  <DiceBearAvatar seed={seed} size={20} />
                  {seed}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customSeed}
              onChange={(e) => applySeed(e.target.value)}
              placeholder="Or type your name…"
              className="mt-3 w-full rounded-xl border px-3.5 py-2.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#5856d6]/40"
              style={{
                borderColor: "var(--wallet-input-border)",
                background: "var(--wallet-input-bg)",
                color: "var(--wallet-input-text)",
              }}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login?next=/wallet"
            className="inline-flex items-center gap-2 rounded-full bg-[#5856d6] px-7 py-3 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#4a49b8]"
          >
            Sign in to keep this card
          </Link>
          <p className="mt-3 text-[11px] opacity-30">
            Your card and avatar stay attached to your account.
          </p>
        </div>
      </div>
    </div>
  );
}
