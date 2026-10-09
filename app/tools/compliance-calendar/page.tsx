import type { Metadata } from "next";
import Link from "next/link";
import {
  ENTITY_LABELS,
  buildCalendar,
  profileFromParams,
  profileToParams,
  todayIST,
} from "@/lib/compliance/calendar";
import { SITE_URL } from "@/lib/seo";
import { EventList } from "@/components/compliance/EventList";
import { ProfileFields } from "@/components/compliance/ProfileFields";
import { ButtonLink, Card, Disclaimer, PageShell, Submit } from "@/components/compliance/ui";

/**
 * The free compliance calendar. No account, no email, nothing stored.
 *
 * Five answers in the URL produce the year's due dates, and the same URL with
 * /ics on the end is a calendar feed Google, Apple and Outlook can subscribe
 * to — so a business owner who never signs up still gets reminded, by their
 * own phone, every month. That is the point: it is useful on its own, and the
 * "File with LAWFIC" button on each row is there for the day it is needed.
 */

export const metadata: Metadata = {
  title: "Free compliance calendar — GST, TDS, ROC and income tax due dates",
  description:
    "Your business's GST, TDS, income tax and ROC due dates for the year, worked out from five questions. Free, no sign-up, and it syncs to Google or Apple Calendar.",
  alternates: { canonical: "/tools/compliance-calendar" },
};

export const dynamic = "force-dynamic";

export default async function FreeCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const submitted = Boolean(get("entity"));
  const profile = profileFromParams(get);
  const today = todayIST();
  const events = submitted ? buildCalendar(profile, today, { back: 30, ahead: 365 }) : [];

  const query = profileToParams(profile);
  const icsPath = `/tools/compliance-calendar/ics?${query}`;
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const webcal = `webcal://${host}${icsPath}`;
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;

  return (
    <PageShell
      eyebrow="Free tool"
      title="Your compliance calendar"
      lead={
        <>
          Answer five questions and see every GST, TDS, income tax and ROC date your business owes this year. Nothing
          is saved and you do not need an account. Already a customer?{" "}
          <Link href="/compliance" className="text-primary underline-offset-4 hover:underline">
            Your dashboard
          </Link>{" "}
          tracks what you have filed.
        </>
      }
      crumbs={[
        { label: "Free tools", href: "/tools" },
        { label: "Compliance calendar", href: "/tools/compliance-calendar" },
      ]}
    >
      <Card>
        <form method="get" className="grid gap-5">
          <ProfileFields value={submitted ? profile : undefined} />
          <div>
            <Submit>Show my dates</Submit>
          </div>
        </form>
      </Card>

      {submitted && (
        <>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="type-label text-subtle">{ENTITY_LABELS[profile.entity]}</p>
              <h2 className="mt-1 text-[20px] text-foreground">
                {events.length} due date{events.length === 1 ? "" : "s"} in the next twelve months
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={google} external variant="quiet">
                Add to Google Calendar
              </ButtonLink>
              <ButtonLink href={webcal} external variant="quiet">
                Apple / Outlook
              </ButtonLink>
              <a
                href={icsPath}
                download="lawfic-compliance.ics"
                className="inline-flex items-center rounded-full border border-border px-4 py-2 text-[12.5px] text-foreground hover:border-primary/40 hover:text-primary"
              >
                Download .ics
              </a>
            </div>
          </div>
          <p className="mt-2 text-[12px] text-subtle">
            Subscribing keeps the dates up to date and reminds you a week and a day before each one.
          </p>

          <div className="mt-6">
            <EventList events={events} today={today} />
          </div>

          <Card className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[14.5px] text-foreground">Want us to tick these off for you?</p>
              <p className="mt-1 text-[13px] text-muted">
                Save this business to your account to mark filings done, track renewals and get WhatsApp reminders.
              </p>
            </div>
            <ButtonLink href={`/compliance/businesses?${query}`}>Save to my account</ButtonLink>
          </Card>
        </>
      )}

      <Disclaimer>
        Standing statutory due dates under the CGST Act, the Income-tax Act, the Companies Act and the LLP Act, as of
        October 2026. Governments extend dates by notification, sometimes at short notice; we update this calendar
        when they do, but check the official portal before relying on a date for a payment. Advance tax and some
        returns apply only above thresholds — the note under each row says when.
      </Disclaimer>
    </PageShell>
  );
}
