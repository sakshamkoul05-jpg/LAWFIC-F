"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2, Lock, Trash2 } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

export type Passkey = {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  backedUp: boolean;
};

/**
 * Turning the lock on, and the devices it is on.
 *
 * REMOVING THE LAST KEY UNLOCKS THE WALLET RATHER THAN SEALING IT
 *
 * The obvious failure here is a customer who removes their only key from a
 * device they no longer have and finds the wallet permanently shut. So the
 * delete route clears the unlock when the count reaches zero, and the wallet
 * goes back to being reachable with the password alone. A lock whose key can
 * be lost has to have a way back in, and the way back in is the one they
 * already used to get here.
 *
 * IT IS OFF UNTIL SOMEBODY TURNS IT ON
 *
 * No key registered means no lock screen. Switching this on is a decision, and
 * a wallet that starts demanding Face ID after an update nobody asked for is
 * an app people uninstall.
 */
export default function PasskeyManager({
  passkeys,
  configured,
}: {
  passkeys: Passkey[];
  configured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const optionsRes = await fetch("/api/wallet/passkey", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ step: "register/options" }),
      });

      if (!optionsRes.ok) {
        const e = (await optionsRes.json().catch(() => ({}))) as { message?: string };
        setError(e.message ?? "That did not work. Try again.");
        setBusy(false);
        return;
      }

      const response = await startRegistration({ optionsJSON: await optionsRes.json() });

      const verifyRes = await fetch("/api/wallet/passkey", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ step: "register/verify", response, label: deviceLabel() }),
      });

      if (!verifyRes.ok) {
        const e = (await verifyRes.json().catch(() => ({}))) as { error?: string };
        setError(
          e.error === "already_registered"
            ? "This device is already registered on your account."
            : "That did not work. Try again.",
        );
        setBusy(false);
        return;
      }

      router.refresh();
      setBusy(false);
    } catch (e) {
      const name = (e as DOMException)?.name;
      setError(
        name === "NotAllowedError"
          ? null
          : name === "InvalidStateError"
            ? "This device is already registered on your account."
            : "This browser or device cannot do that.",
      );
      setBusy(false);
    }
  }, [router]);

  const remove = useCallback(
    async (id: string, label: string) => {
      if (!confirm(`Remove ${label}? You will need your password to get in from it again.`)) return;
      setBusy(true);
      await fetch(`/api/wallet/passkey?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(
        () => {},
      );
      router.refresh();
      setBusy(false);
    },
    [router],
  );

  return (
    <section className="rounded-2xl border border-border bg-surface px-5 py-5">
      <div className="flex items-start gap-3">
        <Lock size={17} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-medium text-foreground">Lock the wallet</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            {passkeys.length
              ? "Your balance and statement are hidden until you unlock them on one of these."
              : "Ask for Face ID, Touch ID, Windows Hello or a fingerprint before showing your balance."}
          </p>
        </div>
      </div>

      {passkeys.length > 0 && (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
          {passkeys.map((k) => (
            <li key={k.id} className="flex items-center gap-3 bg-background px-4 py-3">
              <Fingerprint size={16} className="shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-foreground">{k.label}</span>
                <span className="block truncate text-[11px] text-subtle">
                  {k.lastUsedAt
                    ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                    : "Not used yet"}
                  {k.backedUp && " · synced to your keychain"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void remove(k.id, k.label)}
                disabled={busy}
                aria-label={`Remove ${k.label}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-destructive transition-colors hover:bg-destructive-light disabled:opacity-40"
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => void add()}
        disabled={busy || !configured}
        className="mt-4 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-border text-[13.5px] font-medium text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 size={15} className="animate-spin" aria-hidden />
        ) : (
          <Fingerprint size={15} aria-hidden />
        )}
        {passkeys.length ? "Add another device" : "Turn it on for this device"}
      </button>

      {!configured && (
        <p className="mt-3 text-[11.5px] leading-relaxed text-subtle">
          Not available on this deployment — it needs WALLET_LOCK_SECRET set.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[12px] text-destructive">
          {error}
        </p>
      )}

      {passkeys.length > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-subtle">
          Removing the last one turns the lock off again, so losing a device never shuts you out.
          Your face and fingerprint never leave it — we hold a public key, not a template.
        </p>
      )}
    </section>
  );
}

/** A name somebody will recognise in a list, without asking them to type one. */
function deviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android phone";
  if (/Windows/.test(ua)) return "Windows PC";
  return "This device";
}
