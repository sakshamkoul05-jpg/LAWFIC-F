"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Pencil, User, X } from "lucide-react";
import WalletAvatar from "@/components/wallet/WalletAvatar";
import { ENGRAVING_MAX, normalizeEngraving } from "@/lib/wallet3d/config";
import type { WalletConfig } from "@/lib/wallet3d/finishes";

/**
 * Whose wallet this is: the photograph, and the name pressed into the leather.
 *
 * THE NAME HERE IS THE ENGRAVING
 *
 * It is not a second field that happens to sit near the wallet. Typing a name
 * here stamps it into the object below — replacing the LAWFIC wordmark, in
 * both the 3D wallet and the flat one. That is why it is editable from the
 * wallet screen rather than buried in the customiser: the thing it changes is
 * six inches below it and changes as you type, which is the only way somebody
 * discovers the feature exists.
 *
 * Clearing it puts the wordmark back. There is no "reset" button because
 * emptying a field is already how you undo typing in it.
 */
export function WalletIdentity({
  displayName,
  config,
  onEngravingChange,
  signedIn,
  avatarSeed,
  photoUrl: photo,
}: {
  /** The account name, from auth. Shown when nothing is engraved. */
  displayName: string;
  config: WalletConfig;
  /** Applied immediately so the wallet below updates as it is typed. */
  onEngravingChange: (next: string) => void;
  signedIn: boolean;
  avatarSeed: string;
  /** Passed in rather than fetched, so this and the wallet never disagree. */
  photoUrl: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(config.engraving);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  /* The engraving can change from the customiser too. Keep the draft in step
     while it is closed; do not stamp on what is being typed. */
  useEffect(() => {
    if (!editing) setDraft(config.engraving);
  }, [config.engraving, editing]);

  const commit = async () => {
    const value = normalizeEngraving(draft);
    setSaving(true);
    setError(null);

    /* Applied before the request, not after. The wallet is on screen and the
       point of the field is watching the leather change — a spinner followed by
       a jump two hundred milliseconds later reads as lag. If the save fails the
       message says so and the value is still there to try again. */
    onEngravingChange(value);

    try {
      const res = await fetch("/api/wallet/config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...config, engraving: value }),
      });
      if (!res.ok) {
        setError(res.status === 401 ? "Sign in to keep this." : "That did not save.");
      } else {
        setEditing(false);
      }
    } catch {
      setError("That did not reach us.");
    }
    setSaving(false);
  };

  const stamped = config.engraving.trim();

  return (
    <header className="mb-10 flex items-center gap-4 px-1">
      <div className="shrink-0">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- a signed URL
          // that expires; the optimizer would cache it past its own lifetime.
          <img
            src={photo}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover ring-1 ring-[color:var(--wallet-glass-border)]"
          />
        ) : signedIn ? (
          <WalletAvatar seed={avatarSeed} size={48} />
        ) : (
          <div
            className="grid h-12 w-12 place-items-center rounded-full"
            style={{ background: "var(--wallet-btn-bg)" }}
          >
            <User size={20} style={{ color: "var(--wallet-fg-muted)" }} aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="cred-label">{stamped ? "Stamped on your wallet" : "Welcome back"}</p>

        {editing ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={draft}
              maxLength={ENGRAVING_MAX}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void commit();
                if (e.key === "Escape") {
                  setDraft(config.engraving);
                  setEditing(false);
                }
              }}
              placeholder={displayName}
              aria-label="The name stamped on your wallet"
              className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-[16px] font-medium tracking-tight outline-none"
              style={{
                background: "var(--wallet-btn-bg)",
                border: "1px solid var(--wallet-input-border)",
                color: "var(--wallet-fg)",
              }}
            />
            <button
              type="button"
              onClick={() => void commit()}
              disabled={saving}
              aria-label="Save"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg disabled:opacity-50"
              style={{ background: "var(--wallet-btn-bg)", color: "var(--wallet-fg)" }}
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" aria-hidden />
              ) : (
                <Check size={15} aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(config.engraving);
                setEditing(false);
              }}
              aria-label="Cancel"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
              style={{ color: "var(--wallet-fg-muted)" }}
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="group mt-1.5 flex max-w-full items-center gap-2"
            aria-label={
              stamped ? `Change the name on your wallet, currently ${stamped}` : "Put your name on your wallet"
            }
          >
            <span
              className="truncate text-[17px] font-medium tracking-tight"
              style={{ color: "var(--wallet-fg)" }}
            >
              {stamped || displayName}
            </span>
            <Pencil
              size={13}
              className="shrink-0 opacity-45 transition-opacity group-hover:opacity-100"
              style={{ color: "var(--wallet-fg-muted)" }}
              aria-hidden
            />
          </button>
        )}

        {error ? (
          <p role="alert" className="mt-1 text-[11.5px]" style={{ color: "var(--destructive)" }}>
            {error}
          </p>
        ) : !stamped && !editing ? (
          <p className="mt-1 text-[11.5px]" style={{ color: "var(--wallet-fg-muted)" }}>
            Add a name and it replaces LAWFIC on the leather.
          </p>
        ) : null}
      </div>
    </header>
  );
}
