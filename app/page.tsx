import { Suspense } from "react";
import Home from "./Home";
import { createClient } from "@/lib/supabase/server";
import { liveBanners } from "@/lib/promotions-db";

/**
 * The one server boundary above the home page, and therefore where the
 * promotional banners are read.
 *
 * Everything below this is a client component — the profile, the preferences
 * and the carousel all need browser state — so the rows have to be fetched
 * here and handed down as a prop. Fetching them further in would mean the
 * hero, which is the first thing on the page, sitting blank for a round trip
 * on every visit.
 *
 * `liveBanners` falls back to the compiled list if the read fails, so a
 * missing database is a stale headline rather than an empty band. RLS decides
 * what "live" means — the public policy only returns rows that are switched on
 * and inside their scheduling window.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { banners } = await liveBanners(supabase);

  return (
    <Suspense>
      <Home banners={banners} />
    </Suspense>
  );
}
