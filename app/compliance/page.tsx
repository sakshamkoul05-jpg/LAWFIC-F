import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ENTITY_LABELS,
  buildCalendar,
  formatDue,
  profileFromBusiness,
  profileToParams,
  stateOf,
  todayIST,
  type EntityType,
} from "@/lib/compliance/calendar";
import { BAND_LABEL, healthScore } from "@/lib/compliance/health";
import { LICENCE_KINDS, licenceMeta, renewalState } from "@/lib/compliance/renewals";
import { fileWithLawficHref } from "@/lib/compliance/links";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { PRIVATE_PAGE_ROBOTS, SITE_URL } from "@/lib/seo";
import { EventList } from "@/components/compliance/EventList";
import { ButtonLink, Card, Chip, Field, PageShell, Select } from "@/components/compliance/ui";
import { ConfirmSubmit } from "@/components/compliance/ConfirmSubmit";
import { addLicence, deleteLicence, toggleFiled } from "./actions";
import type { BusinessRow } from "./businesses/BusinessForm";

/**
 * The compliance dashboard.
 *
 * One business at a time (?b=<id>, defaulting to the first): its health score
 * with the working shown, what is overdue and due soon, the year ahead with a
 * "Mark filed" on every row, and the licences that expire. Everything the
 * customer marks is theirs alone — RLS on every table — and nothing here is
 * computed from data we do not hold: the calendar comes from their answers,
 * the score from their marks.
 */

export const metadata: Metadata = { title: "Compliance dashboard", robots: PRIVATE_PAGE_ROBOTS };
export const dynamic = "force-dynamic";

type Licence = { id: string; kind: string; label: string; number: string; expires_on: string };

const RING: Record<string, string> = {
  excellent: "var(--color-success)",
  good: "var(--color-success)",
  attention: "var(--color-primary)",
  "at-risk": "var(--color-destructive)",
};

