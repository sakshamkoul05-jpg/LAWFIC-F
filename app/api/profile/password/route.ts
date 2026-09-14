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

  /**
   * The flag goes in the SAME call as the password.
   *
   * Supabase does not tell a client whether an account has a password —
   * `user` carries no such field, and the email identity looks identical
   * whether the account was made by code or by password. So the app has to
   * remember, and `has_password` in user_metadata is that memory: it is what
   * decides whether profile setup offers to add one.
   *
   * Written together with the password rather than in a second updateUser, so
   * the two cannot disagree. Split across two calls, a failure between them
   * leaves an account that HAS a password and is still being asked to set one,
   * every time, with no way for the customer to make the prompt go away.
   */
  const { error } = await supabase.auth.updateUser({
    password,
    data: { has_password: true },
  });
  if (error) {
    console.error("[profile/password] update failed", error.message);
    return NextResponse.json({ error: "password_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}