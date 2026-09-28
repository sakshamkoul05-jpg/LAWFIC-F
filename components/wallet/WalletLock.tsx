"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Fingerprint, Loader2, ScanFace, ShieldCheck } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";

/**
 * The wallet, locked.
 *
 * WHAT IS BEHIND THIS SCREEN
 *
 * Nothing that matters, which is the point. The page did not fetch the balance
 * or the statement before rendering this — a lock that hides data the browser
 * already has is a lock that anyone can open with the developer tools. The
 * figures are fetched only after the server has verified a signature.
 *
 * WHY IT DOES NOT UNLOCK BY ITSELF ON LOAD
 *
 * It would be one line, and it would train people to approve a Face ID prompt
 * they did not ask for. A biometric prompt should always be the answer to
 * something the person just did — that is what makes an unexpected one
 * suspicious, and an unexpected one is exactly what an attacker needs to be
 * approved reflexively.
 */
export default function WalletLock({
  hint,
  configured,
}: {
  /** "Face ID", "Touch ID", "fingerprint" — whatever this device is likely to show. */
  hint?: string;
  /** False when the deployment has no WALLET_LOCK_SECRET. */
  configured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState(hint ?? "your device");

  /* What the prompt will actually be called, so the button does not say
     "Face ID" to somebody on a Windows laptop. Read after mount — the user
     agent is not available while rendering on the server. */
  useEffect(() => {
    if (hint) return;
    const ua = navigator.userAgent;
    if (/iPhone|iPad/.test(ua)) setLabel("Face ID or Touch ID");
    else if (/Macintosh/.test(ua)) setLabel("Touch ID");
    else if (/Android/.test(ua)) setLabel("your fingerprint");
    else if (/Windows/.test(ua)) setLabel("Windows Hello");
  }, [hint]);

  const unlock = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const optionsRes = await fetch("/api/wallet/passkey", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ step: "auth/options" }),
      });

      if (!optionsRes.ok) {
        setError(messageFor((await optionsRes.json().catch(() => ({}))) as ApiError));
        setBusy(false);
        return;
      }

      const response = await startAuthentication({ optionsJSON: await optionsRes.json() });

      const verifyRes = await fetch("/api/wallet/passkey", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ step: "auth/verify", response }),
      });

      if (!verifyRes.ok) {
        setError(messageFor((await verifyRes.json().catch(() => ({}))) as ApiError));
        setBusy(false);
        return;
      }

      /* The server sets the unlock cookie; the page re-renders with the
         figures it would not fetch before. */
      router.refresh();
    } catch (e) {
      /* A cancelled prompt is not a failure and must not read like one —
         somebody who dismissed it on purpose does not need a red banner. */
      const name = (e as DOMException)?.name;
      setError(
        name === "NotAllowedError"
          ? null
          : "That did not work. Try again, or use your password.",
      );
      setBusy(false);
    }
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="relative"
      >
        {/* A pool of light behind the mark, so it reads as an object on a
            stage rather than an icon on a page. */}
        <div
          aria-hidden
          className="absolute -inset-8 rounded-full opacity-60 blur-2xl"
          style={{ background: "radial-gradient(circle, var(--brand-lighter), transparent 70%)" }}
        />
        <div className="relative grid h-24 w-24 place-items-center rounded-full border border-[color:var(--wallet-glass-border)] bg-[color:var(--wallet-btn-bg)]">
          <ScanFace size={34} style={{ color: "var(--wallet-fg)" }} aria-hidden />
        </div>
      </motion.div>

      <h1 className="mt-8 font-display text-[24px] tracking-tight" style={{ color: "var(--wallet-fg)" }}>
        Your wallet is locked
      </h1>

      <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--wallet-fg-muted)" }}>
        {configured
          ? `Unlock with ${label} to see your balance and what it paid for.`
          : "Wallet lock is not switched on for this deployment yet."}
      </p>

      {configured && (
        <button
          type="button"
          onClick={() => void unlock()}
          disabled={busy}
          className="mt-8 inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-8 text-[15px] font-medium text-background transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <Fingerprint size={18} aria-hidden />
          )}
          {busy ? "Waiting for you" : `Unlock with ${label}`}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-4 text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      <p
        className="mt-10 flex items-start gap-2 text-left text-[11.5px] leading-relaxed"
        style={{ color: "var(--wallet-fg-muted)" }}
      >
        <ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden />
        Your face and fingerprint never leave your device. LAWFIC holds a public key that can
        check a signature and cannot produce one — there is no biometric data here to steal.
      </p>
    </div>
  );
}

type ApiError = { error?: string; message?: string };

function messageFor(e: ApiError): string {
  if (e.message) return e.message;
  switch (e.error) {
    case "no_passkeys":
      return "There is no key registered on this account yet.";
    case "unknown_credential":
      return "That key is not registered here any more.";
    case "possible_clone":
      return "That key looks like it has been copied. Remove it from your account and register a new one.";
    case "challenge_expired":
      return "That took too long. Try again.";
    case "not_signed_in":
      return "Your session has expired. Sign in and try again.";
    default:
      return "That did not work. Try again, or use your password.";
  }
}
