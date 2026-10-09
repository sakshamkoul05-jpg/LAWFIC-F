import type { Metadata } from "next";
import { assess, type Supply } from "@/lib/compliance/eligibility";
import { fileWithLawficHref } from "@/lib/compliance/links";
import { REGIONS } from "@/lib/states";
import { ButtonLink, Card, Check, Chip, Disclaimer, Field, PageShell, Select, Submit } from "@/components/compliance/ui";

export const metadata: Metadata = {
  title: "Do I need GST, FSSAI or Udyam? — free eligibility checker",
  description:
    "Enter your turnover, state and what you sell, and see which registrations your business needs — GST, FSSAI tier, Udyam class, IEC, PF and ESI — with the reason for each.",
  alternates: { canonical: "/tools/eligibility" },
};

export const dynamic = "force-dynamic";

const VERDICT = {
  required: { tone: "bad", label: "Required" },
  recommended: { tone: "warn", label: "Recommended" },
  "not-required": { tone: "good", label: "Not required" },
  check: { tone: "info", label: "Check your state" },
} as const;

/** "40 lakh", "1.5 crore", "4000000" → rupees. */
function parseAmount(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase().replace(/[,₹\s]/g, "");
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return undefined;
  if (s.includes("cr")) return n * 10_000_000;
  if (s.includes("l")) return n * 100_000;
  return n;
}

export default async function EligibilityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const turnover = parseAmount(sp.turnover);
  const submitted = sp.state !== undefined && turnover !== undefined;

  const result = submitted
    ? assess({
        state: (sp.state ?? "").slice(0, 2).toUpperCase(),
        supply: (["goods", "services", "both"].includes(sp.supply ?? "") ? sp.supply : "goods") as Supply,
        turnover: turnover!,
        investment: parseAmount(sp.investment),
        interState: sp.inter === "1",
        ecommerce: sp.ecom === "1",
        food: sp.food === "1",
        importExport: sp.impex === "1",
        multiState: sp.multi === "1",
        employees: Math.max(0, Math.min(100000, parseInt(sp.employees ?? "0", 10) || 0)),
      })
    : null;

  return (
    <PageShell
      eyebrow="Free tool"
      title="Which registrations does my business need?"
      lead="Turnover, state and what you sell decide most of it. Each answer below comes with the rule behind it, so you can check it yourself."
      crumbs={[
        { label: "Free tools", href: "/tools" },
        { label: "Eligibility checker", href: "/tools/eligibility" },
      ]}
    >
      <Card>
        <form method="get" className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              name="state"
              label="State"
              defaultValue={sp.state ?? ""}
              options={[{ value: "", label: "Choose…" }, ...REGIONS.map((r) => ({ value: r.code, label: r.name }))]}
            />
            <Select
              name="supply"
              label="You sell"
              defaultValue={sp.supply ?? "goods"}
              options={[
                { value: "goods", label: "Goods" },
                { value: "services", label: "Services" },
                { value: "both", label: "Both" },
              ]}
            />
            <Field name="employees" label="Employees" type="number" min={0} defaultValue={sp.employees ?? "0"} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="turnover"
              label="Turnover this year"
              placeholder="e.g. 35 lakh or 2.5 crore"
              defaultValue={sp.turnover ?? ""}
              required
              hint="All your businesses under the same PAN, across India."
            />
            <Field
              name="investment"
              label="Investment in plant & machinery (optional)"
              placeholder="e.g. 10 lakh"
              defaultValue={sp.investment ?? ""}
              hint="Decides your Udyam class."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Check name="inter" label="I sell goods to other states" defaultChecked={sp.inter === "1"} />
            <Check name="ecom" label="I sell on Amazon, Flipkart or similar" defaultChecked={sp.ecom === "1"} />
            <Check name="food" label="I make, sell, store or serve food" defaultChecked={sp.food === "1"} />
            <Check name="impex" label="I import or export" defaultChecked={sp.impex === "1"} />
            <Check name="multi" label="I operate in more than one state" defaultChecked={sp.multi === "1"} />
          </div>
          <div>
            <Submit>Check</Submit>
          </div>
        </form>
      </Card>

      {result && (
        <ul className="mt-10 grid gap-3">
          {result.findings.map((f) => {
            const v = VERDICT[f.verdict];
            return (
              <li key={f.id}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-medium text-foreground">{f.title}</p>
                      <Chip tone={v.tone}>{v.label}</Chip>
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{f.why}</p>
                  </div>
                  {f.slug && f.verdict !== "not-required" && (
                    <ButtonLink href={fileWithLawficHref(f.slug)} variant="quiet">
                      Get it done
                    </ButtonLink>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Disclaimer>
        Thresholds as of October 2026: GST under s.22 and s.24 of the CGST Act; FSSAI limits revised from 1 April 2026;
        Udyam slabs effective 1 April 2025. This is a first answer from the figures you gave, not advice on your
        particular facts — a specialist will confirm before anything is filed.
      </Disclaimer>
    </PageShell>
  );
}
