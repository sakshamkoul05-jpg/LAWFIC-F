"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { VAULT_KINDS, VAULT_MAX_BYTES, VAULT_TYPES } from "@/lib/vault";

/**
 * The document vault's server half.
 *
 * WHY THE FILE DOES NOT PASS THROUGH HERE
 *
 * Vercel refuses a function request body over 4.5 MB, and a scanned deed is
 * often bigger. So the browser uploads straight to the private "vault" bucket
 * with the customer's own session — the bucket's policies only allow writes
 * under <their user id>/ — and then calls `recordVaultUpload` with the path.
 *
 * This action does not take the browser's word for anything: it checks the
 * path is in the caller's own folder, then asks storage what is really there
 * and records THAT size and type. A file that does not exist, or is the wrong
 * type, is refused and removed.
 */

export type VaultResult = { error?: string; ok?: boolean };

const Record_ = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/),
  kind: z.enum(VAULT_KINDS.map((k) => k.id) as [string, ...string[]]),
  label: z.string().trim().min(1).max(120),
  business_id: z.union([z.string().uuid(), z.literal("")]),
});

export async function recordVaultUpload(input: z.input<typeof Record_>): Promise<VaultResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Sign-in is not switched on yet." };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please sign in again." };

  const parsed = Record_.safeParse(input);
  if (!parsed.success) return { error: "Give the document a name and a type." };
  const { path, kind, label, business_id } = parsed.data;

  const [folder, name] = path.split("/");
  if (folder !== auth.user.id) return { error: "That upload does not belong to you." };

  const { data: listed } = await supabase.storage.from("vault").list(folder, { search: name, limit: 1 });
  const obj = listed?.find((o) => o.name === name);
  const meta = (obj?.metadata ?? {}) as { size?: number; mimetype?: string };
  const size = Number(meta.size ?? 0);
  const mime = String(meta.mimetype ?? "");

  if (!obj || !VAULT_TYPES[mime] || size < 1 || size > VAULT_MAX_BYTES) {
    if (obj) await supabase.storage.from("vault").remove([path]);
    return { error: "That file could not be accepted — PDF, JPG, PNG or WebP up to 10 MB." };
  }

  const { error } = await supabase.from("vault_documents").insert({
    user_id: auth.user.id,
    business_id: business_id || null,
    kind,
    label,
    path,
    mime_type: mime,
    size_bytes: size,
  });
  if (error) {
    await supabase.storage.from("vault").remove([path]);
    console.error("[vault] row insert failed", error);
    return { error: "Could not save that document." };
  }

  revalidatePath("/vault");
  revalidatePath("/compliance");
  return { ok: true };
}

export async function deleteFromVault(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;

  const { data: row } = await supabase
    .from("vault_documents")
    .select("path")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!row) return;
  await supabase.storage.from("vault").remove([row.path]);
  await supabase.from("vault_documents").delete().eq("id", id).eq("user_id", auth.user.id);
  revalidatePath("/vault");
}
