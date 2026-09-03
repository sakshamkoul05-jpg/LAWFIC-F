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

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/wallet";
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
