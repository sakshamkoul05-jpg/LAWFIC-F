import type { Metadata } from "next";
import Link from "next/link";
import StaffLoginForm from "./StaffLoginForm";

export const metadata: Metadata = {
  title: "Back office sign in",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The staff door.
 *
 * A SEPARATE DOOR, NOT A SEPARATE LOCK
 *
 * This signs in against the same Supabase auth every customer uses. It is a
 * different page, not a different credential store, and that distinction is the
 * whole design. A parallel admin auth would mean two password databases, two
 * reset flows, two session implementations and two chances to get any of it
 * wrong — for no gain, because what actually grants back-office access is a row
 * in `public.staff` and `is_staff()` enforced by RLS. Whether you arrived
 * through this page or the customer one changes nothing about what you can see.
 *
 * So what does the separate door buy? Somewhere to land that is unmistakably
 * internal, a sign-in that returns you to the queue instead of to a wallet, and
 * no marketing chrome in front of someone starting a shift.
 *
 * There is no sign-up here, deliberately. Accounts are created through the
 * ordinary flow and then granted staff by hand in the database — a page that
 * both created accounts and sat at /admin would be the closest thing this site
 * has to a "make me an administrator" button.
 */
export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-16">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lawfic-logo.png" alt="" className="h-14 w-14 object-contain" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
            Back office
          </p>
          <h1 className="mt-2 font-display text-[22px] font-bold tracking-tight text-foreground">
            Staff sign in
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            For LAWFIC staff. Customers sign in{" "}
            <Link href="/login" className="text-primary underline underline-offset-2">
              over here
            </Link>
            .
          </p>
        </div>

        <StaffLoginForm />

        <p className="mt-6 text-center text-[11.5px] leading-relaxed text-subtle">
          Access is granted by adding a row to the staff table in the database.
          Signing in with an ordinary account will tell you your user id and the
          statement that grants it.
        </p>
      </div>
    </div>
  );
}
