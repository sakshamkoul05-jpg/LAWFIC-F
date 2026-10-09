"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordVaultUpload } from "./actions";
import { VAULT_KINDS, VAULT_MAX_BYTES, VAULT_TYPES } from "@/lib/vault";
import { inputClass } from "@/components/compliance/ui";

/**
 * Uploads go browser → private bucket directly (see actions.ts for why), then
 * the server records and verifies them.
 */
export function UploadForm({ userId, businesses }: { userId: string; businesses: { id: string; name: string }[] }) {
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return setMsg({ tone: "error", text: "Choose a file to upload." });
    const ext = VAULT_TYPES[file.type];
    if (!ext) return setMsg({ tone: "error", text: "PDF, JPG, PNG or WebP only." });
    if (file.size > VAULT_MAX_BYTES) return setMsg({ tone: "error", text: "That file is over 10 MB." });

    const supabase = createClient();
    if (!supabase) return setMsg({ tone: "error", text: "Uploads are not switched on yet." });

    start(async () => {
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("vault").upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        setMsg({ tone: "error", text: "The upload did not go through. Try again." });
        return;
      }
      const res = await recordVaultUpload({
        path,
        kind: String(fd.get("kind") ?? "other"),
        label: String(fd.get("label") ?? "").trim() || file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "Document",
        business_id: String(fd.get("business_id") ?? ""),
      });
      if (res.error) setMsg({ tone: "error", text: res.error });
      else {
        setMsg({ tone: "ok", text: "Saved to your vault." });
        form.current?.reset();
      }
    });
  }

  return (
    <form ref={form} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="type-label block text-muted">File</span>
        <input
          type="file"
          name="file"
          required
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-primary-light file:px-3 file:py-1 file:text-[12px] file:text-primary`}
        />
        <span className="mt-1 block text-[11.5px] text-subtle">PDF, JPG, PNG or WebP, up to 10 MB. Please do not upload Aadhaar.</span>
      </label>
      <label className="block">
        <span className="type-label block text-muted">Type</span>
        <select name="kind" className={inputClass} defaultValue="pan">
          {VAULT_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="type-label block text-muted">Name it (optional)</span>
        <input name="label" maxLength={120} className={inputClass} placeholder="e.g. GST certificate — Kangra unit" />
      </label>
      {businesses.length > 0 && (
        <label className="block sm:col-span-2">
          <span className="type-label block text-muted">Belongs to</span>
          <select name="business_id" className={inputClass} defaultValue="">
            <option value="">Me personally</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {msg && <p className={`text-[13px] sm:col-span-2 ${msg.tone === "error" ? "text-destructive" : "text-success"}`}>{msg.text}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
      </div>
    </form>
  );
}
