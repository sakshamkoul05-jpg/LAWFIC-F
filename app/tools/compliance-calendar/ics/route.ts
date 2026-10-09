import { buildCalendar, ENTITY_LABELS, profileFromParams, todayIST } from "@/lib/compliance/calendar";
import { toIcs } from "@/lib/compliance/ics";
import { SITE_URL } from "@/lib/seo";

/**
 * The calendar as a subscribable .ics feed.
 *
 * Calendar apps fetch this with no cookies, so it cannot depend on a session.
 * Everything it needs is in the query string — five choices and a state code,
 * no name, no PAN, nothing personal — which is also why it can be public.
 * Calendar clients re-poll roughly daily, so a CDN cache of six hours keeps
 * the load trivial while a notified extension still shows up the same day.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const profile = profileFromParams((k) => url.searchParams.get(k));
  const events = buildCalendar(profile, todayIST(), { back: 60, ahead: 400 });
  const body = toIcs(events, {
    name: `LAWFIC — ${ENTITY_LABELS[profile.entity]} compliance`,
    siteUrl: SITE_URL,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="lawfic-compliance.ics"',
      "Cache-Control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
