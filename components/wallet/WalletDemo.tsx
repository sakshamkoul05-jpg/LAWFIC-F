"use client";

import Link from "next/link";
import { useState } from "react";
import { FLAIRS, MAX_FLAIRS, SKINS, type Flair, type Skin, type WalletPrefs } from "@/lib/wallet-custom";
import WalletCard from "@/components/wallet/WalletCard";

/** A sample balance shown to signed-out visitors so the card feels alive. */
const DEMO_BALANCE_PAISE = 2435000; // ₹24,350

/**
 * The wallet demo for guests — no account needed.
 *
 * It is a fully interactive slice of the real thing: the same collector card,
 * the same materials and badges, all working instantly. Nothing here is saved —
 * a guest has no account yet — so a prominent call-to-action invites them to
 * sign in and keep the card they just made. That boundary (demo data, local
 * only) is deliberate: real balances and persisted prefs live behind RLS.
 */
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
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      {/* Live preview */}
      <div className="glass-panel order-2 rounded-3xl p-6 sm:p-8 lg:order-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
          Try it — no sign-in
        </p>
        <div className="mt-8 flex justify-center pb-4">
          <WalletCard prefs={draft} balancePaise={DEMO_BALANCE_PAISE} animateBalance />
        </div>
        <p className="mt-7 text-center text-[12.5px] text-[#f4f4ee]/50">
          {SKINS.find((s) => s.id === draft.skin)?.desc} This is a demo balance — it is not real
          money.
        </p>
      </div>

      {/* Controls */}
      <div className="glass-panel order-1 rounded-3xl p-6 sm:p-8 lg:order-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
          Customize
        </p>

        {/* Skins */}
        <p className="mt-7 text-[13px] font-medium text-[#f4f4ee]">Material</p>
        <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {SKINS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pickSkin(s)}
              aria-pressed={draft.skin === s.id}
              title={s.name}
              className={`group aspect-[1.586] overflow-hidden rounded-xl border-2 transition-all ${
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

        {/* Flairs */}
        <p className="mt-7 flex items-center justify-between text-[13px] font-medium text-[#f4f4ee]">
          <span>Badges</span>
          <span className="font-mono text-[11px] text-[#f4f4ee]/45">
            {draft.flairs.length}/{MAX_FLAIRS}
          </span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
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
                className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-all ${
                  on
                    ? "border-[#d4af37] bg-[#d4af37]/15"
                    : "border-white/10 bg-white/5 hover:border-[#d4af37]/40"
                } ${full ? "opacity-40" : ""}`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${on ? "bg-[#d4af37] text-[#17140c]" : "bg-white/10 text-[#f4f4ee]/60"}`}>
                  <span className="h-5 w-5">{f.glyph}</span>
                </span>
                <span className={`text-[11px] leading-tight ${on ? "text-[#f4e3a8]" : "text-[#f4f4ee]/55"}`}>
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <Link
          href="/login?next=/wallet"
          className="mt-8 flex w-full items-center justify-center rounded-full bg-[#d4af37] py-4 text-sm font-semibold text-[#0b0b0b] transition-all hover:bg-[#e8c86a] hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)]"
        >
          Sign in to keep this card
        </Link>
        <p className="mt-4 text-center text-[12px] text-[#f4f4ee]/40">
          Your material and badges stay attached to your account — so your card looks the same on
          every device.
        </p>
      </div>
    </div>
  );
}
