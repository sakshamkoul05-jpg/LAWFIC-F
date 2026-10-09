import type { Metadata } from "next";
import { checkId, type IdKind } from "@/lib/compliance/identifiers";
import { ButtonLink, Card, Chip, Disclaimer, Field, PageShell, Select, Submit } from "@/components/compliance/ui";

export const metadata: Metadata = {
  title: "GSTIN, PAN & Udyam number checker",
  description:
    "Check a supplier's GSTIN, PAN, TAN, CIN or Udyam number for typos and fakes — state, PAN and check digit — then confirm its live status on the government portal.",
  alternates: { canonical: "/tools/verify" },
};

export const dynamic = "force-dynamic";

const KINDS: { value: IdKind; label: string }[] = [
  { value: "gstin", label: "GSTIN" },
  { value: "pan", label: "PAN" },
  { value: "udyam", label: "Udyam number" },
  { value: "cin", label: "Company CIN" },
  { value: "llpin", label: "LLPIN" },
  { value: "tan", label: "TAN" },
];

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const kind = (KINDS.some((k) => k.value === sp.kind) ? sp.kind : "gstin") as IdKind;
  const value = (sp.value ?? "").slice(0, 40);
  const r = value ? checkId(kind, value) : null;

  return (
    <PageShell
      eyebrow="Free tool"
      title="Is this number genuine?"
      lead="A GSTIN carries its own check digit, a PAN says what kind of holder it belongs to. This reads both, catches typos and most invented numbers, and sends you to the government portal for the live status."
      crumbs={[
        { label: "Free tools", href: "/tools" },
        { label: "Verify a number", href: "/tools/verify" },
      ]}
      width="max-w-3xl"
    >
      <Card>
        <form method="get" className="grid gap-4 sm:grid-cols-[1fr_2fr] sm:items-end">
          <Select name="kind" label="Type" defaultValue={kind} options={KINDS} />
          <Field name="value" label="Number" defaultValue={value} required autoCapitalize="characters" spellCheck={false} placeholder="27AAPFU0939F1ZV" />
          <div className="sm:col-span-2">
            <Submit>Check</Submit>
          </div>
        </form>
      </Card>

      {r && (
        <Card className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[16px] tracking-wide text-foreground">{r.value || "—"}</p>
            {r.valid ? <Chip tone="good">Well-formed</Chip> : <Chip tone="bad">Not valid</Chip>}
          </div>
          {r.problems.length > 0 && (
            <ul className="mt-4 grid gap-1.5">
              {r.problems.map((p) => (
                <li key={p} className="text-[13.5px] text-destructive">
                  {p}
                </li>
              ))}
            </ul>
          )}
          {r.facts.length > 0 && (
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {r.facts.map((f) => (
                <div key={f.label} className="rounded-xl bg-surface-2 px-4 py-3">
                  <dt className="type-label text-subtle">{f.label}</dt>
                  <dd className="mt-1 text-[13.5px] text-foreground">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {r.valid && (
            <p className="mt-4 text-[12.5px] text-muted">
              Well-formed is not the same as active — a cancelled registration passes this check. Confirm the status
              before you pay an invoice or claim input credit.
            </p>
          )}
          {r.officialCheck && (
            <div className="mt-4">
              <ButtonLink href={r.officialCheck.url} external variant="quiet">
                {r.officialCheck.label}
              </ButtonLink>
            </div>
          )}
        </Card>
      )}

      <Disclaimer>
        Checked entirely on this page against the published formats and the GSTIN check-digit algorithm. Nothing you
        enter is stored or sent anywhere.
      </Disclaimer>
    </PageShell>
  );
}
