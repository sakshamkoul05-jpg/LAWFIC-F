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
 * On the storage shape: the card model is gone entirely, replaced by a leather
 * wallet (see lib/wallet-custom.tsx). The `hide`, `plate`, `thread` and
 * `nameplate` columns are added by 20260903090000_wallet_leather.sql in the
 * backend repo. Until that migration is applied the columns are absent, so
 * reads select everything and treat each as optional, and writes fall back to
 * the columns that do exist when Postgres reports an undefined one. The wallet
 * stays usable either way — losing a cosmetic preference must never break it.
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
    /* Rows written before the wallet still carry a card entity and finish.
       Neither maps onto a leather, so normalizePrefs falls back to the default
       hide rather than inventing a correspondence. The avatar survives. */
    normalizePrefs({
      hide: row.hide,
      plate: row.plate,
      thread: row.thread,
      nameplate: row.nameplate,
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
    /* `card_type` is the retired column, kept only so the write still works
       against a schema that has it NOT NULL. It is pinned to 'standard' rather
       than fed the hide: card_type predates every migration in the backend repo
       — the table was created outside them — so whether it still carries the
       old standard/premium/business/student/advocate CHECK is not knowable from
       source. Writing 'midnight' into a constrained column fails the whole
       upsert with 23514 and loses the customer's choices; 'standard' was that
       column's own default and is valid under any version of it. Nothing in
       this codebase reads the value. */
    card_type: "standard",
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase.from("wallet_prefs").upsert(
    {
      ...base,
      hide: prefs.hide,
      plate: prefs.plate,
      thread: prefs.thread,
      nameplate: prefs.nameplate,
    },
    { onConflict: "user_id" },
  );

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
