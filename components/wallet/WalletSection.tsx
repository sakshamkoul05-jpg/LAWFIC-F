"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";
import { formatPaise } from "@/lib/money";
import type { HideId } from "@/lib/wallet-leather";
import type { WalletPrefs } from "@/lib/wallet-custom";
import PhysicalWallet from "./PhysicalWallet";
import WalletSkinSelector from "./WalletSkinSelector";

/**
 * The wallet section, composed as a product shot rather than a dashboard.
 *
 * WHAT WAS WRONG WITH THE OLD ARRANGEMENT
 *
 * It was `max-w-lg` — 512 pixels — with the wallet inside it, so however the
 * wallet was built it could never be more than a few hundred pixels across, and
 * it read as an icon floating in a field of black. Everything under it was a
 * separate centred block with generous margins, which is the layout of a
 * settings page. The object was the smallest thing on screen and the furthest
 * from the eye's first landing point.
 *
 * Now the wallet is the widest element on the page and everything else is
 * arranged around it: the name and the figure sit beside it on a wide screen
 * and above it on a narrow one, close enough to read as captions to the object
 * rather than as their own panels. The leather runs underneath as a single
 * strip. Nothing is centred in its own column of empty space.
 *
 * The balance is deliberately not printed on the leather. A wallet does not
 * display its own contents, and the moment this one did, every other cue was
 * arguing against the loudest element on the object.
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
           wallet has already changed on screen; the next load will show the old
           leather if this never landed. */
      });
    },
    [look, persist],
  );

  return (
    <section className={`mx-auto w-full max-w-[1320px] ${className}`}>
      {/* Beside the wallet on a wide screen, above it on a narrow one. The
          figure is a caption to the object, so it stays near it either way. */}
      <div className="grid items-center gap-x-10 gap-y-4 lg:grid-cols-[minmax(210px,265px)_1fr]">
        <div className="order-1 text-center lg:text-left">
          {eyebrow}

          <motion.div
            className="mt-5"
            animate={{ opacity: open ? 1 : 0.82 }}
            transition={{ duration: reduced ? 0 : 0.4 }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-[0.28em]"
              style={{ color: "var(--wallet-fg-muted)" }}
            >
              Wallet balance
            </p>
            <p
              className="mt-2 font-mono text-[clamp(34px,5.4vw,52px)] font-semibold leading-none tabular-nums"
              style={{ color: "var(--wallet-fg)" }}
            >
              {formatPaise(balancePaise)}
            </p>
            <p className="mx-auto mt-3 max-w-[22rem] text-[12px] leading-relaxed opacity-45 lg:mx-0">
              Available for LAWFIC filings and government fees.
            </p>
          </motion.div>

          {actions}
        </div>

        {/* The object. Widest thing on the page, and first in the eye's path on
            a wide screen despite coming second in the source — reading order
            keeps the heading first for anyone who is not looking. */}
        <div className="order-2 min-w-0">
          <PhysicalWallet
            hide={look.hide}
            plate={look.plate}
            thread={look.thread}
            nameplate={look.nameplate}
            balancePaise={balancePaise}
            landing={landing}
            open={open}
            onToggle={() => setOpen((o) => !o)}
          />
          <motion.p
            className="-mt-1 text-center font-mono text-[10px] uppercase tracking-[0.24em]"
            style={{ color: "var(--wallet-fg-muted)" }}
            animate={{ opacity: open ? 0 : 0.5 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
            aria-hidden
          >
            Click the wallet to open
          </motion.p>
        </div>
      </div>

      <WalletSkinSelector
        value={look.hide}
        thread={look.thread}
        onChange={pickHide}
        className="mt-8"
      />
    </section>
  );
}
