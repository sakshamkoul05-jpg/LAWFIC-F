"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isCompleteProfile, type UserProfile } from "@/lib/profile";

/**
 * The signed-in customer's profile, loaded once and shared by the whole site.
 *
 * Before this, three separate components each fetched /api/profile on their
 * own — the home page, the job feed and the track recommendations — so the
 * home page made three identical round trips, and any page that was not one of
 * those three had no way to know who was reading it. Personalisation could
 * only ever exist where somebody had remembered to add another fetch.
 *
 * Mounted once in ThemeShell, so every page can ask. `useProfile()` returns
 * null while loading and for signed-out visitors alike, which is deliberate:
 * a personalised element should render nothing rather than a skeleton that
 * flashes and then disappears for the majority who are not signed in.
 */

type ProfileState = {
  profile: UserProfile | null;
  /** True once the fetch has settled, however it settled. */
  ready: boolean;
  /** Complete enough to personalise with — a name, and at least one interest. */
  personalised: boolean;
  refresh: () => void;
};

const ProfileContext = createContext<ProfileState>({
  profile: null,
  ready: false,
  personalised: false,
  refresh: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        setProfile(data && data.fullName ? (data as UserProfile) : null);
      })
      .catch(() => {
        /* Signed out, offline, or the profile has never been filled in. None
           of those are errors worth showing — the site simply stays generic. */
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [nonce]);

  const value = useMemo<ProfileState>(
    () => ({
      profile,
      ready,
      personalised: Boolean(profile && isCompleteProfile(profile)),
      refresh: () => setNonce((n) => n + 1),
    }),
    [profile, ready],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileState {
  return useContext(ProfileContext);
}

/** The name to greet someone by. Empty when we should not greet at all. */
export function useFirstName(): string {
  const { profile } = useProfile();
  return profile?.fullName?.trim().split(" ")[0] ?? "";
}
