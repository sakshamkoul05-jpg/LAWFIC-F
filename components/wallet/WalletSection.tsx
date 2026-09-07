"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useState } from "react";
import { formatPaise } from "@/lib/money";
import type { WalletPrefs } from "@/lib/wallet-custom";
import { EMBOSS, FINISHES, THREADS, getColor, getFinish } from "@/lib/wallet3d/finishes";
import { breakIntoNotes, getNoteStyle, NOTE_STYLES } from "@/lib/wallet3d/banknote";
import { useWalletConfig } from "./useWalletConfig";
import WalletStage from "@/components/wallet3d/WalletStage";
import PhysicalWallet from "./PhysicalWallet";

/**
 * The wallet page: one object, quietly presented.
 *
 * Everything that was a dashboard is gone. No panels, no bordered cards, no
 * balance label the size of a headline. There is the wallet, the figure under
 * it, two actions, and a configurator that stays out of the way until asked
 * for. The object is the page.
 *
 * WHERE THE CONFIG LIVES, AND WHY IT IS NOT IN THE DATABASE YET
 *
 * `wallet_prefs` stores hide, plate, thread and nameplate, which described the
 * bifold. The product is now a card holder configured by FINISH plus a colour
 * within that finish, and those columns do not fit. Rather than write a
 * migration in the same change that redesigns the object — and be stuck with
 * whichever schema this week's design implies — the configuration is held
 * locally and the engraving continues to come from the stored nameplate, which
 * is the one field that still means what it always did.
 *
 * That is a deliberate staging, not an oversight: the shape settles first, the
 * schema follows. `wallet_config` is a migration to write once the finishes
 * stop moving.
 */

