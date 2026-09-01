import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where a magic link lands. Exchanges the one-time code for a session cookie.
 * New users are sent to profile setup, everyone else to where they were headed.
 *
 * `next` is constrained to a path on this site — an open redirect here would
 * let a crafted link bounce a freshly signed-in user to somewhere else with
 * their session already established.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/wallet";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/wallet";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=not_configured", url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.warn("[auth] code exchange failed", error.message);
    return NextResponse.redirect(new URL("/login?error=link_expired", url.origin));
  }

  const { data: { user } } = await supabase.auth.getUser();

  // New users (no full_name metadata yet) land on profile setup first.
  const isNew = user && !user.user_metadata?.onboarded;
  const target = isNew ? "/profile/setup" : next;

  return NextResponse.redirect(new URL(target, url.origin));
}