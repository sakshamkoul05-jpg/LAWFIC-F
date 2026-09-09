"use client";

import { useEffect, useState } from "react";
import ProfileMenu from "@/components/site/ProfileMenu";
import WalletAvatar from "@/components/wallet/WalletAvatar";
import { usePreferencesValue } from "@/components/account/usePreferences";

/**
 * The far-right corner: a face, the greeting under it, and the account menu.
 *
 * THE ORDER IS THE BLUEPRINT'S
 *
 * Photo on top, then "Good morning 👋 Name" beneath — HOM PA INS 5 in the
 * sheet, where it reads "Very Good Morning" over the customer's name. The
 * hamburger beside the photo is the way into the account, so the corner is one
 * block rather than a scattering of controls that happen to be near each other.
 *
 * TIME OF DAY IS DECIDED AFTER MOUNT
 *
 * The server has no idea what hour it is where the reader is sitting. Rendering
 * a greeting from server time means the markup says "Good evening", the browser
 * hydrates and says "Good morning", and React swaps the text — a mismatch that
 * shows as a flicker for most people and a console error for whoever debugs it
 * later. So it is empty until mounted and resolves once, in the reader's own
 * clock.
 *
 * A GUEST GETS A FACE TOO
 *
 * Not a grey silhouette: the same generated avatar everyone else has, seeded on
 * the word "guest". A placeholder that looks like a missing image tells a
 * visitor the site is half-built.
 *
 * The whole greeting can be switched off in account privacy — a name at the top
 * of every page is the one thing here that someone standing behind you can read
 * across a room.
 */

function greetingFor(hour: number): { text: string; emoji: string } {
  if (hour < 5) return { text: "Good night", emoji: "🌙" };
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (hour < 21) return { text: "Good evening", emoji: "🌆" };
  return { text: "Good night", emoji: "🌙" };
}

type User = {
  email?: string;
  phone?: string;
  user_metadata?: Record<string, string>;
};

export default function ProfileCorner({
  user,
  onSignInClick,
}: {
  user: User | null;
  onSignInClick?: () => void;
}) {
  const [greeting, setGreeting] = useState<{ text: string; emoji: string } | null>(null);
  const { privacy } = usePreferencesValue();

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  const name =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    null;

  const seed = name ?? "guest";

  return (
    <div className="flex shrink-0 items-start gap-1.5">
      <div className="flex flex-col items-center gap-1">
        <WalletAvatar seed={seed} size={34} />

        {/* Reserved height even before the greeting resolves, so the header
            does not jolt a few milliseconds after it paints. */}
        <span className="hidden h-[13px] items-center gap-1 whitespace-nowrap text-[10.5px] leading-none text-muted-foreground lg:flex">
          {greeting && privacy.showName && (
            <>
              <span aria-hidden>{greeting.emoji}</span>
              <span>
                {greeting.text}
                {name ? `, ${name.split(" ")[0]}` : ""}
              </span>
            </>
          )}
        </span>
      </div>

      <ProfileMenu user={user} onSignInClick={onSignInClick} />
    </div>
  );
}
