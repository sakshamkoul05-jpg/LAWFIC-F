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
    body: "This area is for LAWFIC staff. If that should be you, ask an owner to add your user id to the staff table — there is deliberately no button that grants it.",
  },
};

export function AdminGate({ reason }: { reason: GateReason }) {
  const { title, body, signIn } = COPY[reason];
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
            href="/login?next=/admin"
            className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-primary-hover"
          >
            Sign in
          </Link>
        )}
      </div>
    </section>
  );
}