export default function WalletSection({
  prefs,
  balancePaise,
  actions,
  eyebrow,
  arriving,
  className = "",
}: {
  prefs: WalletPrefs;
  balancePaise: number;
  landing?: number[];
  persist?: boolean;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  /** Change this to replay the notes' fly-in. */
  arriving?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { config, update } = useWalletConfig(prefs.nameplate);
  const [open, setOpen] = useState(false);
  const [studio, setStudio] = useState(false);

  const finish = getFinish(config.finish);
  const color = getColor(finish, config.color);

  return (
    <section className={`mx-auto w-full max-w-[1180px] px-4 sm:px-6 ${className}`}>
      {eyebrow}

      {/* THE OBJECT */}
      <div className="relative mx-auto w-full max-w-[720px]">
        <WalletStage
          config={config}
          open={open ? 1 : 0}
          arriving={arriving}
          onTap={() => setOpen((o) => !o)}
          notes={breakIntoNotes(balancePaise)}
          fallback={
            <PhysicalWallet
              hide={prefs.hide}
              plate={prefs.plate}
              thread={prefs.thread}
              nameplate={prefs.nameplate}
              balancePaise={balancePaise}
              open={open}
              onToggle={() => setOpen((o) => !o)}
            />
          }
        />
      </div>

      {/* THE FIGURE. Small label, large number, in that order of loudness —
          the opposite of a dashboard, where the label shouts and the number
          sits in a box. */}
      <div className="mt-2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--wallet-fg-muted)]">
          Available balance
        </p>
        <p className="mt-2 font-mono text-[clamp(38px,7vw,60px)] font-semibold leading-none tabular-nums text-[color:var(--wallet-fg)]">
          {formatPaise(balancePaise)}
        </p>
        <p className="mt-3 text-[12px] text-[color:var(--wallet-fg-muted)]">
          {finish.name} · {color.name} · {getNoteStyle(config.notes).name} notes
          {config.engraving ? ` · ${config.engraving.toUpperCase()}` : ""}
        </p>
      </div>

      {/* ACTIONS. Two, and a third that only changes how it looks. */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        {actions}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-full border border-border px-5 py-2.5 text-[13px] text-foreground transition-colors hover:border-border-3"
        >
          {open ? "Close wallet" : "Open wallet"}
        </button>
        <button
          type="button"
          onClick={() => setStudio((s) => !s)}
          aria-expanded={studio}
          className="rounded-full border border-border px-5 py-2.5 text-[13px] text-foreground transition-colors hover:border-border-3"
        >
          {studio ? "Done" : "Customise"}
        </button>
      </div>

      {/* THE STUDIO. Slides in under the object, which stays where it is —
          a configurator that moves the thing being configured is a configurator
          you cannot judge. */}
      <AnimatePresence initial={false}>
        {studio && (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="mx-auto mt-10 max-w-[640px] space-y-8 pb-4">
              <Row label="Material">
                {FINISHES.map((f) => (
                  <Chip
                    key={f.id}
                    on={config.finish === f.id}
                    onClick={() => update({ finish: f.id })}
                    title={f.blurb}
                  >
                    {f.name}
                  </Chip>
                ))}
              </Row>

              <Row label="Colour">
                {finish.colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => update({ color: c.id })}
                    aria-label={c.name}
                    aria-pressed={config.color === c.id}
                    title={c.name}
                    className="size-9 rounded-full transition-transform hover:scale-105"
                    style={{
                      background: c.hex,
                      boxShadow:
                        config.color === c.id
                          ? "0 0 0 2px var(--wallet-icon-fg), inset 0 0 0 1px rgba(255,255,255,0.14)"
                          : "inset 0 0 0 1px rgba(255,255,255,0.14)",
                    }}
                  />
                ))}
              </Row>

              {/* A leather bifold has no hardware on its face. It has a
                  stamp, and the real choice a maker offers is whether that
                  stamp is blind or foiled. */}
              <Row label="Embossing">
                {EMBOSS.map((e) => (
                  <Chip
                    key={e.id}
                    on={config.emboss === e.id}
                    onClick={() => update({ emboss: e.id })}
                  >
                    <span
                      className="inline-block size-3 rounded-full align-middle"
                      style={{
                        background: e.hex ?? "transparent",
                        boxShadow: e.hex ? "none" : "inset 0 0 0 1px currentColor",
                      }}
                    />
                    <span className="ml-2 align-middle">{e.name}</span>
                  </Chip>
                ))}
              </Row>

              <Row label="Stitching">
                {THREADS.map((t) => (
                  <Chip
                    key={t.id}
                    on={config.thread === t.id}
                    onClick={() => update({ thread: t.id })}
                  >
                    {t.name}
                  </Chip>
                ))}
              </Row>

              {/* THE NOTES. A style changes how the series is PRINTED, never
                  what is printed — the layout and the engraving stay the
                  approved artwork in all six. */}
              <Row label="Notes">
                {NOTE_STYLES.map((n) => (
                  <Chip
                    key={n.id}
                    on={config.notes === n.id}
                    onClick={() => update({ notes: n.id })}
                    title={n.blurb}
                  >
                    {n.name}
                  </Chip>
                ))}
              </Row>

              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--wallet-fg-muted)]">
                  Engraving
                </p>
                <input
                  value={config.engraving}
                  onChange={(e) =>
                    /* Cut into metal at a couple of millimetres a letter, so
                       anything longer than this stops being legible on the
                       object it is cut into. */
                    update({ engraving: e.target.value.replace(/[^\p{L}\p{N} .&'-]/gu, "").slice(0, 16) })
                  }
                  placeholder="Your name"
                  aria-label="Engraving"
                  className="w-full rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-[14px] uppercase tracking-[0.14em] text-foreground outline-none focus:border-primary/50"
                />
                <p className="mt-2 text-[11.5px] text-[color:var(--wallet-fg-muted)]">
                  Cut into the face, low right. Leave it empty for the LAWFIC mark.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--wallet-fg-muted)]">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  title,
  children,
}: {
  on: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={title}
      className="rounded-full px-4 py-2 text-[12.5px] transition-colors"
      style={{
        background: on ? "var(--wallet-btn-bg)" : "transparent",
        boxShadow: on
          ? "inset 0 0 0 1px var(--wallet-icon-fg)"
          : "inset 0 0 0 1px var(--wallet-input-border)",
        color: on ? "var(--wallet-fg)" : "var(--wallet-fg-muted)",
        fontWeight: on ? 500 : 400,
      }}
    >
      {children}
    </button>
  );
}
