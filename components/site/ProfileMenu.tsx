"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * The account control at the far right.
 *
 * A link straight to /profile is fine until there are five things a signed-in
 * person might want from their account, at which point it is one destination
 * pretending to be a menu. Sign out in particular has nowhere else sensible to
 * live — burying it inside a profile page is a small hostility every site with
 * one eventually apologises for.
 *
 * Signed out it offers the two things that make sense and nothing else.
 */

type User = {
  email?: string;
  user_metadata?: Record<string, string>;
};

const SIGNED_IN = [
  { label: "Your profile", href: "/profile" },
  { label: "Your filings", href: "/orders" },
  { label: "Wallet", href: "/wallet" },
  { label: "Saved services", href: "/wishlist" },
  { label: "Statement", href: "/wallet/transactions" },
];

export default function ProfileMenu({
  user,
  onSignInClick,
}: {
  user: User | null;
  onSignInClick?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Account";
  const firstName = displayName.split(" ")[0];

  const signOut = async () => {
    const supabase = createClient();
    await supabase?.auth.signOut();
    setOpen(false);
    window.location.href = "/";
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => (user ? setOpen((v) => !v) : onSignInClick?.())}
        aria-expanded={user ? open : undefined}
        aria-haspopup={user ? "menu" : undefined}
        aria-label={user ? "Your account" : "Sign in"}
        className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5 transition-colors hover:border-border-3"
      >
        <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-background">
          {user ? displayName.charAt(0).toUpperCase() : "?"}
        </span>
        <span className="hidden max-w-[12ch] truncate text-[13px] text-foreground sm:block">
          {user ? firstName : "Sign in"}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className="hidden sm:block">
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      {user && open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.5)]"
        >
          <p className="truncate px-4 pb-2 pt-1 text-[11px] text-subtle">{user.email}</p>
          {SIGNED_IN.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-[13px] text-foreground transition-colors hover:bg-surface-2"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="mt-1 block w-full border-t border-border px-4 py-2.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
