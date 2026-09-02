import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Create an account without an email round trip.
 *
 * WHY THIS EXISTS
 *
 * Supabase's own sign-up sends a confirmation email, and this project's mailer
 * fails — its built-in sender delivers two messages an hour and only to
 * addresses on the project team, so `POST /auth/v1/signup` returns 500 "Error
 * sending confirmation email" and no user is created at all. The result was a
 * site nobody could register on.
 *
 * The Admin API can create a user already marked confirmed, which is exactly
 * what the dashboard's "Confirm email: off" switch does, expressed in code so
 * it does not depend on a setting someone has to remember to flip.
 *
 * WHAT THIS GIVES UP, PLAINLY
 *
 * Nobody proves they own the address they register. Someone can sign up as
 * another person's email, and a customer who mistypes theirs gets an account
 * they can never receive mail at. That is an accepted trade while there is no
 * working mailer — an unusable sign-up is worse — but it IS a trade, and it
 * should be reversed once SMTP exists: configure it, delete this route, and
 * let Supabase send its confirmation again. `VERIFICATION_REQUIRED` below is
 * the single switch for that.
 *
 * The service role is used for one narrow thing — creating a user from an
 * email and password this route has already validated. It never reads or
 * returns anyone else's data, and it never signs anybody in: the browser does
 * that itself with the password immediately afterwards, so no session is
 * minted here.
 */

/** Flip to true once custom SMTP is configured, then delete this route. */
const VERIFICATION_REQUIRED = false;

const Signup = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  if (VERIFICATION_REQUIRED) {
    return NextResponse.json({ error: "use_supabase_signup" }, { status: 410 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = Signup.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Sign-up is not switched on yet." }, { status: 503 });
  }

  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    // The whole point of the route. Without it Supabase mails a confirmation
    // and the account cannot be used until someone clicks a link that never
    // arrives.
    email_confirm: true,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") && message.includes("registered")) {
      return NextResponse.json(
        { error: "That email already has an account. Sign in instead." },
        { status: 409 },
      );
    }
    /* `fetch failed` here almost always means TLS, not Supabase — a local
       machine intercepting certificates will produce
       UNABLE_TO_VERIFY_LEAF_SIGNATURE and nothing more specific. Log the cause
       so the next person does not spend an hour on it. */
    console.error(
      "[auth/signup] createUser failed:",
      error.message,
      "| cause:",
      JSON.stringify((error as { cause?: unknown }).cause ?? null),
    );
    return NextResponse.json({ error: "Could not create that account." }, { status: 500 });
  }

  // No session is returned. The browser signs in with the password it already
  // has, so a token is never minted server-side or put on the wire.
  return NextResponse.json({ ok: true });
}
