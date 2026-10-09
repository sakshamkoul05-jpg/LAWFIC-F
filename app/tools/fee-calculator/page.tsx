import type { Metadata } from "next";
import { services } from "@/lib/services";
import { plans } from "@/lib/pricing";
import { company } from "@/lib/company";
import { formatPaise } from "@/lib/money";
import { estimateFees, parseRupees } from "@/lib/compliance/fees";
import { ButtonLink, Card, Disclaimer, Field, PageShell, Select, Submit } from "@/components/compliance/ui";

export const metadata: Metadata = {
  title: "Fee calculator — government fee and LAWFIC fee, itemised",
  description:
    "See exactly what a filing costs: the government's fee, LAWFIC's professional fee, your member discount and tax, as separate lines.",
  alternates: { canonical: "/tools/fee-calculator" },
};

export const dynamic = "force-dynamic";

export default async function FeeCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const service = services.find((s) => s.slug === sp.service) ?? services[0];
  const listedGovt = parseRupees(service.fee.government);
  const listedProf = parseRupees(service.fee.professional) ?? 0;

  const govtRupees = sp.govt !== undefined && sp.govt !== "" ? Math.max(0, Number(sp.govt) || 0) : listedGovt ?? 0;
  const planId = plans.some((p) => p.id === sp.plan) ? sp.plan! : "per-filing";
  const est = estimateFees({
    governmentRupees: govtRupees,
    professionalRupees: listedProf,
    planId,
    gstRegistered: Boolean(company.gstin),
  });

  const rows: { label: string; value: string; note?: string; strong?: boolean }[] = [
    {
      label: "Government fee",
      value: formatPaise(est.governmentPaise),
      note: listedGovt === null && !sp.govt ? `Varies: ${service.fee.government}` : "Paid to the government, at cost",
    },
    { label: "LAWFIC professional fee", value: formatPaise(est.professionalPaise) },
  ];
  if (est.discountPaise > 0) {
    rows.push({ label: "Member discount", value: `− ${formatPaise(est.discountPaise)}`, note: plans.find((p) => p.id === planId)?.name });
  }
  rows.push({
    label: est.gstApplies ? "GST on our fee (18%)" : "GST",
    value: est.gstApplies ? formatPaise(est.gstPaise) : "₹0",
    note: est.gstApplies ? undefined : "No GST charged — LAWFIC is not yet GST-registered",
  });
  rows.push({ label: "You pay", value: formatPaise(est.totalPaise), strong: true });

  return (
    <PageShell
      eyebrow="Free tool"
      title="What will it cost?"
      lead="The government's fee and ours, always as separate lines. Pick a service and your membership to see the total before you commit to anything."
      crumbs={[
        { label: "Free tools", href: "/tools" },
        { label: "Fee calculator", href: "/tools/fee-calculator" },
      ]}
      width="max-w-3xl"
    >
      <Card>
        <form method="get" className="grid gap-4 sm:grid-cols-3 sm:items-end">
          <Select
            name="service"
            label="Service"
            defaultValue={service.slug}
            options={services.map((s) => ({ value: s.slug, label: s.name }))}
          />
          <Select
            name="plan"
            label="Membership"
            defaultValue={planId}
            options={plans.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Field
            name="govt"
            label="Government fee (₹)"
            type="number"
            min={0}
            placeholder={listedGovt === null ? "Enter if known" : String(listedGovt)}
            defaultValue={sp.govt ?? ""}
          />
          <div className="sm:col-span-3">
            <Submit>Calculate</Submit>
          </div>
        </form>
      </Card>

      <dl className="mt-8 flex flex-col gap-px overflow-hidden rounded-2xl border border-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 bg-surface px-5 py-3.5">
            <dt className={`text-[13.5px] ${r.strong ? "text-foreground" : "text-muted"}`}>
              {r.label}
              {r.note && <span className="ml-2 text-[11.5px] text-subtle">{r.note}</span>}
            </dt>
            <dd className={`shrink-0 font-mono text-[14px] tabular-nums ${r.strong ? "text-primary" : "text-foreground"}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[12.5px] text-muted">Turnaround: {service.turnaround}.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={`/services/${service.slug}`}>Start {service.short}</ButtonLink>
        <ButtonLink href="/pricing" variant="quiet">
          Compare memberships
        </ButtonLink>
      </div>

      <Disclaimer>
        Only services with a published fee are listed. Anything else is quoted after we see the file, with the same
        split, before you pay. Government fees are set by the government and change by state and category; where it
        varies, enter the figure you have been quoted.
      </Disclaimer>
    </PageShell>
  );
}
