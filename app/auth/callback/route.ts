import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where every emailed link lands: a magic link, a sign-up confirmation, or a
 * password reset. It turns the one-time credential in the URL into a session
 * cookie and then decides where the reader actually wanted to go.
 *
 * TWO SHAPES OF LINK, BECAUSE SUPABASE SENDS EITHER
 *
 * `{{ .ConfirmationURL }}` in an email template produces `?code=…` and is
 * redeemed with `exchangeCodeForSession`. `{{ .TokenHash }}` produces
 * `?token_hash=…&type=…` and is redeemed with `verifyOtp`. Which one arrives
 * depends on how somebody edited the templates in the dashboard, months from
 * now, without touching this file. Handling only the first is how a working
 * reset flow breaks silently after a template edit, so both are handled.
 *
 * `next` is constrained to a path on this site. An open redirect here would let
 * a crafted link bounce a freshly signed-in user somewhere else with their
 * session already established.
 */

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isOtpType(v: string | null): v is EmailOtpType {
  return v !== null && (OTP_TYPES as string[]).includes(v);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const rawNext = url.searchParams.get("next") ?? "/wallet";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/wallet";

  /* A recovery is on its way to the new-password form, so its own failure
     message belongs on the reset page rather than on the sign-in page. */
  const recovering = type === "recovery" || next.startsWith("/auth/reset");
  const failure = recovering ? "/login?error=reset_expired" : "/login?error=link_expired";

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=not_configured", url.origin));
  }

  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: isOtpType(type) ? type : "email",
      })
    : await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    console.warn("[auth] callback failed", error.message);
    return NextResponse.redirect(new URL(failure, url.origin));
  }

  /* A password reset goes to the reset form and NOWHERE else. Without this,
     an account that never finished onboarding gets diverted to profile setup
     by the rule below, and the one thing the person came to do — the thing
     they cannot do anywhere else, because the link is single-use — is the one
     thing they are not offered. */
  if (recovering) {
    return NextResponse.redirect(new URL("/auth/reset", url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // New users (no onboarded metadata yet) land on profile setup first.
  const isNew = user && !user.user_metadata?.onboarded;
  return NextResponse.redirect(new URL(isNew ? "/profile/setup" : next, url.origin));
}
