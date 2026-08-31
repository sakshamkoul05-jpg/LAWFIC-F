"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatPaise } from "@/lib/money";
import {
  FLAIRS,
  MAX_FLAIRS,
  SKINS,
  normalizePrefs,
  type Flair,
  type Skin,
  type WalletPrefs,
} from "@/lib/wallet-custom";
import WalletCard from "@/components/wallet/WalletCard";

/**
 * The customization studio. Pick a material for the card, pin up to MAX_FLAIRS
 * badges, watch the live card respond, then save — the choice is persisted
 * per account through the server.
 */
export default function CustomizePanel({
  initial,
  balancePaise,
}: {
  initial: WalletPrefs;
  balancePaise: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<WalletPrefs>(initial);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const toggleFlair = (f: Flair) => {
    setStatus("idle");
    setDraft((d) => {
      const has = d.flairs.includes(f.id);
      if (has) return { ...d, flairs: d.flairs.filter((id) => id !== f.id) };
      if (d.flairs.length >= MAX_FLAIRS) return d;
      return { ...d, flairs: [...d.flairs, f.id] };
    });
  };

  const pickSkin = (s: Skin) => {
    setStatus("idle");
    setDraft((d) => ({ ...d, skin: s.id }));
  };

  const save = () => {
    setStatus("idle");
    start(async () => {
      const res = await fetch("/api/wallet/prefs", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        setStatus("saved");
        router.refresh();
      } else {
        setStatus("error");
      }
    });
  };

  const dirty = normalizePrefs(draft)?.skin !== initial.skin || draft.flairs.join(",") !== initial.flairs.join(",");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      {/* Live preview */}
      <div className="glass-panel order-2 rounded-3xl p-6 sm:p-8 lg:order-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
          Your card
        </p>
        <div className="mt-8 flex justify-center pb-4">
          <WalletCard prefs={draft} balancePaise={balancePaise} />
        </div>
        <p className="mt-7 text-center text-[12.5px] text-[#f4f4ee]/50">
          {SKINS.find((s) => s.id === draft.skin)?.desc}
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

        {/* Save */}
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="mt-8 w-full rounded-full bg-[#d4af37] py-4 text-sm font-semibold text-[#0b0b0b] transition-all hover:bg-[#e8c86a] hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#f4f4ee]/40 disabled:shadow-none"
        >
          {pending ? "Saving…" : "Save to wallet"}
        </button>

        <AnimatePresence>
          {status === "saved" && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="status"
              className="mt-4 text-center text-[13px] text-[#7fc98e]"
            >
              Saved. Your card is updated across your account.
            </motion.p>
          )}
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="mt-4 text-center text-[13px] text-[#f2665f]"
            >
              Could not save. Try again.
            </motion.p>
          )}
        </AnimatePresence>

        {balancePaise === 0 && (
          <p className="mt-5 text-center text-[12px] text-[#f4f4ee]/40">
            Preview shows a zero balance. Add money first to see it in gilded figures.
          </p>
        )}
      </div>
    </div>
  );
}
