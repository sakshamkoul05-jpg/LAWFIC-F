import type { Metadata } from "next";
import Link from "next/link";
import { company, formatAddress, missingCompanyFacts } from "@/lib/company";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Contact & grievances",
  description:
    "How to reach LAWFIC, our support hours, and the grievance officer for complaints under the Consumer Protection (E-Commerce) Rules 2020.",
};

export default function ContactPage() {
  const missing = process.env.NODE_ENV !== "production" ? missingCompanyFacts() : [];
  const legalGaps = missing.filter((m) => m.legal);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_50%_50%,rgba(201,168,76,0.05),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <Reveal>
            <p className="type-label text-primary">Contact</p>
            <h1 className="type-display mt-6 max-w-2xl text-foreground">
              A real person, in working hours, who can see your file
            </h1>
            <p className="type-body mt-7 max-w-2xl text-muted">
              The most common complaint about this industry is going quiet after payment. If you
              have a filing with us, the fastest route is the contact link on the filing itself —
              it reaches whoever is handling it.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div>
              <p className="type-label mb-6 text-primary">How to reach us</p>

              <div className="flex flex-col gap-px overflow-hidden border border-border">
                {company.supportEmail && (
                  <Row label="Email" value={company.supportEmail} href={`mailto:${company.supportEmail}`} />
                )}
                {company.supportPhone && (
                  <Row label="Phone" value={company.supportPhone} href={`tel:${company.supportPhone.replace(/\s/g, "")}`} mono />
                )}
                {company.whatsapp && (
                  <Row label="WhatsApp" value={company.whatsapp} mono />
                )}
                <Row label="Hours" value={company.supportHours} />
                {company.officeAddress && (
                  <Row label="Office" value={formatAddress(company.officeAddress)} />
                )}
              </div>

              {!company.supportEmail && !company.supportPhone && (
                <p className="mt-4 border border-border bg-surface-2 px-5 py-4 text-[13px] leading-relaxed text-muted">
                  Contact channels are being finalised. If you already have a filing with us, use
                  the contact link on{" "}
                  <Link href="/orders" className="text-primary hover:text-primary-hover">
                    that filing
                  </Link>{" "}
                  — it reaches the person handling it directly.
                </p>
              )}

              <div className="mt-8 border border-border bg-surface p-6">
                <p className="type-label mb-3">Already have a filing with us?</p>
                <p className="max-w-md text-[13px] leading-relaxed text-muted">
                  Open it from your account. Every filing shows its current stage, the reference
                  number with the department, and every rupee that has moved on it.
                </p>
                <Link
                  href="/orders"
                  className="mt-5 inline-block rounded-full border border-border px-5 py-2.5 text-[12px] text-foreground transition-colors hover:border-primary"
                >
                  Your filings
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="overflow-hidden border border-border bg-surface">
              <div className="border-b border-border px-6 py-5">
                <p className="type-label text-primary">Grievance officer</p>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">
                  Appointed under the Consumer Protection (E-Commerce) Rules, 2020.
                </p>
              </div>

              <div className="p-6">
                {company.grievanceOfficer ? (
                  <dl className="flex flex-col gap-4">
                    <Fact k="Name" v={company.grievanceOfficer.name} />
                    <Fact k="Designation" v={company.grievanceOfficer.designation} />
                    <Fact k="Email" v={company.grievanceOfficer.email} />
                    {company.grievanceOfficer.phone && (
                      <Fact k="Phone" v={company.grievanceOfficer.phone} mono />
                    )}
                  </dl>
                ) : (
                  <p className="text-[13px] leading-relaxed text-muted">
                    Details are being published. In the meantime, raise any complaint through your
                    filing or our support address and it will be routed to the officer.
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5">
                  {[
                    ["Acknowledged within", "48 hours"],
                    ["Resolved within", "One month"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-4">
                      <span className="text-[12.5px] text-muted">{k}</span>
                      <span className="type-data text-[12.5px] text-primary">{v}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-[11.5px] leading-relaxed text-subtle">
                  These are the timelines the Rules require of us, not targets we have chosen.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {(company.legalName || company.cin || company.registeredAddress) && (
          <Reveal>
            <div className="mt-12 border border-border bg-surface-2 p-7">
              <p className="type-label mb-5 text-primary">Company details</p>
              <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {company.legalName && <Fact k="Registered name" v={company.legalName} />}
                {company.cin && <Fact k="CIN" v={company.cin} mono />}
                {company.gstin && <Fact k="GSTIN" v={company.gstin} mono />}
                {company.registeredAddress && (
                  <Fact k="Registered office" v={formatAddress(company.registeredAddress)} />
                )}
              </dl>
            </div>
          </Reveal>
        )}

        {legalGaps.length > 0 && (
          <div className="mt-12 border border-destructive/40 bg-destructive-light p-6">
            <p className="type-label mb-3 text-destructive">Not published yet — development notice</p>
            <p className="mb-4 max-w-2xl text-[13px] leading-relaxed text-muted">
              These fields are legally required to appear on the site and are still{" "}
              <code className="font-mono text-[12px] text-foreground">null</code> in{" "}
              <code className="font-mono text-[12px] text-foreground">lib/company.ts</code>. This notice
              is development-only and never renders in production — which means shipping without
              them just silently omits them.
            </p>
            <ul className="flex flex-col gap-2">
              {legalGaps.map((m) => (
                <li key={m.field} className="flex flex-wrap gap-x-3 text-[12.5px]">
                  <code className="type-data text-primary">{m.field}</code>
                  <span className="text-muted">{m.why}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}

function Row({
  label,
  value,
  href,
  mono,
}: {
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  const body = (
    <span className={`text-[13.5px] text-foreground ${mono ? "type-data" : ""}`}>
      {value}
    </span>
  );
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 bg-surface px-6 py-4">
      <span className="type-label">{label}</span>
      {href ? (
        <a href={href} className="transition-colors hover:text-primary">
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}

function Fact({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="type-label">{k}</dt>
      <dd className={`mt-1.5 text-[13px] leading-relaxed text-foreground ${mono ? "type-data" : ""}`}>
        {v}
      </dd>
    </div>
  );
}
