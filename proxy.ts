import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Refreshes the Supabase session cookie on each request, and turns anonymous
 * visitors away from the signed-in area.
 *
 * This is a convenience gate, NOT the security boundary. The real one is Row
 * Level Security, plus the append-only wallet triggers. Both hold even if this
 * file is bypassed, misconfigured or deleted. Never move a permission check
 * out of the database and into here.
 */

const PROTECTED = ["/account", "/orders", "/admin"];

/* Doors, which cannot be behind the locks they open. /admin/login sits under a
   protected prefix, so without this it would redirect to itself forever. */
const PUBLIC_WITHIN_PROTECTED = ["/admin/login"];

/**
 * Where a signed-in customer may go BEFORE the profile form is filled in.
 *
 * A new account reaches the site only through /profile/setup — that is the
 * requirement. But "only" taken literally builds a cell, so four things stay
 * open and each is here for a reason:
 *
 *   /profile/setup  is the form itself. Gating the form behind the form is an
 *                   infinite redirect, and it is the classic way this feature
 *                   gets shipped broken.
 *   /auth           is sign-out, the code callback and password recovery.
 *                   Somebody who cannot finish the form must still be able to
 *                   leave; an onboarding gate that traps a customer signed in
 *                   with no way out is worse than no gate.
 *   /api            is fetched BY the form. Redirecting its own save endpoint
 *                   to an HTML page means the form can never be completed —
 *                   the gate would make itself impossible to pass.
 *   /legal          is the terms, the privacy notice and the refund policy.
 *                   Asking somebody for their name and address while refusing
 *                   to let them read what they are agreeing to is not a
 *                   defensible thing for a compliance company to do.
 *
 * /admin is exempt separately, below. Staff are not customers and the back
 * office does not read a customer profile; routing an agent to a personal
 * details form to reach the order queue would be nonsense.
 */
const OPEN_BEFORE_ONBOARDING = ["/profile/setup", "/auth", "/api", "/legal"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not remove: this is what refreshes an expiring session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isPublicDoor = PUBLIC_WITHIN_PROTECTED.includes(pathname);
  const isProtected =
    !isPublicDoor &&
    PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    /* Staff get sent to the staff door, customers to the customer one. Sending
       an agent to the shopfront login and then bouncing them back through the
       marketing site to reach a queue is a worse first minute of the working
       day than it needs to be. */
    const backOffice = pathname === "/admin" || pathname.startsWith("/admin/");
    url.pathname = backOffice ? "/admin/login" : "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  /* Already signed in and standing at the staff door: go through it. */
  if (user && pathname === "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  /**
   * THE PROFILE FORM IS NOT OPTIONAL.
   *
   * An account that has confirmed its address but filled in nothing is of no
   * use to anybody: it cannot be addressed, its filings cannot be prepared,
   * and the personalised half of the site has nothing to work from. So a
   * signed-in customer without `onboarded` goes to the form, from wherever
   * they were heading, until it is done.
   *
   * WHY HERE AND NOT IN THE PAGES
   *
   * Because this runs before every route, including ones written later by
   * somebody who has never read this file. A check that lives inside each
   * protected page is a check that is missing from the next page added, and
   * the failure is silent — the page simply works for someone it should not.
   *
   * WHAT THIS IS NOT
   *
   * It is not a security boundary. It is a routing rule, and the note at the
   * top of this file applies unchanged: RLS decides what any account can
   * actually read or write, and it holds whether or not this redirect fires.
   * An un-onboarded account reaching /wallet by some other means still sees
   * only its own empty wallet.
   *
   * `onboarded` is written by /api/profile when the form is saved, in the same
   * call as the profile row. It is read here off the user metadata that
   * getUser() already fetched above, so this costs no extra round trip.
   */
  const onboarded = Boolean(user?.user_metadata?.onboarded);
  const isBackOffice = pathname === "/admin" || pathname.startsWith("/admin/");
  const isOpenBeforeOnboarding = OPEN_BEFORE_ONBOARDING.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (user && !onboarded && !isBackOffice && !isOpenBeforeOnboarding && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/profile/setup";
    /* Where they were going, so the form can send them on rather than dumping
       everyone on the same page afterwards. */
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    /* An un-onboarded account landing on /login goes to the form, not to the
       wallet — otherwise it is two redirects to reach the same place, and the
       wallet flashes up in between. */
    url.pathname = onboarded ? "/wallet" : "/profile/setup";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
