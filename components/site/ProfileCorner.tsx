"use client";

import { useEffect, useState } from "react";
import ProfileMenu from "@/components/site/ProfileMenu";
import WalletAvatar from "@/components/wallet/WalletAvatar";
import { usePreferencesValue } from "@/components/account/usePreferences";
import { useLocale } from "@/components/i18n/LocaleProvider";

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

/* One smiley for all five, not a sun and a moon and a dusk.
   The words already say which part of the day it is; a second glyph saying the
   same thing is redundant, and the client asked for a smiley — which does the
   job the emoji is actually there for, which is warmth, not information. */
const GREETING_EMOJI = "😊";

function greetingFor(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
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
  const [greeting, setGreeting] = useState<string | null>(null);
  const { tx } = useLocale();
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

  /* A GUEST IS ADDRESSED TOO.
     Signed out this read "Good morning 😊" — a greeting with nobody in it,
     which looks less like a choice than like a name that failed to load. So a
     visitor with no account is "User": the sentence has the same shape whoever
     is reading it, and it fills in with the real first name the moment there
     is one. */
  const addressee = name ? name.split(" ")[0] : tx("User");

  return (
    <div className="flex shrink-0 items-start gap-1.5">
      <div className="flex flex-col items-center gap-1">
        <WalletAvatar seed={seed} size={34} />

        {/* Reserved height even before the greeting resolves, so the header
            does not jolt a few milliseconds after it paints. */}
        <span className="hidden h-[14px] items-center gap-1 whitespace-nowrap text-[11px] leading-none text-muted-foreground lg:flex">
          {greeting && privacy.showName && (
            <span>
              {/* "Good morning Saksham 😊", or "Good morning User 😊" before
                  anyone has signed in. The first name only, and no comma: a
                  comma turns a greeting into the salutation on a letter, and
                  the first name is what a person is called rather than what
                  their account happens to be registered as. */}
              {tx(greeting)} {addressee} <span aria-hidden>{GREETING_EMOJI}</span>
            </span>
          )}
        </span>
      </div>

      <ProfileMenu user={user} onSignInClick={onSignInClick} />
    </div>
  );
}
