"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { describeWriteError, staffClient, type ActionResult } from "@/lib/admin-gate";

/**
 * Job postings from the back office.
 *
 * MONEY IS PAISE HERE TOO
 *
 * The form takes rupees because that is what somebody types; the column is
 * paise because that is what every other money column in this schema holds.
 * The conversion happens once, on the way in. A schema with two money units in
 * it is a schema that will eventually add them together.
 *
 * A BLANK SALARY IS NOT ZERO
 *
 * "Not disclosed" and "unpaid" are different claims and an empty field must
 * not become the second one. Empty parses to null.
 */

const optionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? v : null));

/** Rupees in the form, paise in the column, null when left blank. */
const rupees = z
  .string()
  .trim()
  .optional()
  .transform((v) => {
    if (!v) return null;
    const n = Number(v.replace(/[, ]/g, ""));
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  });

const Fields = z.object({
  title: z.string().trim().min(1, "The posting needs a title.").max(120),
  employer: z.string().trim().max(120).default(""),
  city: z.string().trim().max(80).default(""),
  state: z.string().trim().max(80).default(""),
  employment_type: z.string().trim().min(1).max(40).default("Full time"),
  category: z.string().trim().max(60).default(""),
  description: z.string().trim().max(4000).default(""),
  apply_url: optionalText,
  apply_email: optionalText,
  salary_min_paise: rupees,
  salary_max_paise: rupees,
  /* datetime-local gives "2026-10-01T09:00" with no zone. Empty means it runs
     until somebody switches it off, which is different from expiring now. */
  expires_at: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? new Date(v).toISOString() : null)),
});

function parse(formData: FormData) {
  return Fields.safeParse({
    title: formData.get("title"),
    employer: formData.get("employer") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    employment_type: formData.get("employment_type") || "Full time",
    category: formData.get("category") ?? "",
    description: formData.get("description") ?? "",
    apply_url: formData.get("apply_url") ?? undefined,
    apply_email: formData.get("apply_email") ?? undefined,
    salary_min_paise: formData.get("salary_min") ?? undefined,
    salary_max_paise: formData.get("salary_max") ?? undefined,
    expires_at: formData.get("expires_at") ?? undefined,
  });
}

function refresh() {
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
}

export async function createJob(formData: FormData): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  /* Off by default. A posting reaches jobseekers when somebody decides it is
     finished, not when its title is typed. */
  const { error } = await gate.supabase
    .from("jobs")
    .insert({ ...parsed.data, is_live: false });

  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

export async function saveJob(id: string, formData: FormData): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  const { error } = await gate.supabase.from("jobs").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

/**
 * On or off.
 *
 * A posting with no way to apply cannot go live: a jobseeker reading it would
 * have nothing to do next, which wastes the one thing they came for. The check
 * is here rather than in the database because a DRAFT is allowed to be
 * incomplete — that is what a draft is.
 */
export async function setJobLive(id: string, next: boolean): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  if (next) {
    const { data: job } = await gate.supabase
      .from("jobs")
      .select("apply_url, apply_email")
      .eq("id", id)
      .maybeSingle();

    if (job && !job.apply_url && !job.apply_email) {
      return {
        ok: false,
        error: "Add a link or an email to apply to before publishing this.",
      };
    }
  }

  const { error } = await gate.supabase.from("jobs").update({ is_live: next }).eq("id", id);
  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

export async function deleteJob(id: string): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { error } = await gate.supabase.from("jobs").delete().eq("id", id);
  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}
