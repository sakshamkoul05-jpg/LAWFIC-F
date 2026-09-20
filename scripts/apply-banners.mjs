import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

/**
 * Point the promotions table at the drawn banners.
 *
 * WHY THIS SCRIPT EXISTS AT ALL
 *
 * The home page reads its banners from the `promotions` table, not from
 * lib/promotional.ts — that list is only the fallback for when the read fails.
 * Editing the file therefore changes nothing in production, which is exactly
 * the trap this project already fell into: the photographs were wired in code,
 * verified locally where the database read fails and the fallback is what
 * renders, and shipped to a production site that showed plain colour blocks.
 *
 * So the file and the table are updated together, and this is the half that
 * touches the table.
 *
 * It OVERWRITES existing photo values. That is deliberate and different from
 * the first pass, which skipped rows that already had one: those rows point at
 * stock photographs that have since been deleted from the repository, so
 * leaving them alone would leave production requesting files that are gone.
 *
 * Run with:
 *   node --env-file=.env.local scripts/apply-banners.mjs
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  console.error("Run with: node --env-file=.env.local scripts/apply-banners.mjs");
  process.exit(1);
}

const manifest = JSON.parse(await readFile("public/banners/MANIFEST.json", "utf8"));
const byPosition = new Map(manifest.map((m) => [m.position, m]));

const supabase = createClient(url, key);

const { data: rows, error } = await supabase
  .from("promotions")
  .select("id, position, photo")
  .order("position");

if (error) {
  console.error("could not read promotions:", error.message);
  process.exit(1);
}

let changed = 0;
for (const row of rows) {
  const wanted = byPosition.get(row.position);
  if (!wanted) {
    console.log(`position ${row.position} — no banner drawn for it, left alone`);
    continue;
  }
  if (row.photo === wanted.photo) {
    console.log(`position ${row.position} — already ${wanted.photo}`);
    continue;
  }
  const { error: updateError } = await supabase
    .from("promotions")
    .update({ photo: wanted.photo, photo_alt: wanted.photo_alt })
    .eq("id", row.id);

  if (updateError) console.error(`position ${row.position} FAILED: ${updateError.message}`);
  else {
    console.log(`position ${row.position} ${row.photo ?? "(none)"} -> ${wanted.photo}`);
    changed++;
  }
}

console.log(`\n${changed} row(s) updated.`);
