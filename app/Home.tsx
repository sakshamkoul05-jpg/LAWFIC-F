"use client";

import ClassicPromotionalBanners from "@/components/classic/ClassicPromotionalBanners";
import OfferPosters from "@/components/home/OfferPosters";
import WelcomeOffers from "@/components/home/WelcomeOffers";
import WhyChooseCards from "@/components/home/WhyChooseCards";
import LaunchAndSoon from "@/components/home/LaunchAndSoon";
import TrendingInLawfic from "@/components/classic/TrendingInLawfic";
import ServiceByCategory from "@/components/classic/ServiceByCategory";
import { usePreferencesValue } from "@/components/account/usePreferences";
import QuickActionsHomeTrigger from "@/components/quick-actions/QuickActionsHomeTrigger";
import type { Banner } from "@/lib/promotional";

/**
 * The home page always renders the Classic layout. When the reader is signed
 * in and has finished onboarding, a personalised hero is layered on top.
 *
 * The profile comes from the shared provider rather than a fetch of its own —
 * this component, the job feed and the recommendations used to request it
 * separately, so the page made three identical round trips before it could
 * decide what to show.
 */
/**
 * The home page, in the order of the client's "HOME PAGE SECTION FINAL" sheet.
 * The ticker, logo bar, search band and menu above this are drawn by the
 * shell (components/theme/ThemeShell.tsx); this is everything below them:
 *
 *   5  the eleven original flyers (carousel), then the coupon posters
 *   6  new-customer offer strip
 *   1  welcome by name + 5×5 offers + the fixed wallet card
 *   2  why choose LAWFIC               3  top twenty-one trending
 *   4  service explore by category     5  latest launch     6  coming soon
 *
 * The dashboard preference still decides which of the optional blocks a
 * signed-in customer sees.
 */
export default function Home({ banners }: { banners?: Banner[] }) {
  const { sections } = usePreferencesValue();

  return (
    <>
      {/* The site's own eleven flyers stay, untouched, above the coupon
          posters — the client's correction: the new posters were added
          under them, not in place of them. */}
      {sections.promotions && <ClassicPromotionalBanners banners={banners} />}
      {sections.promotions && <OfferPosters />}
      <WelcomeOffers />
      {sections.why && <WhyChooseCards />}
      {sections.trending && <TrendingInLawfic />}
      {sections.categories && <ServiceByCategory />}
      <LaunchAndSoon />
      {/* The client asked for the logo again, low on the home page, opening
          the same box. It is a trigger, not a second widget — see
          components/quick-actions/QuickActionsHomeTrigger.tsx. */}
      <QuickActionsHomeTrigger />
    </>
  );
}
