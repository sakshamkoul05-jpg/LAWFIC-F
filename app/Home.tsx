"use client";

import { useEffect, useState } from "react";
import ClassicHomePage from "@/components/classic/ClassicHomePage";
import PersonalizedHero from "@/components/classic/PersonalizedHero";
import { isCompleteProfile, type UserProfile } from "@/lib/profile";

/**
 * The homepage now always renders the Classic (client-approved) layout.
 * When the user is signed in and has completed onboarding, a personalised
 * hero banner is layered on top that greets them by name and surfaces the
 * fastest routes for their exam/job track.
 */
export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive && data && isCompleteProfile(data)) setProfile(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {profile && <PersonalizedHero profile={profile} />}
      <ClassicHomePage />
    </>
  );
}