"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { describeWriteError, staffClient, type ActionResult } from "@/lib/admin-gate";

/**
 * The service catalogue, edited from the back office.
 *
 * WHAT A CATEGORY CHANGE TOUCHES
 *
 * More than this page. The catalogue drives the mega-menu, the footer's
 * service columns, the home page's category grid, the header search index and
 * the knowledge Panda AI answers from. So every write revalidates the whole
 * site rather than just /admin/categories — a category renamed here and still
 * showing its old name in the menu is worse than one that was never renamed.
 *
 * DELETING IS REAL
 *
 * Removing a category removes the services inside it, by the cascade on the
 * foreign key. That is the right behaviour — a service with no category has
 * nowhere to be listed — but it is why the UI asks twice and why this action
 * reports how many services went with it.
 */

const ID = z
  .string()
  .trim()
  .min(2, "An id is needed.")
  .max(40)
  .regex(
    /^[a-z0-9-]+$/,
    "The id can use lowercase letters, numbers and hyphens only — it becomes part of a URL.",
  );

const CategoryFields = z.object({
  name: z.string().trim().min(1, "The category needs a name.").max(60),
  summary: z.string().trim().max(160).default(""),
  icon: z.string().trim().min(1).max(40).default("business"),
});

const ServiceFields = z.object({
  slug: ID,
  name: z.string().trim().min(1, "The service needs a name.").max(80),
  blurb: z.string().trim().max(160).default(""),
  status: z.enum(["live", "soon"]),
  /* Comma separated in the form, an array in the column. Aliases are what let
     somebody find "pvt ltd" when the catalogue calls it "Private Limited". */
  aliases: z.string().trim().default(""),
});

/** The catalogue is on nearly every page, so nearly every page is stale. */
function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const id = ID.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: id.error.issues[0]!.message };

  const parsed = CategoryFields.safeParse({
    name: formData.get("name"),
    summary: formData.get("summary") ?? "",
    icon: formData.get("icon") ?? "business",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  /* New categories go to the end. Sorting them into place is a separate,
     deliberate act — see moveCategory. */
  const { data: last } = await gate.supabase
    .from("categories")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await gate.supabase.from("categories").insert({
    id: id.data,
    ...parsed.data,
    position: ((last?.position as number | undefined) ?? 0) + 1,
    is_live: false,
  });

  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

export async function saveCategory(id: string, formData: FormData): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const parsed = CategoryFields.safeParse({
    name: formData.get("name"),
    summary: formData.get("summary") ?? "",
    icon: formData.get("icon") ?? "business",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  const { error } = await gate.supabase.from("categories").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

/**
 * On or off.
 *
 * `next` is passed in rather than read here and flipped. Read-then-write is
 * two round trips with a gap in the middle, and two agents on the same row
 * would each read the old value and write the same new one.
 */
export async function setCategoryLive(id: string, next: boolean): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { error } = await gate.supabase
    .from("categories")
    .update({ is_live: next })
    .eq("id", id);

  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  /* Counted before the delete so the caller can be told what went. After the
     cascade there is nothing left to count. */
  const { count } = await gate.supabase
    .from("category_services")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  const { error } = await gate.supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: describeWriteError(error.message) };

  refresh();
  return count && count > 0
    ? { ok: false, error: `Removed, along with ${count} service${count === 1 ? "" : "s"} inside it.` }
    : { ok: true };
}

/** Swap this row's position with its neighbour's. */
export async function moveCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { data: rows } = await gate.supabase
    .from("categories")
    .select("id, position")
    .order("position");

  if (!rows) return { ok: false, error: "Could not read the order." };

  const index = rows.findIndex((r) => r.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= rows.length) return { ok: true };

  const a = rows[index]!;
  const b = rows[swapWith]!;

  /* Two updates, not a transaction. Worst case is two rows sharing a position,
     which sorts by id and looks like nothing happened — recoverable by
     pressing the button again, unlike a half-applied reorder. */
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    gate.supabase.from("categories").update({ position: b.position }).eq("id", a.id),
    gate.supabase.from("categories").update({ position: a.position }).eq("id", b.id),
  ]);

  if (e1 || e2) return { ok: false, error: describeWriteError((e1 ?? e2)!.message) };
  refresh();
  return { ok: true };
}

