import Link from "next/link";

/**
 * What the back office shows when you cannot see it.
 *
 * Shared by every admin page so the three refusals read identically wherever
 * you land. They are worth distinguishing rather than collapsing into one
 * "access denied": not connected is an operator's problem, signed out is fixed
 * by signing in, and not staff is fixed by someone else — telling all three the
 * same thing sends two of them down the wrong path.
 *
 * None of this is the security boundary. RLS and `is_staff()` in the database
 * are, and they hold whether or not this component ever renders; this only
 * decides which sentence a person reads.
 *
 * WHY THE NOT-STAFF SCREEN PRINTS YOUR OWN USER ID
 *
 * Staff access is granted by inserting a row by hand, and there is deliberately
 * no button for it — the first thing an attacker with an account would look for
 * is the one that makes them staff. But "ask an owner to add your user id" is
 * useless advice if you have no way to find out what your user id is, and the
 * first person to set this up has no owner to ask. So the screen shows the id
 * of whoever is looking at it, alongside the statement that grants access.
 *
 * This leaks nothing. It is your own id, shown only to you, and possessing it
 * grants nothing — running the statement requires database credentials, which
 * is exactly the bar this is supposed to sit behind.
 */

export type GateReason = "not-connected" | "signed-out" | "not-staff";

const COPY: Record<GateReason, { title: string; body: string; signIn?: boolean }> = {
  "not-connected": {
    title: "Not connected",
    body: "This build has no database configured, so there is nothing to show.",
  },
  "signed-out": {
    title: "Sign in",
    body: "The back office needs a staff account.",
    signIn: true,
  },
  "not-staff": {
    title: "Not a staff account",
    body: "This area is for LAWFIC staff. Access is granted by adding a row in the database — there is no button for it, on purpose.",
  },
};

export function AdminGate({
  reason,
  userId,
  email,
}: {
  reason: GateReason;
  /** Shown on the not-staff screen so the first owner can grant themselves. */
  userId?: string;
  email?: string;
}) {
  const { title, body, signIn } = COPY[reason];

  const grant = email
    ? `insert into public.staff (user_id, role)\nselect id, 'owner' from auth.users\nwhere email = '${email}';`
    : userId
      ? `insert into public.staff (user_id, role)\nvalues ('${userId}', 'owner');`
      : null;

  return (
    <section className="grain relative min-h-[70vh] overflow-hidden">
      <div className="relative z-2 mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <p className="label text-primary">Back office</p>
        <h1 className="mt-6 font-display text-[clamp(28px,4vw,40px)] leading-[1.1] text-foreground">
          {title}
        </h1>
        <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-muted-foreground">{body}</p>

        {signIn && (
          <Link
            href="/admin/login?next=/admin"
            className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-primary-hover"
          >
            Sign in
          </Link>
        )}

        {reason === "not-staff" && grant && (
          <div className="mt-10 max-w-2xl">
            <p className="text-[13px] text-muted-foreground">
              You are signed in as{" "}
              <span className="font-medium text-foreground">{email ?? userId}</span>. Run this in
              the Supabase SQL editor to grant this account access:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface-2 px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-foreground">
              {grant}
            </pre>
            <p className="mt-3 text-[12px] leading-relaxed text-subtle">
              Use <span className="font-mono">&apos;owner&apos;</span> for yourself and{" "}
              <span className="font-mono">&apos;agent&apos;</span> for everyone else. Running it
              needs database credentials, which is the point — it cannot be done from this page.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
