"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SKINS, normalizePrefs, type Skin, type WalletPrefs } from "@/lib/wallet-custom";
import { DEFAULT_AVATAR, type AvatarPrefs } from "@/lib/wallet-avatar";
import WalletCard from "@/components/wallet/WalletCard";
import AvatarPicker from "@/components/wallet/AvatarPicker";

/**
 * The customization studio. Create your avatar, pick a material for the card,
 * watch the live card respond, then save — the choice is persisted per account
 * through the server.
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

  const updateAvatar = (a: AvatarPrefs) => {
    setStatus("idle");
    setDraft((d) => ({ ...d, avatar: a }));
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

  const dirty =
    normalizePrefs(draft)?.skin !== initial.skin ||
    draft.avatar.skinTone !== initial.avatar.skinTone ||
    draft.avatar.hairStyle !== initial.avatar.hairStyle ||
    draft.avatar.hairColor !== initial.avatar.hairColor ||
    draft.avatar.eyeStyle !== initial.avatar.eyeStyle ||
    draft.avatar.mouthStyle !== initial.avatar.mouthStyle ||
    draft.avatar.clothes !== initial.avatar.clothes ||
    draft.avatar.accessory !== initial.avatar.accessory;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      {/* Live preview */}
      <div className="wallet-glass order-2 rounded-3xl p-6 sm:p-8 lg:order-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
          Your card
        </p>
        <div className="mt-8 flex justify-center pb-4">
          <WalletCard prefs={draft} balancePaise={balancePaise} />
        </div>
        <p className="mt-7 text-center text-[12.5px] opacity-50">
          {SKINS.find((s) => s.id === draft.skin)?.desc}
        </p>
      </div>

      {/* Controls */}
      <div className="wallet-glass order-1 rounded-3xl p-6 sm:p-8 lg:order-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
          Customize
        </p>

        {/* Avatar picker */}
        <div className="mt-6">
          <AvatarPicker avatar={draft.avatar} onChange={updateAvatar} />
        </div>

        {/* Skin picker */}
        <div className="mt-8">
          <p className="mb-3 text-[13px] font-medium opacity-90">Card material</p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
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
              className="mt-4 text-center text-[13px] text-[#4cc38a]"
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
              className="mt-4 text-center text-[13px] text-[#f2635f]"
            >
              Could not save. Try again.
            </motion.p>
          )}
        </AnimatePresence>

        {balancePaise === 0 && (
          <p className="mt-5 text-center text-[12px] opacity-40">
            Preview shows a zero balance. Add money first to see it in gilded figures.
          </p>
        )}
      </div>
    </div>
  );
}
