import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ROLES, isStaffRole, type StaffRole } from "@/lib/staff-roles";
import { AdminGate } from "../AdminGate";
import PeopleList, { type Person } from "./PeopleList";

export const metadata: Metadata = {
  title: "People",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Who can get into the back office, and what each of them may do.
 *
 * THE PAGE IS VISIBLE TO ANY SEAT; THE CONTROLS ARE NOT
 *
 * Everybody with access can see who else has it — that is ordinary, and a
 * team that cannot see its own membership has to ask somebody every time. Only
 * an owner gets the controls, and only the database decides that: this page
 * asks staff_can('people') rather than comparing a string it was handed.
 *
 * WHAT IS NOT ON THIS PAGE
 *
 * Any way to create an account, set a password, or make the first owner.
 * People sign up through the front door and are granted a role afterwards.
 * The first owner is hand-run SQL — a button that mints an administrator from
 * nothing is the button somebody who has broken into any account looks for.
 */
export default async function PeoplePage() {
  const supabase = await createClient();
  if (!supabase) return <AdminGate reason="not-connected" />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <AdminGate reason="signed-out" />;

  const { data: inBackOffice } = await supabase.rpc("is_back_office");
  if (!inBackOffice) {
    /* Falls back to is_staff() so this page still gates correctly on a
       deployment where the roles migration has not been run yet. */
    const { data: staff } = await supabase.rpc("is_staff");
    if (!staff) {
      return <AdminGate reason="not-staff" userId={auth.user.id} email={auth.user.email} />;
    }
  }

  const [{ data: staffRows, error }, { data: canManage }, { data: directory }] = await Promise.all([
    supabase.from("staff").select("user_id, role, note, created_at").order("created_at"),
    supabase.rpc("staff_can", { capability: "people" }),
    supabase.rpc("staff_user_directory"),
  ]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-[24px] font-bold text-foreground">People</h1>
        <div className="mt-6 rounded-2xl border border-border px-5 py-8">
          <p className="text-[14px] text-foreground">Roles are not set up yet.</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Run{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">
              supabase/migrations/20260921120000_staff_roles.sql
            </code>{" "}
            in the Supabase SQL editor, then reload.
          </p>
          <p className="mt-3 font-mono text-[11.5px] text-subtle">{error.message}</p>
        </div>
      </div>
    );
  }

  type Row = { user_id: string; role: string; note: string | null; created_at: string };
  type DirectoryEntry = { id: string; email: string | null; last_sign_in_at: string | null };

  const accounts = new Map<string, DirectoryEntry>();
  for (const d of (directory ?? []) as DirectoryEntry[]) accounts.set(d.id, d);

  /* Names come from profiles, emails from auth. One extra query rather than
     leaving a column blank — a list of uuids is not a list of people. */
  const ids = ((staffRows ?? []) as Row[]).map((r) => r.user_id);
  const { data: profileRows } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };
  const names = new Map(
    ((profileRows ?? []) as { id: string; full_name: string | null }[]).map((p) => [
      p.id,
      p.full_name,
    ]),
  );

  const people: Person[] = ((staffRows ?? []) as Row[]).map((r) => ({
    userId: r.user_id,
    email: accounts.get(r.user_id)?.email ?? null,
    name: names.get(r.user_id) ?? null,
    role: (isStaffRole(r.role) ? r.role : "guest") as StaffRole,
    note: r.note,
    lastSignInAt: accounts.get(r.user_id)?.last_sign_in_at ?? null,
    createdAt: r.created_at,
    isYou: r.user_id === auth.user!.id,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-foreground">People</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          {people.length} {people.length === 1 ? "person has" : "people have"} access to the back
          office.{" "}
          {canManage
            ? "You can change this because you are an owner."
            : "Only an owner can change this."}
        </p>
      </header>

      <PeopleList people={people} canManage={Boolean(canManage)} />

      {/* What each role means, on the page where it is chosen. A permission
          picker whose options are four words is a picker people guess at. */}
      <section className="mt-10 rounded-2xl border border-border px-5 py-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          What the roles mean
        </h2>
        <dl className="mt-4 space-y-3">
          {ROLES.map((r) => (
            <div key={r.role}>
              <dt className="text-[13.5px] font-medium text-foreground">{r.label}</dt>
              <dd className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {r.description}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-6 text-[11.5px] leading-relaxed text-subtle">
        Nobody can be given access here who has not already signed up — there is no
        way to create an account or set a password from the back office. The first
        owner is granted by running SQL against the database, and an owner cannot
        change or remove their own role; the database refuses both, not just this
        page.
      </p>
    </div>
  );
}
