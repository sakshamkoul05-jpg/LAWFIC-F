"use client";

import ClassicHomePage from "@/components/classic/ClassicHomePage";
import PersonalizedHero from "@/components/classic/PersonalizedHero";
import TrackRecommendations from "@/components/classic/TrackRecommendations";
import { useProfile } from "@/components/profile/ProfileProvider";

/**
 * The home page always renders the Classic layout. When the reader is signed
 * in and has finished onboarding, a personalised hero is layered on top.
 *
 * The profile comes from the shared provider rather than a fetch of its own —
 * this component, the job feed and the recommendations used to request it
 * separately, so the page made three identical round trips before it could
 * decide what to show.
 */
export default function Home() {
  const { profile, personalised } = useProfile();

  return (
    <>
      {personalised && profile && <PersonalizedHero profile={profile} />}
      <TrackRecommendations />
      <ClassicHomePage />
    </>
  );
}
