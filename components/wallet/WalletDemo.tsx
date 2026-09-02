"use client";

import Link from "next/link";
import { useState } from "react";
import { ENTITIES, FINISHES, AVATAR_SEEDS, DEFAULT_PREFS, type WalletPrefs, type EntityId, type FinishId } from "@/lib/wallet-custom";
import WalletCard from "@/components/wallet/WalletCard";
import WalletPocket from "@/components/wallet/WalletPocket";
import WalletAvatar from "@/components/wallet/WalletAvatar";
import WalletOnboarding from "@/components/wallet/WalletOnboarding";
import WalletActions from "@/components/wallet/WalletActions";
import WalletMenu from "@/components/wallet/WalletMenu";

const DEMO_BALANCE_PAISE = 2435000;

/* A sample filing history, so the signed-out preview shows what a card looks
   like once it has been used. A real card starts almost bare and accrues. */
const DEMO_SPEND = { tax: 149900, identity: 10700, business: 99900, licence: 45000 };

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
  const [draft, setDraft] = useState<WalletPrefs>(DEFAULT_PREFS);
  const [customSeed, setCustomSeed] = useState("");

  const applySeed = (seed: string) => {
    setCustomSeed(seed);
    setDraft((d) => ({ ...d, avatarSeed: seed }));
  };

  const pickEntity = (id: EntityId) => {
    setDraft((d) => ({ ...d, entity: id }));
  };

  const pickFinish = (id: FinishId) => {
    setDraft((d) => ({ ...d, finish: id }));
  };

  return (
    <div className="mx-auto max-w-lg" style={{ color: "var(--wallet-fg)" }}>
      <WalletOnboarding />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[13px]" style={{ color: "var(--wallet-fg-muted)" }}>Welcome to</p>
          <h1 className="text-[20px] font-semibold tracking-tight">LAWFiC Wallet</h1>
        </div>
        <WalletAvatar seed={draft.avatarSeed} size={40} />
      </div>

      {/* Card in pocket */}
      <WalletPocket>
        <WalletCard
          prefs={draft}
          balancePaise={DEMO_BALANCE_PAISE}
          accountId="lawfic-preview"
          spend={DEMO_SPEND}
          animateBalance
        />
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

      {/* Customize section */}
      <div id="demo-customize" className="mt-10 scroll-mt-24">
        <p className="mb-5 text-center text-[13px] opacity-45">
          Create your card — pick a type and your avatar.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Who you file as — decides the identifier on the card, not a tier */}
          <div className="wallet-glass rounded-2xl p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
              You file as
            </p>
            <div className="space-y-2">
              {ENTITIES.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => pickEntity(e.id)}
                  aria-pressed={draft.entity === e.id}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all duration-200"
                  style={{
                    background: draft.entity === e.id ? "var(--wallet-btn-bg-hover)" : "transparent",
                  }}
                >
                  <span
                    className="grid h-7 w-12 shrink-0 place-items-center rounded-lg font-mono text-[8px] tracking-[0.06em]"
                    style={{
                      background: "var(--wallet-btn-bg)",
                      color: draft.entity === e.id ? "var(--wallet-icon-fg)" : "var(--wallet-fg-muted)",
                    }}
                  >
                    {e.idLabel}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-medium">{e.name}</span>
                    <span className="block text-[10px] opacity-40">{e.desc}</span>
                  </span>
                </button>
              ))}
            </div>

            <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
              Finish
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => pickFinish(f.id)}
                  aria-pressed={draft.finish === f.id}
                  className="rounded-xl p-2.5 text-left text-[12px] font-medium transition-all duration-200"
                  style={{
                    background: draft.finish === f.id ? "var(--wallet-btn-bg-hover)" : "transparent",
                    outline:
                      draft.finish === f.id
                        ? "1px solid var(--wallet-icon-fg)"
                        : "1px solid var(--wallet-input-border)",
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar seed picker */}
          <div className="wallet-glass rounded-2xl p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
              Your avatar
            </p>
            {/* A grid of faces, not a list of names. The seeds are internal
                keys — showing "Felix" next to a 20px thumbnail asked people to
                pick a word when what they are choosing is a face. */}
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
                    <WalletAvatar seed={seed} size={44} />
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

        <div className="mt-8 text-center">
          <Link
            href="/login?next=/wallet"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-[13px] font-medium text-white transition-all duration-200 hover:bg-primary-hover"
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
