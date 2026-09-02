"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { payFromWallet } from "../actions";

/**
 * No confirm-and-pray. The amount and the balance are both on screen before
 * the button is pressable, and the button says the figure it will take.
 *
 * There is no animation on the press itself — this is the payment decision,
 * and stillness belongs here. The movement happens after, when the paid state
 * settles in.
 */
export default function PayButton({
  orderId,
  amountLabel,
  balancePaise,
  totalPaise,
}: {
  orderId: string;
  amountLabel: string;
  balancePaise: number;
  totalPaise: number;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const short = balancePaise < totalPaise;

  function pay() {
    setError("");
    start(async () => {
      const res = await payFromWallet(orderId);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded border border-success/40 bg-success/10 px-5 py-4"
      >
        <p className="label text-success">Paid</p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          {amountLabel} has been taken from your wallet. We will start work on this now.
        </p>
      </motion.div>
    );
  }

  if (short) {
    return (
      <div className="rounded border border-border-2 bg-surface/50 px-5 py-4">
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          This costs {amountLabel} and your wallet holds less than that.
        </p>
        <Link
          href="/wallet"
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-primary-hover"
        >
          Top up your wallet
        </Link>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={pay}
        disabled={pending}
        className="w-full rounded-full bg-primary py-3.5 text-sm font-medium text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted sm:w-auto sm:px-8"
      >
        {pending ? "Taking payment…" : `Pay ${amountLabel} from wallet`}
      </button>

      {error && <p className="mt-4 text-[13px] leading-relaxed text-destructive">{error}</p>}

      <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
        Paid from your prepaid balance. Government fee and our fee appear as separate lines on
        your statement.
      </p>
    </div>
  );
}
