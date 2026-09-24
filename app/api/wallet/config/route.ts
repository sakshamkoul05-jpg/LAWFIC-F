import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  configFromRow,
  configToRow,
  normalizeConfig,
  normalizeEngraving,
} from "@/lib/wallet3d/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A customer's wallet appearance: finish, colour, stamping, stitch, note style
 * and engraving.
 *
 * WHY THIS IS A ROUTE AND NOT LOCALSTORAGE ANY MORE
 *
 * It was localStorage while the object was being redesigned, which meant the
 * wallet quietly reverted to the factory finish on every new device, every
 * private window and every cleared cache — and the page meanwhile promised
 * "sign in to keep the material, colour and engraving you choose". This keeps
 * that promise. See 20260922080000_wallet_config.sql.
 *
 * This is now the only route that describes the wallet. /api/wallet/prefs and
 * the customise screen it fed served the retired bifold and have been removed
 * with it. The wallet page server-renders the config from the row it already
 * reads, so in practice this GET is only hit by screens that mount without one.
 *
 * Anon key, RLS decides. Cosmetic only — nothing here touches a balance, the
 * ledger or an order.
 */

/** Postgres/PostgREST codes for "that column isn't there". */
const MISSING_COLUMN = new Set(["42703", "PGRST204"]);

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const { data, error } = await supabase
    .from("wallet_prefs")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  /* A project without the migration returns the row minus those columns, and
     configFromRow reads that as the default — which is what the customer was
     already seeing. Worth a log, not worth a 500. */
  if (error && !MISSING_COLUMN.has(error.code)) {
    console.error("[wallet/config] read failed", error);
  }

  return NextResponse.json(configFromRow(data as Record<string, unknown> | null));
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

  const engraving = normalizeEngraving((body as { engraving?: unknown } | null)?.engraving);
  const config = normalizeConfig(body, engraving);

  const base = {
    user_id: auth.user.id,
    nameplate: config.engraving,
    /* card_type is the retired column, pinned to its own default so the upsert
       still satisfies it on a schema where it is NOT NULL and constrained.
       Nothing reads the value. The same reasoning as in ../prefs/route.ts. */
    card_type: "standard",
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from("wallet_prefs")
    .upsert({ ...base, ...configToRow(config) }, { onConflict: "user_id" });

  if (error && MISSING_COLUMN.has(error.code)) {
    /* The migration has not been applied on this project yet. Save the
       engraving, which has a column, rather than losing the whole request —
       and say so in the response so the client knows the finish did not
       survive and can keep showing it from its own cache. */
    ({ error } = await supabase.from("wallet_prefs").upsert(base, { onConflict: "user_id" }));
    if (!error) {
      console.warn(
        "[wallet/config] wallet_config migration not applied — finish not saved, engraving was",
      );
      return NextResponse.json({ ...config, persisted: false });
    }
  }

  if (error) {
    console.error("[wallet/config] upsert failed", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ...config, persisted: true });
}
