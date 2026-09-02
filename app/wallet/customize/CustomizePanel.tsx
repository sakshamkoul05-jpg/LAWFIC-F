"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ENTITIES,
  FINISHES,
  AVATAR_SEEDS,
  getEntity,
  normalizePrefs,
  type WalletPrefs,
  type EntityId,
  type FinishId,
} from "@/lib/wallet-custom";
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

  const pickEntity = (id: EntityId) => {
    setStatus("idle");
    setDraft((d) => ({ ...d, entity: id }));
  };

  const pickFinish = (id: FinishId) => {
    setStatus("idle");
    setDraft((d) => ({ ...d, finish: id }));
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

  const normalized = normalizePrefs(draft);
  const dirty =
    normalized?.entity !== initial.entity ||
    normalized?.finish !== initial.finish ||
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
        <p className="mt-6 text-center text-[12px] leading-relaxed opacity-40">
          The pattern is generated from your account and your filings. It is
          yours alone, and it fills in as you use LAWFIC.
        </p>
      </div>

      {/* Controls */}
      <div className="wallet-glass order-1 rounded-2xl p-6 sm:p-8 lg:order-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">
          Customize
        </p>

        {/* Who the card belongs to. This is not a tier — it decides which
            statutory identifier the card carries. */}
        <div className="mt-6">
          <p className="text-[13px] font-medium">You file as</p>
          <p className="mb-3 mt-1 text-[11.5px] leading-relaxed opacity-40">
            Sets the identifier printed on your card — {getEntity(draft.entity)?.idLabel}.
          </p>
          <div className="space-y-2">
            {ENTITIES.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => pickEntity(e.id)}
                aria-pressed={draft.entity === e.id}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200"
                style={{
                  background: draft.entity === e.id ? "var(--wallet-btn-bg-hover)" : "transparent",
                }}
              >
                <span
                  className="grid h-8 w-14 shrink-0 place-items-center rounded-lg font-mono text-[8.5px] tracking-[0.06em]"
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
        </div>

        {/* The one openly cosmetic choice. */}
        <div className="mt-8">
          <p className="mb-3 text-[13px] font-medium">Finish</p>
          <div className="grid grid-cols-2 gap-2">
            {FINISHES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => pickFinish(f.id)}
                aria-pressed={draft.finish === f.id}
                className="rounded-xl p-3 text-left transition-all duration-200"
                style={{
                  background: draft.finish === f.id ? "var(--wallet-btn-bg-hover)" : "transparent",
                  outline:
                    draft.finish === f.id
                      ? "1px solid var(--wallet-icon-fg)"
                      : "1px solid var(--wallet-input-border)",
                }}
              >
                <span className="block text-[12px] font-medium">{f.name}</span>
                <span className="mt-0.5 block text-[10px] leading-snug opacity-40">{f.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Avatar seed picker */}
        <div className="mt-8">
          <p className="mb-3 text-[13px] font-medium">Your avatar</p>
          {/* Faces, not names — see the note in WalletDemo. */}
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
