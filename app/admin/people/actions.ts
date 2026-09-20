"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { describeWriteError, staffClient, type ActionResult } from "@/lib/admin-gate";
import { isStaffRole } from "@/lib/staff-roles";

/**
 * Who has access to the back office.
 *
 * WHAT THIS DELIBERATELY CANNOT DO
 *
 * Create an account, set anybody's password, or mint the first owner. A person
 * signs up through the ordinary front door like everybody else, and then an
 * owner gives them a role. There is no button here that turns a stranger into
 * an administrator, because that button is the first thing somebody who has
 * broken into any account goes looking for.
 *
 * The first owner is still hand-run SQL. See AdminGate, which prints it.
 *
 * WHY THE CHECKS ARE DOUBLED
 *
 * Every rule here — only an owner writes, nobody edits their own role, the
 * last owner cannot be removed — is enforced by RLS and by a trigger on
 * public.staff. These checks exist on top of that so the answer is a sentence
 * somebody can act on rather than a raised Postgres exception, and so that
 * dropping a policy by accident does not quietly open the door. The database
 * is the boundary; this is the manners.
 */

const Grant = z.object({
  email: z.string().trim().toLowerCase().email("That does not look like an email address."),
  role: z.string().refine(isStaffRole, "Pick one of the four roles."),
  note: z.string().trim().max(120).optional().transform((v) => v || null),
});

function refresh() {
  revalidatePath("/admin/people");
}

/**
 * The actor, and whether they may manage people at all.
 *
 * The capability question goes to the database rather than to a role string
 * this process is holding. The page and the action would otherwise each carry
 * their own opinion of what "owner" means.
 */
/* Discriminated on a boolean, not on the presence of `error`. An `error: string`
   can be the empty string, which is falsy, so `if (gate.error)` does not
   narrow the union — it leaves the failure member in the success branch and
   every use of gate.supabase is then possibly undefined. */
type OwnerGate =
  | { ok: false; error: string }
  | { ok: true; supabase: SupabaseClient; actorId: string };

async function ownerOnly(): Promise<OwnerGate> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { data: allowed } = await gate.supabase.rpc("staff_can", { capability: "people" });
  if (!allowed) return { ok: false, error: "Only an owner can change who has access." };

  const { data: auth } = await gate.supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Sign in first." };

  return { ok: true, supabase: gate.supabase, actorId: auth.user.id };
}

export async function grantAccess(formData: FormData): Promise<ActionResult> {
  const gate = await ownerOnly();
  if (!gate.ok) return { ok: false, error: gate.error };

  const parsed = Grant.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  /* The person must already have an account. Looking them up through the
     directory rather than the admin API keeps this to one indexed query, and
     means the lookup obeys the same staff gate as everything else. */
  const { data: found } = await gate.supabase
    .rpc("staff_user_directory")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (!found) {
    return {
      ok: false,
      error:
        "Nobody has signed up with that email yet. Ask them to create an account first, then grant it.",
    };
  }

  const { error } = await gate.supabase.from("staff").upsert(
    {
      user_id: (found as { id: string }).id,
      role: parsed.data.role,
      note: parsed.data.note,
      added_by: gate.actorId,
    },
    { onConflict: "user_id" },
  );

  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

export async function changeRole(userId: string, role: string): Promise<ActionResult> {
  const gate = await ownerOnly();
  if (!gate.ok) return { ok: false, error: gate.error };

  if (!isStaffRole(role)) return { ok: false, error: "That is not one of the four roles." };
  if (userId === gate.actorId) {
    return { ok: false, error: "You cannot change your own role. Ask another owner." };
  }

  const { error } = await gate.supabase.from("staff").update({ role }).eq("user_id", userId);
  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

export async function revokeAccess(userId: string): Promise<ActionResult> {
  const gate = await ownerOnly();
  if (!gate.ok) return { ok: false, error: gate.error };

  if (userId === gate.actorId) {
    return { ok: false, error: "You cannot remove your own access. Ask another owner." };
  }

  const { error } = await gate.supabase.from("staff").delete().eq("user_id", userId);
  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}
