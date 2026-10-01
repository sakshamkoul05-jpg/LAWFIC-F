"use client";

import { useEffect, useState } from "react";
import ProfileMenu from "@/components/site/ProfileMenu";
import WalletAvatar from "@/components/wallet/WalletAvatar";
import { useAvatarUrl } from "@/components/profile/useAvatarUrl";
import { usePreferencesValue } from "@/components/account/usePreferences";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useProfile } from "@/components/profile/ProfileProvider";

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
  const { profile } = useProfile();

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  const name =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    null;

  const seed = name ?? "guest";


  /* The customer's own photograph, when they have uploaded one. The generated
     avatar stays as the fallback rather than a grey silhouette — but a real
     face beats a generated one every time, and somebody who has gone to the
     trouble of taking a photo should see it wherever they see themselves. */
  const photo = useAvatarUrl(Boolean(user));

  /* The sheet: "Very Good Morning" over the customer's full name ("Dr.
     Aarti Chopra"), beside a larger photo, with the smiley under them. */
  const fullName = profile?.fullName?.trim() || name || tx("User");

  /* The sheet's corner: the photo centred, the salutation on one line under
     it, and the two-line account menu beside the pair. */
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="flex flex-col items-center gap-1">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- a signed URL
          // that expires; the optimizer would cache it past its own lifetime.
          <img
            src={photo}
            alt=""
            width={40}
            height={40}
            className="h-[40px] w-[40px] shrink-0 rounded-full object-cover ring-1 ring-[color:var(--border-2)]"
          />
        ) : (
          <WalletAvatar seed={seed} size={40} />
        )}

        {greeting && privacy.showName && (
          <span className="hidden max-w-[240px] items-center gap-1 whitespace-nowrap text-[11.5px] leading-none text-foreground lg:flex">
            <span className="font-medium">
              {tx("Very")} {tx(greeting)},
            </span>
            <span className="home-serif truncate font-bold">{fullName}</span>
            <span aria-hidden className="text-[13px]">{GREETING_EMOJI}</span>
          </span>
        )}
      </div>

      <ProfileMenu user={user} onSignInClick={onSignInClick} />
    </div>
  );
}
