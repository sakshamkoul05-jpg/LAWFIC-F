"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  HIDES,
  PLATES,
  THREADS,
  AVATAR_SEEDS,
  NAMEPLATE_MAX,
  normalizeNameplate,
  normalizePrefs,
  type WalletPrefs,
  type HideId,
  type PlateId,
  type ThreadId,
} from "@/lib/wallet-custom";
import PhysicalWallet from "@/components/wallet/PhysicalWallet";
import WalletAvatar from "@/components/wallet/WalletAvatar";

/**
 * Choosing your wallet.
 *
 * Everything here is visible on the wallet beside it as you pick, because the
 * whole appeal of this is watching the object change. Four choices — hide,
 * nameplate, stitching, avatar — each small enough to make without thinking
 * hard about it.
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
  const [customSeed, setCustomSeed] = useState(
    AVATAR_SEEDS.includes(initial.avatarSeed) ? "" : initial.avatarSeed,
  );

  const patch = (next: Partial<WalletPrefs>) => {
    setStatus("idle");
    setDraft((d) => ({ ...d, ...next }));
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
    normalized?.hide !== initial.hide ||
    normalized?.plate !== initial.plate ||
    normalized?.thread !== initial.thread ||
    normalized?.nameplate !== initial.nameplate ||
    draft.avatarSeed !== initial.avatarSeed;

  const label = "type-label block text-muted";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
      {/* Live wallet */}
      <div className="order-2 lg:order-1 lg:sticky lg:top-24">
        <p className="type-label text-primary">Your wallet</p>
        <div className="mt-6 flex justify-center">
          <PhysicalWallet
            hide={draft.hide}
            plate={draft.plate}
            thread={draft.thread}
            nameplate={draft.nameplate}
            balancePaise={balancePaise}
          />
        </div>
        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-muted">
          {HIDES.find((h) => h.id === draft.hide)?.desc}
        </p>
      </div>

      {/* Choices */}
      <div className="order-1 space-y-9 lg:order-2">
        <div>
          <p className={label}>Leather</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {HIDES.map((h) => {
              const on = draft.hide === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => patch({ hide: h.id as HideId })}
                  aria-pressed={on}
                  className="overflow-hidden rounded-xl border text-left transition-transform hover:-translate-y-0.5"
                  style={{ borderColor: on ? "var(--color-primary)" : "var(--border-2)" }}
                >
                  <span
                    className="block h-14 w-full"
                    style={{
                      background: `linear-gradient(150deg, ${h.outer[0]}, ${h.outer[1]} 55%, ${h.outer[2]})`,
                    }}
                  />
                  <span className="block px-2.5 py-2 text-[12px] font-medium text-foreground">
                    {h.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="nameplate" className={label}>
            Stamped on the plate
          </label>
          <p className="mt-1 text-[12px] text-subtle">
            Your name, or your firm&apos;s. {NAMEPLATE_MAX} characters — a plate is small.
          </p>
          <input
            id="nameplate"
            value={draft.nameplate}
            onChange={(e) => patch({ nameplate: normalizeNameplate(e.target.value) })}
            placeholder="LAWFIC"
            maxLength={NAMEPLATE_MAX}
            className="mt-2.5 w-full rounded-lg border border-border-2 bg-background/60 px-3.5 py-2.5 font-mono text-[14px] uppercase tracking-[0.12em] text-foreground outline-none placeholder:text-subtle focus:border-primary/50"
          />

          <p className={`${label} mt-5`}>Plate metal</p>
          <div className="mt-2.5 grid grid-cols-3 gap-2.5">
            {PLATES.map((p) => {
              const on = draft.plate === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => patch({ plate: p.id as PlateId })}
                  aria-pressed={on}
                  className="overflow-hidden rounded-lg border transition-transform hover:-translate-y-0.5"
                  style={{ borderColor: on ? "var(--color-primary)" : "var(--border-2)" }}
                >
                  <span
                    className="block h-8 w-full"
                    style={{
                      background: `linear-gradient(135deg, ${p.face[0]}, ${p.face[1]} 48%, ${p.face[2]})`,
                    }}
                  />
                  <span className="block py-1.5 text-[11.5px] text-foreground">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className={label}>Stitching</p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
            {THREADS.map((t) => {
              const on = draft.thread === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => patch({ thread: t.id as ThreadId })}
                  aria-pressed={on}
                  className="rounded-lg border p-3 text-left transition-colors"
                  style={{
                    borderColor: on ? "var(--color-primary)" : "var(--border-2)",
                    background: on ? "var(--color-primary-light)" : "transparent",
                  }}
                >
                  <span className="block text-[12.5px] font-medium text-foreground">{t.name}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className={label}>Your avatar</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {AVATAR_SEEDS.map((seed) => {
              const on = draft.avatarSeed === seed && !customSeed;
              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => {
                    setCustomSeed("");
                    patch({ avatarSeed: seed });
                  }}
                  aria-label={`Choose avatar ${seed}`}
                  aria-pressed={on}
                  className="rounded-full transition-transform duration-200 hover:scale-105"
                  style={{
                    outline: on ? "2px solid var(--color-primary)" : "2px solid transparent",
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
            onChange={(e) => {
              setCustomSeed(e.target.value);
              patch({ avatarSeed: e.target.value || "Felix" });
            }}
            placeholder="Or type a name for your own"
            className="mt-3 w-full rounded-lg border border-border-2 bg-background/60 px-3.5 py-2.5 text-[13px] text-foreground outline-none placeholder:text-subtle focus:border-primary/50"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="w-full rounded-full bg-primary py-3.5 text-[13.5px] font-medium text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted"
          >
            {pending ? "Saving…" : "Save my wallet"}
          </button>

          <AnimatePresence>
            {status === "saved" && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="status"
                className="mt-3 text-center text-[12.5px] text-success"
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
                className="mt-3 text-center text-[12.5px] text-destructive"
              >
                Could not save that. Try again.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
