"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TONES } from "@/lib/promotional";

/**
 * Banner edits from the back office.
 *
 * EVERY ACTION RE-CHECKS `is_staff()`
 *
 * A server action is a public endpoint with a generated name. It is not
 * protected by the page that renders the form, and an action that trusts the
 * page to have gated it is an action anybody can POST to. RLS refuses the
 * write regardless — the promotions policies require `is_staff()` — but the
 * check is here as well so the answer is an honest error rather than a
 * confusing empty result, and so removing a policy by accident does not
 * silently open a door.
 *
 * WHAT IS NOT EDITABLE HERE
 *
 * The tone list and the drawn motifs. `tone` is validated against the keys of
 * TONES, so a form cannot introduce a colour the rest of the site does not
 * use; the palette is a designed set and belongs in the code with the rest of
 * the design system.
 */

type Result = { ok: true } | { ok: false; error: string };

const TONE_KEYS = Object.keys(TONES) as [string, ...string[]];

/* Lengths mirror the database's check constraints. Two places, deliberately:
   the constraint is the guarantee and this is the message. A form that only
   relied on the constraint would show a Postgres error to a marketing
   assistant. */
const Fields = z.object({
  eyebrow: z.string().trim().min(1, "The eyebrow cannot be blank.").max(40),
  title: z.string().trim().min(1, "The headline cannot be blank.").max(70),
  body: z.string().trim().min(1, "The supporting line cannot be blank.").max(200),
  cta_label: z.string().trim().min(1, "The button needs a label.").max(40),
  href: z
    .string()
    .trim()
    .regex(
      /^\/[A-Za-z0-9/_#?=&.-]*$/,
      "The link must be a path on this site, starting with a slash.",
    ),
  tone: z.enum(TONE_KEYS),
});

/** Either a client that has proved it belongs to staff, or the reason it did
    not. An explicit union so `"error" in gate` narrows to a defined string
    rather than to `string | undefined`. */
type Gate =
  | { supabase: SupabaseClient }
  | { error: string };

async function staffClient(): Promise<Gate> {
  const supabase = await createClient();
  if (!supabase) return { error: "No database is configured for this build." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in first." };

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) return { error: "This is a staff-only action." };

  return { supabase };
}

/** Everything that changed has to show up on the home page, not just here. */
function refresh() {
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function saveBanner(id: string, formData: FormData): Promise<Result> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const parsed = Fields.safeParse({
    eyebrow: formData.get("eyebrow"),
    title: formData.get("title"),
    body: formData.get("body"),
    cta_label: formData.get("cta_label"),
    href: formData.get("href"),
    tone: formData.get("tone"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const { error } = await gate.supabase
    .from("promotions")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/**
 * On or off.
 *
 * `next` is passed in rather than read and flipped here. Reading then writing
 * is two round trips with a gap in the middle, and two agents on the same
 * banner would race — the second one's click would toggle back what it had
 * just seen. Sending the intended state means the last click wins, which is
 * what a toggle should do.
 */
export async function setBannerLive(id: string, next: boolean): Promise<Result> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { error } = await gate.supabase
    .from("promotions")
    .update({ is_live: next })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/**
 * Move one banner up or down.
 *
 * Swaps the two positions rather than renumbering the list. `position` is not
 * unique by design, so a swap is two independent writes and a failure between
 * them leaves two banners sharing a slot — untidy, ordered by id, and nobody's
 * carousel is broken. Renumbering every row on every move would make the same
 * failure leave gaps and duplicates across the whole list.
 */
export async function moveBanner(id: string, direction: "up" | "down"): Promise<Result> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { data: rows, error: readError } = await gate.supabase
    .from("promotions")
    .select("id, position")
    .order("position", { ascending: true });

  if (readError) return { ok: false, error: readError.message };

  const list = (rows ?? []) as { id: string; position: number }[];
  const index = list.findIndex((r) => r.id === id);
  if (index < 0) return { ok: false, error: "That banner no longer exists." };

  const swapWith = direction === "up" ? index - 1 : index + 1;
  /* Already at the end. Not an error — the button is just a no-op there, and
     saying "cannot move up" about the first item tells somebody what they can
     already see. */
  if (swapWith < 0 || swapWith >= list.length) return { ok: true };

  const a = list[index];
  const b = list[swapWith];

  const first = await gate.supabase
    .from("promotions")
    .update({ position: b.position })
    .eq("id", a.id);
  if (first.error) return { ok: false, error: first.error.message };

  const second = await gate.supabase
    .from("promotions")
    .update({ position: a.position })
    .eq("id", b.id);
  if (second.error) return { ok: false, error: second.error.message };

  refresh();
  return { ok: true };
}
