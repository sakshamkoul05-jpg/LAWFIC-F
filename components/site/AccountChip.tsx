"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPaise } from "@/lib/money";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * The header's account state, resolved in the browser.
 *
 * Deliberately client-side: reading the session in the root layout would make
 * every page dynamic, including the marketing pages that should stay static.
 * The cost is a brief unauthenticated flash in the header, which is a fair
 * trade for keeping the front of the site on a CDN.
 */
export default function AccountChip() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSignedIn(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    let alive = true;

    const read = async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      const user = data.user ?? null;
      setSignedIn(Boolean(user));
      if (!user) {
        setBalance(null);
        return;
      }
      const { data: b } = await supabase.rpc("my_wallet_balance");
      if (alive) setBalance(Number(b ?? 0));
    };

    read();

    const { data: sub } = supabase.auth.onAuthStateChange(() => read());
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [pathname]);

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-brass-hi"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href="/wallet"
        className="flex items-center gap-2 rounded-full border border-line-2 bg-surface/60 px-3.5 py-1.5 transition-colors hover:border-brass-lo"
      >
        <span className="size-1.5 rounded-full bg-jade" aria-hidden />
        <span className="label hidden text-slate sm:inline">Wallet</span>
        <span className="font-mono text-xs text-bone tnum">
          {balance === null ? "—" : formatPaise(balance)}
        </span>
      </Link>

      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-full border border-line-2 px-3.5 py-1.5 text-[13px] text-ash transition-colors hover:border-line-3 hover:text-bone"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
