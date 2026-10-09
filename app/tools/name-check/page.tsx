import type { Metadata } from "next";
import { checkName, OFFICIAL_SEARCHES, type NameKind } from "@/lib/compliance/name-check";
import { ButtonLink, Card, Chip, Disclaimer, Field, PageShell, Select, Submit } from "@/components/compliance/ui";

export const metadata: Metadata = {
  title: "Company & brand name checker — will the registrar accept it?",
  description:
    "Check a company, LLP or brand name against the MCA naming rules before you apply: restricted words, generic names and the right suffix — then search the official registers.",
  alternates: { canonical: "/tools/name-check" },
};

export const dynamic = "force-dynamic";

export default async function NameCheckPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const kind = (["company", "llp", "brand"].includes(sp.kind ?? "") ? sp.kind : "company") as NameKind;
  const name = (sp.name ?? "").slice(0, 150);
  const result = name ? checkName(kind, name) : null;
  const blocked = result?.issues.some((i) => i.severity === "block");

  return (
    <PageShell
      eyebrow="Free tool"
      title="Will this name get through?"
      lead="A first check against the registrar's naming rules. It cannot tell you a name is free — only the official registers can — but it catches the names that will be refused whoever else has them."
      crumbs={[
        { label: "Free tools", href: "/tools" },
        { label: "Name checker", href: "/tools/name-check" },
      ]}
      width="max-w-3xl"
    >
      <Card>
        <form method="get" className="grid gap-4 sm:grid-cols-[1fr_2fr] sm:items-end">
          <Select
            name="kind"
            label="For a"
            defaultValue={kind}
            options={[
              { value: "company", label: "Private limited company" },
              { value: "llp", label: "LLP" },
              { value: "brand", label: "Brand / trade mark" },
            ]}
          />
          <Field name="name" label="Name" placeholder="Dhauladhar Looms Private Limited" defaultValue={name} required maxLength={150} />
          <div className="sm:col-span-2">
            <Submit>Check name</Submit>
          </div>
        </form>
      </Card>

      {result && (
        <div className="mt-8 grid gap-4">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[16px] text-foreground">{result.cleaned}</p>
              {blocked ? (
                <Chip tone="bad">Will be refused</Chip>
              ) : result.issues.length ? (
                <Chip tone="warn">Possible objections</Chip>
              ) : (
                <Chip tone="good">Passes the naming rules</Chip>
              )}
            </div>
            {result.issues.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {result.issues.map((i) => (
                  <li key={i.message} className="flex gap-2 text-[13.5px] leading-relaxed text-muted">
                    <span className={i.severity === "block" ? "text-destructive" : "text-primary"} aria-hidden>
                      ●
                    </span>
                    {i.message}
                  </li>
                ))}
              </ul>
            )}
            {result.restricted.length > 0 && (
              <p className="mt-3 text-[12.5px] text-subtle">Restricted: {result.restricted.join("; ")}.</p>
            )}
            {result.suggestions.length > 0 && (
              <div className="mt-4">
                <p className="type-label text-subtle">Try also</p>
                <p className="mt-1 text-[13.5px] text-muted">{result.suggestions.join(" · ")}</p>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-[14.5px] text-foreground">Now check it is free</p>
            <p className="mt-1 text-[13px] text-muted">
              A company name also has to be clear of registered trade marks — search both.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href={OFFICIAL_SEARCHES.mca.url} external variant="quiet">
                {OFFICIAL_SEARCHES.mca.label}
              </ButtonLink>
              <ButtonLink href={OFFICIAL_SEARCHES.trademark.url} external variant="quiet">
                {OFFICIAL_SEARCHES.trademark.label}
              </ButtonLink>
              <ButtonLink href={kind === "brand" ? "/request/trademark" : `/request/${kind === "llp" ? "llp" : "private-limited"}`}>
                Have LAWFIC search and file
              </ButtonLink>
            </div>
          </Card>
        </div>
      )}

      <Disclaimer>
        Rules from the Companies (Incorporation) Rules, 2014 (rules 8–8B), the LLP Rules, 2009 and the Emblems and
        Names (Prevention of Improper Use) Act. Similarity to existing names and marks is decided by the registrar
        and cannot be checked here.
      </Disclaimer>
    </PageShell>
  );
}
