"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CARD_TYPES, AVATAR_SEEDS, normalizePrefs, type WalletPrefs, type CardTypeId } from "@/lib/wallet-custom";
import WalletCard from "@/components/wallet/WalletCard";
import WalletAvatar from "@/components/wallet/WalletAvatar";

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
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start" style={{ color: "var(--wallet-fg)" }}>
      {/* Live preview */}
      <div className="wallet-glass order-2 rounded-2xl p-6 sm:p-8 lg:order-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
          Your card
        </p>
        <div className="mt-8 flex justify-center pb-4">
          <WalletCard prefs={draft} balancePaise={balancePaise} />
        </div>
        <p className="mt-6 text-center text-[12px] opacity-40">
          {CARD_TYPES.find((c) => c.id === draft.cardType)?.desc}
        </p>
      </div>

      {/* Controls */}
      <div className="wallet-glass order-1 rounded-2xl p-6 sm:p-8 lg:order-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
          Customize
        </p>

        {/* Card type picker */}
        <div className="mt-6">
          <p className="mb-3 text-[13px] font-medium">Card type</p>
          <div className="space-y-2">
            {CARD_TYPES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pickCardType(c.id)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200"
                style={{
                  background: draft.cardType === c.id ? "var(--wallet-btn-bg-hover)" : "transparent",
                }}
              >
                <div className="h-8 w-12 shrink-0 rounded-lg" style={{ background: c.gradient }} />
                <div>
                  <p className="text-[12px] font-medium">{c.name}</p>
                  <p className="text-[10px] opacity-40">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Avatar seed picker */}
        <div className="mt-8">
          <p className="mb-3 text-[13px] font-medium">Your avatar</p>
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
                <WalletAvatar seed={seed} size={20} />
                {seed}
              </button>
            ))}
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

        {/* Save */}
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="mt-8 w-full rounded-full bg-primary py-3.5 text-[13px] font-medium text-background transition-all duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-30"
        >
          {pending ? "Saving…" : "Save to wallet"}
        </button>

        <AnimatePresence>
          {status === "saved" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="status"
              className="mt-3 text-center text-[12px] text-success"
            >
              Saved.
            </motion.p>
          )}
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="mt-3 text-center text-[12px] text-[#ff3b30]"
            >
              Could not save.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
