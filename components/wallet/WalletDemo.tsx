"use client";

import Link from "next/link";
import { useState } from "react";
import { CARD_TYPES, AVATAR_SEEDS, type WalletPrefs, type CardTypeId } from "@/lib/wallet-custom";
import WalletCard from "@/components/wallet/WalletCard";
import WalletPocket from "@/components/wallet/WalletPocket";
import DiceBearAvatar from "@/components/wallet/DiceBearAvatar";

const DEMO_BALANCE_PAISE = 2435000;

const DEMO_TXNS = [
  { id: "d1", reason: "Legal consultation — SME advisory", date: "28 Aug 2026", amount: -250000, dir: "debit" as const, avatar: "Aneka" },
  { id: "d2", reason: "Wallet top-up via UPI", date: "25 Aug 2026", amount: 500000, dir: "credit" as const, avatar: "Felix" },
  { id: "d3", reason: "Court filing fee — Delhi HC", date: "20 Aug 2026", amount: -15000, dir: "debit" as const, avatar: "Jasper" },
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
    <div className="mx-auto max-w-xl" style={{ color: "var(--wallet-fg)" }}>
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[13px]" style={{ color: "var(--wallet-fg-muted)" }}>Welcome to</p>
          <h1 className="text-[22px] font-bold">LAWFiC Wallet</h1>
        </div>
        <DiceBearAvatar seed={draft.avatarSeed} size={44} />
      </div>

      {/* ─── Pocket with card ──────────────────────────────────── */}
      <WalletPocket cardOut={cardOut} onToggleCard={() => setCardOut((v) => !v)}>
        <WalletCard prefs={draft} balancePaise={DEMO_BALANCE_PAISE} animateBalance />
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/login?next=/wallet"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-semibold transition-all"
            style={{ background: "var(--wallet-btn-bg)", color: "var(--wallet-btn-text)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Add Balance
          </Link>
          <button
            type="button"
            onClick={() => document.getElementById("demo-customize")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center justify-center rounded-2xl px-4 py-3.5 text-[13px] font-medium transition-colors"
            style={{ background: "var(--wallet-btn-bg)", color: "var(--wallet-btn-text)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.5 1.5l2 2-9 9H3.5v-2l9-9z" />
            </svg>
          </button>
        </div>
      </WalletPocket>

      {/* ─── Quick actions ──────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {[
          { label: "Add money", icon: "M8 3v10M3 8h10" },
          { label: "Transfer", icon: "M3 8h10M10 4l4 4-4 4" },
          { label: "Withdraw", icon: "M3 3h10v10H3zM8 7v4M6 9h4" },
          { label: "More", icon: "M4 6h8M4 10h8" },
        ].map((a) => (
          <button
            key={a.label}
            type="button"
            className="wallet-glass flex flex-col items-center gap-2 rounded-2xl py-4 text-[11px] font-medium transition-all hover:scale-105"
            style={{ color: "var(--wallet-fg)" }}
          >
            <div
              className="flex size-10 items-center justify-center rounded-full"
              style={{ background: "var(--wallet-icon-circle)", color: "var(--wallet-icon-fg)" }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={a.icon} />
              </svg>
            </div>
            {a.label}
          </button>
        ))}
      </div>

      {/* ─── Recent transactions ────────────────────────────────── */}
      <div className="wallet-glass mt-6 overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a78bfa]">
            Latest Transactions
          </p>
          <button type="button" className="text-[12px] font-medium opacity-50 hover:opacity-80 transition-opacity">
            See more
          </button>
        </div>
        <ul style={{ borderColor: "var(--wallet-divider)" }} className="divide-y">
          {DEMO_TXNS.map((t) => (
            <li key={t.id} className="flex items-center gap-4 px-5 py-4">
              <DiceBearAvatar seed={t.avatar} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium opacity-90">{t.reason}</p>
                <p className="mt-0.5 font-mono text-[11px] opacity-40">{t.date}</p>
              </div>
              <p
                className={`shrink-0 font-mono text-[14px] tabular-nums font-medium ${
                  t.dir === "credit" ? "text-[#4cc38a]" : "opacity-70"
                }`}
              >
                {t.dir === "credit" ? "+" : "−"}₹{Math.abs(t.amount / 100).toLocaleString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* ─── Customize section ──────────────────────────────────── */}
      <div id="demo-customize" className="mt-8 scroll-mt-24">
        <p className="mb-4 text-center text-[13px] font-medium opacity-60">
          Create your card — pick a type and your avatar.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Card type picker */}
          <div className="wallet-glass rounded-2xl p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a78bfa]">
              Card type
            </p>
            <div className="space-y-2">
              {CARD_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCardType(c.id)}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all"
                  style={{
                    borderColor: draft.cardType === c.id ? "#7c3aed" : "var(--wallet-input-border)",
                    background: draft.cardType === c.id ? "rgba(124,58,237,0.15)" : "var(--wallet-input-bg)",
                  }}
                >
                  <div className="h-8 w-12 shrink-0 rounded-md" style={{ background: c.gradient }} />
                  <div>
                    <p className="text-[12px] font-medium opacity-90">{c.name}</p>
                    <p className="text-[10px] opacity-50">{c.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Avatar seed picker */}
          <div className="wallet-glass rounded-2xl p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a78bfa]">
              Your avatar
            </p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_SEEDS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => applySeed(seed)}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-medium transition-all"
                  style={{
                    borderColor: draft.avatarSeed === seed && !customSeed ? "#7c3aed" : "var(--wallet-input-border)",
                    background: draft.avatarSeed === seed && !customSeed ? "rgba(124,58,237,0.15)" : "var(--wallet-input-bg)",
                    color: draft.avatarSeed === seed && !customSeed ? "#c4b5fd" : "var(--wallet-fg-muted)",
                  }}
                >
                  <DiceBearAvatar seed={seed} size={24} />
                  {seed}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customSeed}
              onChange={(e) => applySeed(e.target.value)}
              placeholder="Or type your name…"
              className="mt-3 w-full rounded-xl border px-4 py-2.5 text-[12px] focus:border-[#7c3aed] focus:outline-none"
              style={{
                borderColor: "var(--wallet-input-border)",
                background: "var(--wallet-input-bg)",
                color: "var(--wallet-input-text)",
              }}
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login?next=/wallet"
            className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed] px-6 py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#6d28d9] hover:shadow-[0_10px_40px_-10px_rgba(124,58,237,0.5)]"
          >
            Sign in to keep this card
          </Link>
          <p className="mt-3 text-[11px] opacity-40">
            Your card and avatar stay attached to your account across devices.
          </p>
        </div>
      </div>
    </div>
  );
}
