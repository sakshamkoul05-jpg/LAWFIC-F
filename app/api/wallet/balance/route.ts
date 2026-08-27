import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The signed-in user's balance. Read through the anon key so RLS decides what
 * is visible — a user can never poll someone else's wallet.
 *
 * Exists so the page can wait for the webhook after Checkout closes. The
 * browser learns the balance moved; it never gets to say so.
 */
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const { data, error } = await supabase.rpc("my_wallet_balance");
  if (error) {
    console.error("[wallet/balance] rpc failed", error);
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }

  return NextResponse.json({ balancePaise: Number(data ?? 0) });
}