/* ── The services inside a category ───────────────────────────────────── */

export async function createService(categoryId: string, formData: FormData): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const parsed = ServiceFields.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    blurb: formData.get("blurb") ?? "",
    status: formData.get("status") ?? "soon",
    aliases: formData.get("aliases") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  const { data: last } = await gate.supabase
    .from("category_services")
    .select("position")
    .eq("category_id", categoryId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await gate.supabase.from("category_services").insert({
    category_id: categoryId,
    slug: parsed.data.slug,
    name: parsed.data.name,
    blurb: parsed.data.blurb,
    status: parsed.data.status,
    aliases: splitAliases(parsed.data.aliases),
    position: ((last?.position as number | undefined) ?? 0) + 1,
  });

  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

export async function saveService(id: string, formData: FormData): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const parsed = ServiceFields.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    blurb: formData.get("blurb") ?? "",
    status: formData.get("status") ?? "soon",
    aliases: formData.get("aliases") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  const { error } = await gate.supabase
    .from("category_services")
    .update({
      slug: parsed.data.slug,
      name: parsed.data.name,
      blurb: parsed.data.blurb,
      status: parsed.data.status,
      aliases: splitAliases(parsed.data.aliases),
    })
    .eq("id", id);

  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

export async function deleteService(id: string): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { error } = await gate.supabase.from("category_services").delete().eq("id", id);
  if (error) return { ok: false, error: describeWriteError(error.message) };
  refresh();
  return { ok: true };
}

/** "udyog aadhaar, pvt ltd , 49a" -> three clean entries, no blanks. */
function splitAliases(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Import the twenty-one categories compiled into the build.
 *
 * WHY THIS IS A BUTTON AND NOT A SEED SCRIPT
 *
 * A script would need a TypeScript runner to read lib/catalogue.ts, a service
 * key on somebody's laptop, and a person who knows to run it. This runs with
 * the staff session that is already signed in, from the page where the absence
 * of categories is visible.
 *
 * IT DOES NOT OVERWRITE
 *
 * Existing ids are skipped rather than updated. Somebody who has spent an hour
 * editing a category should not lose it because a colleague pressed Import —
 * so the worst this can do is add back a category that was deleted on purpose,
 * which is visible and one click to remove.
 *
 * Everything arrives switched off, for the same reason new categories do.
 */
export async function importCompiledCatalogue(): Promise<ActionResult> {
  const gate = await staffClient();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { categories } = await import("@/lib/catalogue");

  const { data: existing } = await gate.supabase.from("categories").select("id");
  const have = new Set((existing ?? []).map((r) => r.id as string));

  const toAdd = categories.filter((c) => !have.has(c.id));
  if (toAdd.length === 0) return { ok: false, error: "Everything compiled in is already here." };

  const { error: catError } = await gate.supabase.from("categories").insert(
    toAdd.map((c, i) => ({
      id: c.id,
      name: c.name,
      summary: c.summary,
      icon: c.icon,
      position: have.size + i + 1,
      is_live: false,
    })),
  );
  if (catError) return { ok: false, error: describeWriteError(catError.message) };

  /* One insert for every service across every new category, not one per
     category: twenty-one round trips to do what one does. */
  const services = toAdd.flatMap((c) =>
    c.services.map((s, i) => ({
      category_id: c.id,
      slug: s.slug,
      name: s.name,
      blurb: s.blurb,
      status: s.status,
      aliases: s.aliases ?? [],
      position: i + 1,
    })),
  );

  if (services.length > 0) {
    const { error: svcError } = await gate.supabase.from("category_services").insert(services);
    if (svcError) return { ok: false, error: describeWriteError(svcError.message) };
  }

  refresh();
  return { ok: true };
}
