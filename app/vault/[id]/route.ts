import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Open or download a vault document: check the session, look the row up under
 * RLS (so only the owner finds it), and redirect to a signed URL that lives
 * for sixty seconds. The URL is never rendered into a page, so it cannot be
 * scraped, cached or forwarded for longer than that minute.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  if (!z.string().uuid().safeParse(id).success) return new NextResponse("Not found", { status: 404 });

  const supabase = await createClient();
  if (!supabase) return new NextResponse("Not available", { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL(`/login?next=/vault`, url));

  const { data: row } = await supabase.from("vault_documents").select("path,label").eq("id", id).maybeSingle();
  if (!row) return new NextResponse("Not found", { status: 404 });

  const download = url.searchParams.get("download") === "1";
  const ext = row.path.split(".").pop();
  const { data, error } = await supabase.storage
    .from("vault")
    .createSignedUrl(row.path, 60, download ? { download: `${row.label.replace(/[^\w\- ]+/g, "").slice(0, 80) || "document"}.${ext}` } : undefined);
  if (error || !data) return new NextResponse("Could not open that document", { status: 500 });

  return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "no-store" } });
}
