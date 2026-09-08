import { createClient } from "@/lib/supabase/server";
import { statementCsv, statementFilename } from "@/lib/statement";
import type { WalletEntry } from "@/lib/wallet-entries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Download Wallet Statement" — the whole ledger, as a CSV.
 *
 * A ROUTE RATHER THAN A BUTTON THAT BUILDS THE FILE IN THE PAGE
 *
 * The transactions screen holds the fifty most recent entries, because that is
 * what a person reads. A statement that quietly stopped at fifty would be worse
 * than no statement at all — someone reconciling a year against their books
 * would find the totals disagree and have no way to tell why. The route queries
 * for itself, so what downloads is the account rather than the current page.
 *
 * SECURITY IS THE SAME SHAPE AS EVERY OTHER WALLET READ
 *
 * Anon key plus row-level security: the session decides whose rows come back,
 * and there is no user id in the request for anyone to change. The one thing
 * this route must never do is accept an id and trust it, which is how a
 * statement endpoint turns into a way to read somebody else's money.
 *
 * `no-store`, because a statement is personal and must not sit in a shared
 * cache; `attachment`, so a browser saves it instead of rendering CSV as text.
 */
export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return new Response("The wallet is not connected yet.", { status: 503 });
  }

  const { data: auth } = await supabase.auth
    .getUser()
    .catch(() => ({ data: { user: null } }));
  if (!auth?.user) {
    return new Response("Sign in to download your statement.", { status: 401 });
  }

  const { data, error } = await supabase
    .from("wallet_entries")
    .select("id, direction, amount_paise, reason, created_at, razorpay_payment_id, order_id")
    .order("seq", { ascending: false })
    /* Well past any real account, and a bound rather than none: an unbounded
       select on a money table is how one customer's download becomes everyone
       else's slow afternoon. */
    .limit(5000);

  if (error) {
    return new Response("Could not read your statement.", { status: 500 });
  }

  const csv = statementCsv((data ?? []) as WalletEntry[]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${statementFilename()}"`,
      "Cache-Control": "no-store, private",
    },
  });
}