export default async function ComplianceDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/compliance");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/compliance");

  const { data: rows } = await supabase.from("businesses").select("*").order("created_at");
  const businesses = (rows ?? []) as BusinessRow[];

  if (businesses.length === 0) {
    return (
      <PageShell
        eyebrow="Compliance"
        title="Never miss a due date again"
        lead="Tell us about your business once. We work out every GST, TDS, income tax and ROC date it owes, track what you have filed, warn you before licences expire, and score how you are doing."
        width="max-w-3xl"
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/compliance/businesses">Add your business</ButtonLink>
          <ButtonLink href="/tools/compliance-calendar" variant="quiet">
            Try the free calendar first
          </ButtonLink>
        </div>
      </PageShell>
    );
  }

  const business = businesses.find((b) => b.id === sp.b) ?? businesses[0];
  const profile = profileFromBusiness(business);
  const today = todayIST();

  const [filingsRes, licencesRes, vaultRes] = await Promise.all([
    supabase.from("compliance_filings").select("item_key").eq("business_id", business.id),
    supabase.from("business_licences").select("id,kind,label,number,expires_on").eq("business_id", business.id).order("expires_on"),
    supabase.from("vault_documents").select("kind"),
  ]);
  const filed = new Set((filingsRes.data ?? []).map((f) => f.item_key as string));
  const licences = (licencesRes.data ?? []) as Licence[];
  const vaultKinds = new Set((vaultRes.data ?? []).map((v) => v.kind as string));

  const events = buildCalendar(profile, today, { back: 90, ahead: 365 });
  const health = healthScore({ today, events, filed, licences, vaultKinds });

  const overdue = events.filter((e) => stateOf(e, today, filed) === "overdue");
  const soon = events.filter((e) => ["due-soon", "upcoming"].includes(stateOf(e, today, filed)) && e.due <= addMonth(today));
  const later = events.filter((e) => e.due > addMonth(today) || (stateOf(e, today, filed) === "filed" && e.due >= today));

  const query = profileToParams(profile);
  const webcal = `webcal://${SITE_URL.replace(/^https?:\/\//, "")}/tools/compliance-calendar/ics?${query}`;

  const markAction = (e: { key: string }, isFiled: boolean) => (
    <form action={toggleFiled}>
      <input type="hidden" name="business_id" value={business.id} />
      <input type="hidden" name="item_key" value={e.key} />
      <input type="hidden" name="filed" value={isFiled ? "1" : "0"} />
      <button
        type="submit"
        className={
          isFiled
            ? "rounded-full px-3 py-1.5 text-[12px] text-subtle hover:text-foreground"
            : "rounded-full bg-primary-light px-3.5 py-1.5 text-[12px] text-primary hover:bg-primary hover:text-background"
        }
      >
        {isFiled ? "Undo" : "Mark filed"}
      </button>
    </form>
  );

  const circumference = 2 * Math.PI * 42;

  return (
    <PageShell
      eyebrow="Compliance dashboard"
      title={business.name}
      lead={
        <span className="text-[13.5px]">
          {ENTITY_LABELS[business.entity_type as EntityType]}
          {business.gstin ? ` · GSTIN ${business.gstin}` : ""} ·{" "}
          <Link href={`/compliance/businesses?edit=${business.id}`} className="text-primary hover:underline">
            Edit details
          </Link>
        </span>
      }
    >
      {/* business switcher */}
      {businesses.length > 1 && (
        <nav aria-label="Your businesses" className="-mt-4 mb-8 flex flex-wrap gap-2">
          {businesses.map((b) => (
            <Link
              key={b.id}
              href={`/compliance?b=${b.id}`}
              aria-current={b.id === business.id ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] ${
                b.id === business.id ? "border-primary bg-primary-light text-primary" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {b.name}
            </Link>
          ))}
          <Link href="/compliance/businesses" className="rounded-full border border-dashed border-border px-3.5 py-1.5 text-[12.5px] text-subtle hover:text-primary">
            + Add business
          </Link>
        </nav>
      )}

      {/* health + quick links */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative size-[110px] shrink-0">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={RING[health.band]}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - health.score / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[28px] leading-none tabular-nums text-foreground">{health.score}</span>
              <span className="type-label mt-1 text-[9.5px] text-subtle">of 100</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="type-label text-subtle">Business health</p>
            <p className="mt-1 text-[18px] text-foreground">{BAND_LABEL[health.band]}</p>
            {health.lines.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted">Nothing overdue, nothing expiring. Keep marking filings as you go.</p>
            ) : (
              <ul className="mt-2 grid gap-1">
                {health.lines.slice(0, 5).map((l) => (
                  <li key={l.label} className="flex justify-between gap-3 text-[12.5px] text-muted">
                    <span className="truncate">{l.label}</span>
                    <span className="shrink-0 font-mono tabular-nums text-destructive">{l.points}</span>
                  </li>
                ))}
                {health.lines.length > 5 && <li className="text-[12px] text-subtle">and {health.lines.length - 5} more</li>}
              </ul>
            )}
          </div>
        </Card>

        <Card className="grid content-start gap-3">
          <p className="type-label text-subtle">Reminders</p>
          <p className="text-[13px] text-muted">
            {business.whatsapp_opt_in ? (
              isWhatsAppConfigured ? (
                <>WhatsApp reminders go to +{business.whatsapp_number}.</>
              ) : (
                <>WhatsApp reminders are switched on for +{business.whatsapp_number} and start once our WhatsApp line is live.</>
              )
            ) : (
              <>
                WhatsApp reminders are off.{" "}
                <Link href={`/compliance/businesses?edit=${business.id}`} className="text-primary hover:underline">
                  Turn on
                </Link>
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} external variant="quiet">
              Google Calendar
            </ButtonLink>
            <ButtonLink href={webcal} external variant="quiet">
              Apple / Outlook
            </ButtonLink>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
            <Link href="/vault" className="text-primary hover:underline">
              Document vault
            </Link>
            <Link href="/orders" className="text-primary hover:underline">
              Your orders
            </Link>
            <Link href="/instant-help" className="text-primary hover:underline">
              Ask an expert
            </Link>
            <Link href="/tools" className="text-primary hover:underline">
              Free tools
            </Link>
          </div>
        </Card>
      </div>

      {/* overdue */}
      {overdue.length > 0 && (
        <section className="mt-10">
          <h2 className="type-label mb-3 text-destructive">Overdue</h2>
          <EventList events={overdue} today={today} filed={filed} action={markAction} />
          <p className="mt-2 text-[12px] text-subtle">
            Already filed? Mark it. Not yet? The{" "}
            <Link href="/tools/penalty-calculator" className="text-primary hover:underline">
              penalty calculator
            </Link>{" "}
            shows what each day adds.
          </p>
        </section>
      )}

      {/* next 30 days */}
      <section className="mt-10">
        <h2 className="type-label mb-3 text-subtle">Next 30 days</h2>
        <EventList events={soon} today={today} filed={filed} action={markAction} empty="Nothing due in the next 30 days." />
      </section>

      {/* renewals */}
      <section className="mt-10">
        <h2 className="type-label mb-3 text-subtle">Licences & renewals</h2>
        {licences.length > 0 && (
          <ul className="mb-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {licences.map((l) => {
              const meta = licenceMeta(l.kind);
              const r = renewalState(l.kind, l.expires_on, today);
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] text-foreground">{l.label || meta.label}</p>
                      {r.state === "expired" && <Chip tone="bad">Expired</Chip>}
                      {r.state === "renew-now" && <Chip tone="warn">Renew now · {r.daysLeft} days</Chip>}
                      {r.state === "ok" && <Chip tone="good">Valid</Chip>}
                    </div>
                    <p className="mt-0.5 text-[12px] text-subtle">
                      {l.number ? `${l.number} · ` : ""}expires {formatDue(l.expires_on)}
                      {meta.note ? ` · ${meta.note}` : ""}
                    </p>
                  </div>
                  {r.state !== "ok" && meta.renewSlug && (
                    <Link
                      href={fileWithLawficHref(meta.renewSlug)}
                      className="rounded-full border border-border px-3.5 py-1.5 text-[12px] text-foreground hover:border-primary/40 hover:text-primary"
                    >
                      Renew with LAWFIC
                    </Link>
                  )}
                  <form action={deleteLicence}>
                    <input type="hidden" name="id" value={l.id} />
                    <ConfirmSubmit message="Remove this licence from tracking?" className="text-[12px] text-subtle hover:text-destructive">
                      Remove
                    </ConfirmSubmit>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
        <Card>
          <form action={addLicence} className="grid gap-4 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="business_id" value={business.id} />
            <Select name="kind" label="Track a licence" options={LICENCE_KINDS.map((k) => ({ value: k.id, label: k.label }))} />
            <Field name="number" label="Number (optional)" maxLength={40} />
            <Field name="expires_on" label="Expires on" type="date" required />
            <button type="submit" className="rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-background hover:bg-primary-hover">
              Add
            </button>
          </form>
        </Card>
      </section>

      {/* the year */}
      <section className="mt-10">
        <h2 className="type-label mb-3 text-subtle">The year ahead</h2>
        <EventList events={later} today={today} filed={filed} action={markAction} />
      </section>
    </PageShell>
  );
}

function addMonth(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + 30));
  return t.toISOString().slice(0, 10);
}
