import type { Metadata } from "next";
import { todayIST } from "@/lib/compliance/calendar";
import { PENALTY_KINDS, estimatePenalty, type PenaltyKind } from "@/lib/compliance/penalties";
import { fileWithLawficHref } from "@/lib/compliance/links";
import { ButtonLink, Card, Check, Disclaimer, Field, PageShell, Select, Submit } from "@/components/compliance/ui";

export const metadata: Metadata = {
  title: "Late fee & penalty calculator — GST, ITR, TDS, ROC",
  description:
    "Missed a GSTR-3B, an ITR or an ROC filing? See the late fee and interest you owe today, with the rule behind each line.",
  alternates: { canonical: "/tools/penalty-calculator" },
};

export const dynamic = "force-dynamic";

const SLUG: Record<PenaltyKind, string> = {
  gstr3b: "gst-returns",
  gstr1: "gst-returns",
  gstr9: "gst-returns",
  itr: "itr-filing",
  "tds-return": "tds-returns",
  "tds-payment": "tds-returns",
  roc: "roc-filings",
  llp: "roc-filings",
  dir3kyc: "roc-filings",
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const num = (s: string | undefined) => (s ? Math.max(0, Number(s.replace(/[,₹\s]/g, "")) || 0) : undefined);
const isDate = (s: string | undefined) => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s));

export default async function PenaltyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const today = todayIST();
  const kind = (PENALTY_KINDS.some((k) => k.id === sp.kind) ? sp.kind : "gstr3b") as PenaltyKind;
  const submitted = isDate(sp.due);

  const result = submitted
    ? estimatePenalty({
        kind,
        due: sp.due!,
        filedOn: isDate(sp.filed) ? sp.filed! : today,
        nil: sp.nil === "1",
        turnover: num(sp.turnover),
        taxDue: num(sp.tax),
        totalIncome: num(sp.income),
      })
    : null;

  return (
    <PageShell
      eyebrow="Free tool"
      title="How much is being late costing me?"
      lead="Late fees and interest for the filings people most often miss. The figure grows every day, so this is worth knowing before you decide when to file."
      crumbs={[
        { label: "Free tools", href: "/tools" },
        { label: "Penalty calculator", href: "/tools/penalty-calculator" },
      ]}
      width="max-w-3xl"
    >
      <Card>
        <form method="get" className="grid gap-4">
          <Select
            name="kind"
            label="What was late?"
            defaultValue={kind}
            options={PENALTY_KINDS.map((k) => ({ value: k.id, label: k.label }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="due" label="Due date" type="date" required defaultValue={sp.due ?? ""} />
            <Field name="filed" label="Filed on (blank = today)" type="date" defaultValue={sp.filed ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="turnover" label="Annual turnover (₹)" inputMode="numeric" placeholder="For GST caps" defaultValue={sp.turnover ?? ""} />
            <Field name="tax" label="Tax / TDS unpaid (₹)" inputMode="numeric" placeholder="For interest" defaultValue={sp.tax ?? ""} />
            <Field name="income" label="Total income (₹)" inputMode="numeric" placeholder="For ITR only" defaultValue={sp.income ?? ""} />
          </div>
          <Check name="nil" label="It is a nil GST return (no sales, no tax)" defaultChecked={sp.nil === "1"} />
          <div>
            <Submit>Calculate</Submit>
          </div>
        </form>
      </Card>

      {result && (
        <div className="mt-8">
          <Card>
            <p className="type-label text-subtle">
              {result.daysLate === 0 ? "On time" : `${result.daysLate} day${result.daysLate === 1 ? "" : "s"} late`}
            </p>
            <p className="mt-2 font-mono text-[34px] tabular-nums text-foreground">{inr(result.total)}</p>
            {result.lines.length > 0 && (
              <dl className="mt-5 flex flex-col gap-px overflow-hidden rounded-xl border border-border">
                {result.lines.map((l) => (
                  <div key={l.label} className="flex items-baseline justify-between gap-4 bg-surface-2 px-4 py-3">
                    <dt className="text-[13.5px] text-muted">
                      {l.label}
                      {l.note && <span className="mt-0.5 block text-[11.5px] text-subtle">{l.note}</span>}
                    </dt>
                    <dd className="shrink-0 font-mono text-[14px] tabular-nums text-foreground">{inr(l.rupees)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {result.caveats.length > 0 && (
              <ul className="mt-4 grid gap-1.5">
                {result.caveats.map((c) => (
                  <li key={c} className="text-[12.5px] text-muted">
                    · {c}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {result.daysLate > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ButtonLink href={fileWithLawficHref(SLUG[kind])}>File it with LAWFIC today</ButtonLink>
              <span className="text-[12.5px] text-subtle">Every day adds to the late fee until it is filed.</span>
            </div>
          )}
        </div>
      )}

      <Disclaimer>
        Rates as of October 2026 under the CGST Act (s.47, s.50, Notifications 19/2021 and 07/2023), the Income-tax Act
        (s.234A, s.234E, s.234F, s.201(1A)) and the Companies and LLP Acts. An estimate: it does not account for
        amnesty schemes, period-specific waivers or penalties an officer may levy separately.
      </Disclaimer>
    </PageShell>
  );
}
