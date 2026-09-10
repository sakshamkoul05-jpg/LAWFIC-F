"use client";

import { useEffect } from "react";

/**
 * Catches an auth failure that Supabase bounced to the Site URL.
 *
 * WHY THIS HAS TO EXIST ON EVERY PAGE AND NOT JUST ON THE CALLBACK
 *
 * A working email link goes where `emailRedirectTo` said — /auth/callback,
 * which knows what to do with it. A FAILING one does not: when a link is
 * expired, already used, or refused, Supabase throws the error at the project's
 * Site URL instead, which is the bare origin. So the customer lands on the home
 * page with `?error=access_denied&error_code=otp_expired` in the address bar,
 * the home page ignores it, and the only signal that anything went wrong is a
 * query string nobody reads. They are left staring at a site that looks like it
 * simply forgot they clicked anything.
 *
 * IT IS IN BOTH THE QUERY AND THE HASH
 *
 * Supabase puts the same error in `?error_code=` and in `#error_code=`, and
 * which one arrives depends on the flow. The hash never reaches the server, so
 * this check has to run in the browser — which is the other reason it is a
 * client component sitting in the layout rather than something in middleware.
 *
 * The redirect is `replace`, not `push`: the failed URL should not be a place
 * the back button can return to, since visiting it again does nothing but show
 * the same dead link.
 */

/** Supabase's code → the message key /login already knows how to render. */
function messageFor(description: string | null): string {
  /* THE RECOVERY TEST COMES FIRST, AND HAS TO.
     A dead reset link arrives as `otp_expired` — the same code a dead sign-in
     link carries — so checking the code first made this branch unreachable in
     precisely the case it was written for. The description is the only thing
     that distinguishes them, and it is worth distinguishing: "ask for a new
     one" is useful advice on a reset, and "sign in again" is not. */
  if (description && /recover|reset|password/i.test(description)) return "reset_expired";
  return "link_expired";
}

export default function AuthErrorCatcher() {
  useEffect(() => {
    const { search, hash, pathname } = window.location;

    /* /login renders these itself, and /auth/callback is mid-exchange. */
    if (pathname.startsWith("/login") || pathname.startsWith("/auth/")) return;

    const query = new URLSearchParams(search);
    const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

    const code = query.get("error_code") ?? fragment.get("error_code");
    const error = query.get("error") ?? fragment.get("error");
    if (!code && !error) return;

    const description = query.get("error_description") ?? fragment.get("error_description");
    window.location.replace(`/login?error=${messageFor(description)}`);
  }, []);

  return null;
}
