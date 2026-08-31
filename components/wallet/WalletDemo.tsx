"use client";

import Link from "next/link";
import { useState } from "react";
import { FLAIRS, MAX_FLAIRS, SKINS, type Flair, type Skin, type WalletPrefs } from "@/lib/wallet-custom";
import WalletCard from "@/components/wallet/WalletCard";

const DEMO_BALANCE_PAISE = 2435000; // ₹24,350

const DEMO_TXNS = [
  { id: "d1", reason: "Legal consultation — SME advisory", date: "28 Aug 2026", amount: -250000, dir: "debit" as const },
  { id: "d2", reason: "Wallet top-up via UPI", date: "25 Aug 2026", amount: 500000, dir: "credit" as const },
  { id: "d3", reason: "Court filing fee — Delhi HC", date: "20 Aug 2026", amount: -15000, dir: "debit" as const },
];

export default function WalletDemo() {
  const [draft, setDraft] = useState<WalletPrefs>({ skin: "gilded", flairs: [] });

  const toggleFlair = (f: Flair) => {
    setDraft((d) => {
      const has = d.flairs.includes(f.id);
      if (has) return { ...d, flairs: d.flairs.filter((id) => id !== f.id) };
      if (d.flairs.length >= MAX_FLAIRS) return d;
      return { ...d, flairs: [...d.flairs, f.id] };
    });
  };

  const pickSkin = (s: Skin) => setDraft((d) => ({ ...d, skin: s.id }));

  return (
    <div className="mx-auto max-w-xl">
      {/* Pocket / cardholder */}
      <div className="wallet-pocket p-4 sm:p-5">
        <WalletCard prefs={draft} balancePaise={DEMO_BALANCE_PAISE} animateBalance />

        {/* Quick actions inside the pocket */}
        <div className="mt-5 flex items-center gap-3">
          <Link
            href="/login?next=/wallet"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #d4af37, #c79b2c)",
              color: "#0b0b0b",
              boxShadow: "0 4px 16px -4px rgba(212,175,55,0.4)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Sign in to add money
          </Link>
          <button
            type="button"
            onClick={() => document.getElementById("demo-customize")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center justify-center rounded-2xl border px-4 py-3.5 text-[13px] font-medium transition-colors"
            style={{ borderColor: "var(--wallet-pocket-border)", color: "var(--wallet-scene-fg)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.5 1.5l2 2-9 9H3.5v-2l9-9z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-5 flex gap-3">
        <Link
          href="/login?next=/wallet"
          className="wallet-glass flex flex-1 items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-white/10"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-[#d4af37]/15 text-[#d4af37]">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium opacity-90">Top up</p>
            <p className="text-[11px] opacity-50">Add funds to your wallet</p>
          </div>
        </Link>
        <div
          className="wallet-glass flex flex-1 items-center gap-3 rounded-2xl p-4"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-[#d4af37]/15 text-[#d4af37]">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h10M3 8h7M3 13h4" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium opacity-90">Statement · 3</p>
            <p className="text-[11px] opacity-50">See all transactions</p>
          </div>
        </div>
      </div>

      {/* Sample recent activity */}
      <div className="wallet-glass mt-5 overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">
            Recent activity
          </p>
        </div>
        <ul className="divide-y" style={{ borderColor: "var(--wallet-pocket-border)" }}>
          {DEMO_TXNS.map((t) => (
            <li key={t.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex size-10 items-center justify-center rounded-full" style={{ background: "var(--wallet-pocket-bg)" }}>
                <span className="text-[13px] font-semibold opacity-70">
                  {t.dir === "credit" ? "+" : "−"}
                </span>
              </div>
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
        <p className="border-t px-5 py-3.5 text-[11px] leading-relaxed opacity-35" style={{ borderColor: "var(--wallet-pocket-border)" }}>
          This is a demo — sample transactions shown. Sign in to see your real wallet.
        </p>
      </div>

      {/* Customize section */}
      <div id="demo-customize" className="mt-8 scroll-mt-24">
        <p className="mb-4 text-center text-[13px] font-medium opacity-60">
          Pick a material and pin a few badges to make the card yours.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Skin picker */}
          <div className="wallet-glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">Material</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {SKINS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickSkin(s)}
                  aria-pressed={draft.skin === s.id}
                  title={s.name}
                  className={`aspect-[1.586] overflow-hidden rounded-xl border-2 transition-all ${
                    draft.skin === s.id
                      ? "border-[#d4af37] ring-1 ring-[#d4af37]/50"
                      : "border-white/10 hover:border-[#d4af37]/40"
                  }`}
                  style={{ background: s.bg }}
                >
                  <span className="sr-only">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Flair picker */}
          <div className="wallet-glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">Badges</p>
              <span className="font-mono text-[11px] opacity-40">{draft.flairs.length}/{MAX_FLAIRS}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {FLAIRS.map((f) => {
                const on = draft.flairs.includes(f.id);
                const full = draft.flairs.length >= MAX_FLAIRS && !on;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFlair(f)}
                    disabled={full}
                    aria-pressed={on}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all ${
                      on
                        ? "border-[#d4af37] bg-[#d4af37]/15"
                        : "border-white/10 bg-white/5 hover:border-[#d4af37]/40"
                    } ${full ? "opacity-40" : ""}`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${on ? "bg-[#d4af37] text-[#17140c]" : "bg-white/10 opacity-60"}`}>
                      <span className="h-4 w-4">{f.glyph}</span>
                    </span>
                    <span className={`text-[10px] leading-tight ${on ? "text-[#f4e3a8]" : "opacity-50"}`}>
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login?next=/wallet"
            className="inline-flex items-center gap-2 rounded-full bg-[#d4af37] px-6 py-3 text-[13px] font-semibold text-[#0b0b0b] transition-all hover:bg-[#e8c86a] hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)]"
          >
            Sign in to keep this card
          </Link>
          <p className="mt-3 text-[11px] opacity-40">
            Your material and badges stay attached to your account across devices.
          </p>
        </div>
      </div>
    </div>
  );
}
