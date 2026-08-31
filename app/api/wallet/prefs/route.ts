import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizePrefs, DEFAULT_PREFS, type WalletPrefs } from "@/lib/wallet-custom";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read and write a user's wallet card preferences (skin + flairs).
 *
 * Uses the anon key and lets RLS decide — a user can never read or write
 * anyone else's row. Cosmetic data only; no money logic here.
 */
async function getPrefs(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, userId: string) {
  const { data } = await supabase
    .from("wallet_prefs")
    .select("skin, flairs, avatar")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_PREFS;
  const normalized = normalizePrefs(data);
  return normalized ?? DEFAULT_PREFS;
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

  const { error } = await supabase.from("wallet_prefs").upsert(
    {
      user_id: auth.user.id,
      skin: prefs.skin,
      flairs: prefs.flairs,
      avatar: prefs.avatar,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[wallet/prefs] upsert failed", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json(prefs as WalletPrefs);
}
