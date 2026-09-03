"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";
import { formatPaise } from "@/lib/money";
import type { HideId } from "@/lib/wallet-leather";
import type { WalletPrefs } from "@/lib/wallet-custom";
import PhysicalWallet from "./PhysicalWallet";
import WalletSkinSelector from "./WalletSkinSelector";

/**
 * The wallet, as the thing the page is about.
 *
 * The balance is deliberately not printed across the leather. A number stamped
 * on the front is what made the old version read as a bank card — objects do
 * not display their contents, and the moment this one did, every other cue
 * (grain, stitching, the notes) was arguing against the one loudest element.
 * So the wallet holds the money and the figure sits under it as a caption,
 * quiet when the wallet is shut and stated plainly once it is open.
 *
 * Choosing a leather saves through the existing prefs route when there is
 * someone to save it for, and is local-only otherwise. The change is applied
 * immediately either way: a save that fails should cost a preference, never the
 * interaction.
 */

export default function WalletSection({
  prefs,
  balancePaise,
  landing = [],
  persist = false,
  actions,
  eyebrow,
  className = "",
}: {
  prefs: WalletPrefs;
  balancePaise: number;
  landing?: number[];
  /** Save the chosen leather against the signed-in customer. */
  persist?: boolean;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [look, setLook] = useState<WalletPrefs>(prefs);
  const [open, setOpen] = useState(false);

  const pickHide = useCallback(
    (hide: HideId) => {
      setLook((l) => ({ ...l, hide }));
      if (!persist) return;
      void fetch("/api/wallet/prefs", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...look, hide }),
      }).catch(() => {
        /* A cosmetic preference is not worth interrupting anyone over. The
           wallet has already changed on screen; the next load will simply show
           the old leather if this never landed. */
      });
    },
    [look, persist],
  );

  return (
    <section className={`mx-auto w-full max-w-lg ${className}`}>
      {eyebrow}

      <PhysicalWallet
        hide={look.hide}
        plate={look.plate}
        thread={look.thread}
        nameplate={look.nameplate}
        balancePaise={balancePaise}
        landing={landing}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        className="mt-2"
      />

      {/* The figure, as a caption to the object rather than a panel of its own */}
      <motion.div
        className="mt-6 text-center"
        animate={{ opacity: open ? 1 : 0.75 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        <p
          className="font-mono text-[10px] uppercase tracking-[0.28em]"
          style={{ color: "var(--wallet-fg-muted)" }}
        >
          Wallet balance
        </p>
        <motion.p
          className="mt-1.5 font-mono text-[clamp(30px,9vw,44px)] font-semibold leading-none tabular-nums"
          style={{ color: "var(--wallet-fg)" }}
          animate={{ y: open ? 0 : 2, letterSpacing: open ? "-0.01em" : "0em" }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          {formatPaise(balancePaise)}
        </motion.p>
        <p className="mx-auto mt-2.5 max-w-[26rem] text-[11.5px] leading-relaxed opacity-40">
          Spendable on LAWFIC filings and government fees.
        </p>
      </motion.div>

      {actions}

      <WalletSkinSelector
        value={look.hide}
        thread={look.thread}
        onChange={pickHide}
        className="mt-9"
      />
    </section>
  );
}
