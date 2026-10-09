import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo";
import { vaultKindLabel } from "@/lib/vault";
import { Card, PageShell } from "@/components/compliance/ui";
import { ConfirmSubmit } from "@/components/compliance/ConfirmSubmit";
import { UploadForm } from "./UploadForm";
import { deleteFromVault } from "./actions";

/**
 * The document vault: the PAN, the GST certificate, the deed — kept once,
 * reused on every order, there when a bank asks.
 *
 * Private bucket, owner-only policies, and every view is a signed URL that
 * lasts a minute (see ./[id]/route.ts). Nothing here is public, ever.
 */

export const metadata: Metadata = { title: "Document vault", robots: PRIVATE_PAGE_ROBOTS };
export const dynamic = "force-dynamic";

type Doc = { id: string; kind: string; label: string; mime_type: string; size_bytes: number; created_at: string; business_id: string | null };

function size(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function VaultPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/vault");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/vault");

  const [docsRes, bizRes] = await Promise.all([
    supabase.from("vault_documents").select("id,kind,label,mime_type,size_bytes,created_at,business_id").order("created_at", { ascending: false }),
    supabase.from("businesses").select("id,name").order("created_at"),
  ]);
  const docs = (docsRes.data ?? []) as Doc[];
  const businesses = (bizRes.data ?? []) as { id: string; name: string }[];
  const bizName = new Map(businesses.map((b) => [b.id, b.name]));

  return (
    <PageShell
      eyebrow="Your storage file"
      title="Document vault"
      lead="Keep your business documents in one place. Attach them to an order instead of finding them again, and download them whenever a bank or a landlord asks."
      crumbs={[
        { label: "Account", href: "/profile" },
        { label: "Document vault", href: "/vault" },
      ]}
      width="max-w-4xl"
    >
      <Card>
        <UploadForm userId={auth.user.id} businesses={businesses} />
      </Card>

      <section className="mt-10">
        <h2 className="type-label mb-3 text-subtle">
          {docs.length} document{docs.length === 1 ? "" : "s"}
        </h2>
        {docs.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface px-5 py-6 text-[13.5px] text-muted">
            Nothing here yet. Start with your PAN and GST certificate — they are what most filings ask for first.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light font-mono text-[10px] uppercase text-primary" aria-hidden>
                  {d.mime_type === "application/pdf" ? "PDF" : "IMG"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-foreground">{d.label}</p>
                  <p className="mt-0.5 text-[12px] text-subtle">
                    {vaultKindLabel(d.kind)}
                    {d.business_id && bizName.get(d.business_id) ? ` · ${bizName.get(d.business_id)}` : ""} · {size(d.size_bytes)} ·{" "}
                    {new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <a href={`/vault/${d.id}`} target="_blank" rel="noopener" className="text-[12.5px] text-primary hover:underline">
                  Open
                </a>
                <a href={`/vault/${d.id}?download=1`} className="text-[12.5px] text-muted hover:text-primary">
                  Download
                </a>
                <form action={deleteFromVault}>
                  <input type="hidden" name="id" value={d.id} />
                  <ConfirmSubmit message={`Delete “${d.label}” from your vault? This cannot be undone.`} className="text-[12.5px] text-subtle hover:text-destructive">
                    Delete
                  </ConfirmSubmit>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11.5px] leading-relaxed text-subtle">
          Stored in a private, encrypted bucket. Only you can open these files, and every link expires after a minute.
          Deleting removes the file itself, not just the listing.
        </p>
      </section>
    </PageShell>
  );
}
