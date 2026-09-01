"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPaise } from "@/lib/money";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

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
        className="rounded-full bg-primary px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/wallet"
        className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary"
      >
        <span className="size-1.5 rounded-full bg-success" aria-hidden />
        <span className="type-label hidden sm:inline">Wallet</span>
        <span className="type-data text-[11px] text-foreground">
          {balance === null ? "—" : formatPaise(balance)}
        </span>
      </Link>

      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-full border border-border px-3 py-1.5 text-[11px] text-muted transition-colors hover:text-foreground"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
