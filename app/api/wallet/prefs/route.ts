import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizePrefs, DEFAULT_PREFS, type WalletPrefs } from "@/lib/wallet-custom";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read and write a customer's wallet card preferences.
 *
 * Uses the anon key and lets RLS decide — nobody can read or write anyone
 * else's row. Cosmetic data only; no money logic here.
 *
 * On the storage shape: the card model moved from a single `card_type` to an
 * `entity` and a `finish` (see lib/wallet-custom.tsx). The `entity` column is
 * added by 20260902090000_wallet_card_identity.sql in the backend repo. Until
 * that migration is applied to a given project the column is absent, so reads
 * select everything and treat it as optional, and writes fall back to the old
 * shape when Postgres reports an undefined column. The card stays usable
 * either way — losing a cosmetic preference must never break the wallet.
 */

/** Postgres/PostgREST codes for "that column isn't there". */
const MISSING_COLUMN = new Set(["42703", "PGRST204"]);

async function getPrefs(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
) {
  const { data } = await supabase
    .from("wallet_prefs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_PREFS;

  const row = data as Record<string, unknown>;
  return (
    normalizePrefs({
      entity: row.entity,
      finish: row.finish ?? row.card_type,
      // Rows written before the change still carry a retired card type;
      // normalizePrefs maps it onto the closest finish.
      cardType: row.card_type,
      avatarSeed: row.avatar_seed,
    }) ?? DEFAULT_PREFS
  );
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const prefs = await getPrefs(supabase, auth.user.id);
  return NextResponse.json(prefs);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const prefs = normalizePrefs(body);
  if (!prefs) {
    return NextResponse.json({ error: "invalid_prefs" }, { status: 400 });
  }

  const base = {
    user_id: auth.user.id,
    avatar_seed: prefs.avatarSeed,
    // Kept in step with `finish` so a rollback, or an older deploy reading the
    // same row, still renders a sensible surface rather than nothing.
    card_type: prefs.finish,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from("wallet_prefs")
    .upsert({ ...base, entity: prefs.entity, finish: prefs.finish }, { onConflict: "user_id" });

  if (error && MISSING_COLUMN.has(error.code)) {
    // The identity migration has not been applied on this project yet. Save
    // what the schema can hold rather than failing the request outright.
    ({ error } = await supabase.from("wallet_prefs").upsert(base, { onConflict: "user_id" }));
  }

  if (error) {
    console.error("[wallet/prefs] upsert failed", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json(prefs as WalletPrefs);
}
