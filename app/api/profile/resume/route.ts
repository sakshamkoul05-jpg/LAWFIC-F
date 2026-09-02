import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ["pdf", "doc", "docx"];

/**
 * Upload a resume to Supabase Storage.
 *
 * The file lands at resumes/<user_id>/resume.<ext>. The client is scoped by
 * its own session cookie and the storage bucket policy must allow an
 * authenticated user to insert at their own prefix. We verify the file type
 * and size here rather than trusting the client-supplied path.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 2 MB." }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED.includes(ext)) {
    return NextResponse.json({ error: "PDF or Word (.doc/.docx) only." }, { status: 400 });
  }

  const path = `${auth.user.id}/resume.${ext}`;

  /* The write goes through the service-role client, and the path is built
     here from the verified session — never from anything the caller sent. A
     user can therefore only ever write under their own id, which is the same
     guarantee a storage RLS policy would give, enforced one layer up.
     
     Why not RLS: the `resumes` bucket has no policies on storage.objects, so
     a user-session client is refused outright and every upload failed. The
     policies are still worth having as defence in depth — they are in
     supabase/migrations/002_resume_storage.sql — but the route must not
     depend on someone having run them.
     
     The bucket itself enforces the 2 MB limit and the accepted MIME types, so
     those checks above are the friendly error, not the only guard. */
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  const { error } = await admin.storage
    .from("resumes")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error("[profile/resume] upload failed", error.message);

    /* A missing bucket is our misconfiguration, not a bad file, and the two
       must not be reported the same way. Telling someone their PDF was
       rejected when the truth is that storage was never set up sends them off
       to re-export a perfectly good file. The caller uses this to choose its
       wording; either way onboarding continues. */
    const bucketMissing = /bucket not found|does not exist/i.test(error.message);
    return NextResponse.json(
      { error: bucketMissing ? "storage_unavailable" : "upload_failed" },
      { status: bucketMissing ? 503 : 502 },
    );
  }

  return NextResponse.json({ resumePath: path });
}