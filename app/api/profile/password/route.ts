import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Set a password for a user who is in the session (e.g. right after OTP
 * sign-in). Supabase stores the hashed credential server-side; we only ever
 * receive the plaintext over HTTPS and never log it.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  let body: { password?: string } = {};
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[profile/password] update failed", error.message);
    return NextResponse.json({ error: "password_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}