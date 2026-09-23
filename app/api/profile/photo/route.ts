import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_BYTES, isPhotoKind, photoPath, sniffImageType } from "@/lib/profile-photos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "profile-photos";

type Client = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/**
 * Upload or remove a profile or cover photograph.
 *
 * WHAT THE BROWSER HAS ALREADY DONE, AND WHY THIS STILL CHECKS
 *
 * The studio crops to the right shape, resizes to the right pixels and
 * re-encodes to WebP through a canvas before it posts. That is the happy path
 * and it produces a small, clean, metadata-free file.
 *
 * None of it is a control. Anything can post to this URL with a hand-written
 * request, so the file is measured and sniffed here regardless: the size, and
 * the first bytes of the image itself rather than the Content-Type the caller
 * chose to claim. A declared MIME type is a request, not evidence.
 *
 * ON EXIF, WHICH IS THE PRIVACY PART
 *
 * A photograph straight off a phone carries the coordinates of wherever it was
 * taken. Uploading one unaltered would have a customer publishing their home
 * address to us without knowing it. Canvas re-encoding in the browser drops
 * every metadata block as a side effect of producing fresh pixels, so the
 * normal path is clean. A file that arrives by any other route may still carry
 * EXIF: it is stored in a private bucket, served only to its owner, and never
 * shown to anybody else — but stripping it properly needs an image library on
 * the server, and that is worth adding the day these photographs become
 * visible to another customer.
 */

/* Discriminated on a boolean rather than on the presence of `fail`. TypeScript
   will not narrow a union by testing a property that only one member declares,
   so every use of gate.supabase would otherwise be possibly-undefined. */
type Gate =
  | { ok: false; error: string; status: number }
  | { ok: true; supabase: Client; userId: string };

async function authed(): Promise<Gate> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "not_configured", status: 503 };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "not_signed_in", status: 401 };

  return { ok: true, supabase, userId: auth.user.id };
}

export async function POST(request: Request) {
  const gate = await authed();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { supabase, userId } = gate;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const kind = form.get("kind");
  if (!isPhotoKind(kind)) {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "too_large", message: "That picture is over 3 MB. Crop it or pick a smaller one." },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) {
    return NextResponse.json(
      {
        error: "not_an_image",
        message: "That file is not a JPEG, PNG or WebP picture.",
      },
      { status: 415 },
    );
  }

  const path = photoPath(userId, kind, type);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: type, upsert: false });

  if (uploadError) {
    console.error("[profile/photo] upload failed", uploadError);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  /* The row is updated BEFORE the old file is deleted. If the delete fails we
     are left with one unreferenced object; if the order were reversed, a failed
     update would leave the profile pointing at a file that no longer exists. A
     stray file costs storage. A broken pointer costs the customer their
     picture. */
  const column = kind === "avatar" ? "avatar_path" : "cover_path";
  const previous = await currentPath(supabase, userId, column);

  const { error: rowError } = await supabase.from("user_profiles").upsert(
    { user_id: userId, [column]: path, photos_updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );

  if (rowError) {
    /* Nothing is pointing at the file we just wrote, so take it back out rather
       than leaving an orphan behind on every failed save. */
    await supabase.storage.from(BUCKET).remove([path]);
    console.error("[profile/photo] row update failed", rowError);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  if (previous && previous !== path) {
    await supabase.storage.from(BUCKET).remove([previous]);
  }

  const url = await sign(supabase, path);
  return NextResponse.json({ ok: true, kind, path, url });
}

export async function DELETE(request: Request) {
  const gate = await authed();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { supabase, userId } = gate;

  const kind = new URL(request.url).searchParams.get("kind");
  if (!isPhotoKind(kind)) {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }

  const column = kind === "avatar" ? "avatar_path" : "cover_path";
  const previous = await currentPath(supabase, userId, column);

  const { error } = await supabase.from("user_profiles").upsert(
    { user_id: userId, [column]: "", photos_updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[profile/photo] clear failed", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  /* Clearing the pointer first means a failed delete leaves a stray file that
     nothing references, rather than a row pointing at something the customer
     believes they removed. "Remove my photograph" has to mean it. */
  if (previous) {
    await supabase.storage.from(BUCKET).remove([previous]);
  }

  return NextResponse.json({ ok: true, kind });
}

async function currentPath(supabase: Client, userId: string, column: string): Promise<string> {
  const { data } = await supabase
    .from("user_profiles")
    .select(column)
    .eq("user_id", userId)
    .maybeSingle();

  const value = (data as Record<string, unknown> | null)?.[column];
  return typeof value === "string" ? value : "";
}

async function sign(supabase: Client, path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}
