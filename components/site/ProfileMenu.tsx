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
      {/* A HAMBURGER, NOT A "SIGN IN" BUTTON.
          Signed out, this used to be a pill reading "Sign in" — a second call
          to action sitting in the corner of every page, competing with the one
          on the page itself and costing the search a hundred and forty pixels
          it needed more. Sign in is now an item INSIDE the menu, where the
          other account actions already were: one control in the corner, and it
          opens the same list whoever you are. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user ? "Your account" : "Account and sign in"}
        className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-border-3 hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M2.5 5h13M2.5 9h13M2.5 13h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.5)]"
        >
          {user ? (
            <p className="truncate px-4 pb-2 pt-1 text-[11px] text-subtle">{user.email}</p>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignInClick?.();
              }}
              className="block w-full px-4 py-2.5 text-left text-[13px] font-medium text-primary transition-colors hover:bg-surface-2"
            >
              Sign in or create an account
            </button>
          )}
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
          {user && (
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="mt-1 block w-full border-t border-border px-4 py-2.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
}
