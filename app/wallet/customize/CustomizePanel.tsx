"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CARD_TYPES, AVATAR_SEEDS, normalizePrefs, type WalletPrefs, type CardTypeId } from "@/lib/wallet-custom";
import WalletCard from "@/components/wallet/WalletCard";
import DiceBearAvatar from "@/components/wallet/DiceBearAvatar";

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
  const [customSeed, setCustomSeed] = useState(
    AVATAR_SEEDS.includes(initial.avatarSeed) ? "" : initial.avatarSeed
  );

  const pickCardType = (id: CardTypeId) => {
    setStatus("idle");
    setDraft((d) => ({ ...d, cardType: id }));
  };

  const applySeed = (seed: string) => {
    setCustomSeed(seed);
    setStatus("idle");
    setDraft((d) => ({ ...d, avatarSeed: seed }));
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
    normalizePrefs(draft)?.cardType !== initial.cardType ||
    draft.avatarSeed !== initial.avatarSeed;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start" style={{ color: "var(--wallet-fg)" }}>
      {/* Live preview */}
      <div className="wallet-glass order-2 rounded-3xl p-6 sm:p-8 lg:order-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a78bfa]">
          Your card
        </p>
        <div className="mt-8 flex justify-center pb-4">
          <WalletCard prefs={draft} balancePaise={balancePaise} />
        </div>
        <p className="mt-7 text-center text-[12.5px] opacity-50">
          {CARD_TYPES.find((c) => c.id === draft.cardType)?.desc}
        </p>
      </div>

      {/* Controls */}
      <div className="wallet-glass order-1 rounded-3xl p-6 sm:p-8 lg:order-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a78bfa]">
          Customize
        </p>

        {/* Card type picker */}
        <div className="mt-6">
          <p className="mb-3 text-[13px] font-medium opacity-90">Card type</p>
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
        <div className="mt-8">
          <p className="mb-3 text-[13px] font-medium opacity-90">Your avatar</p>
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

        {/* Save */}
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="mt-8 w-full rounded-full bg-[#7c3aed] py-4 text-sm font-semibold text-white transition-all hover:bg-[#6d28d9] hover:shadow-[0_10px_40px_-10px_rgba(124,58,237,0.5)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
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
      </div>
    </div>
  );
}
