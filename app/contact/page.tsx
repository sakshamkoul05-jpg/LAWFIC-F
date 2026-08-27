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
      <section className="grain bloom relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <Reveal>
            <p className="label text-brass">Contact</p>
            <h1 className="mt-6 max-w-2xl font-display text-[clamp(32px,4.6vw,48px)] leading-[1.08] text-bone">
              A real person, in working hours, who can see your file
            </h1>
            <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-ash">
              The most common complaint about this industry is going quiet after payment. If you
              have a filing with us, the fastest route is the contact link on the filing itself —
              it reaches whoever is handling it.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* how to reach us */}
          <Reveal>
            <div>
              <p className="label mb-6 text-brass">How to reach us</p>

              <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-line bg-line">
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
                <p className="mt-4 rounded border border-line-2 bg-surface/40 px-5 py-4 text-[13.5px] leading-relaxed text-slate">
                  Contact channels are being finalised. If you already have a filing with us, use
                  the contact link on{" "}
                  <Link href="/orders" className="text-brass hover:text-brass-hi">
                    that filing
                  </Link>{" "}
                  — it reaches the person handling it directly.
                </p>
              )}

              <div className="mt-8 rounded-lg border border-line bg-surface/30 p-6">
                <p className="label mb-3 text-slate">Already have a filing with us?</p>
                <p className="max-w-md text-[14px] leading-relaxed text-ash">
                  Open it from your account. Every filing shows its current stage, the reference
                  number with the department, and every rupee that has moved on it.
                </p>
                <Link
                  href="/orders"
                  className="mt-5 inline-block rounded-full border border-line-2 px-5 py-2.5 text-[13.5px] text-bone transition-colors hover:border-brass-lo"
                >
                  Your filings
                </Link>
              </div>
            </div>
          </Reveal>

          {/* grievance officer — legally mandated */}
          <Reveal delay={0.08}>
            <div className="overflow-hidden rounded-lg border border-line-2 bg-gradient-to-b from-surface-2 to-ink-2">
              <div className="border-b border-line px-6 py-5">
                <p className="label text-brass">Grievance officer</p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate">
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
                  <p className="text-[13.5px] leading-relaxed text-slate">
                    Details are being published. In the meantime, raise any complaint through your
                    filing or our support address and it will be routed to the officer.
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
                  {[
                    ["Acknowledged within", "48 hours"],
                    ["Resolved within", "One month"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-4">
                      <span className="text-[13px] text-ash">{k}</span>
                      <span className="font-mono text-[13px] text-brass tnum">{v}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-[12px] leading-relaxed text-slate">
                  These are the timelines the Rules require of us, not targets we have chosen.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* entity block */}
        {(company.legalName || company.cin || company.registeredAddress) && (
          <Reveal>
            <div className="mt-12 rounded-lg border border-line bg-ink-2 p-7">
              <p className="label mb-5 text-brass-lo">Company details</p>
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

        {/* Development-only. Never rendered in production. */}
        {legalGaps.length > 0 && (
          <div className="mt-12 rounded-lg border border-rust/40 bg-rust/5 p-6">
            <p className="label mb-3 text-rust">Not published yet — development notice</p>
            <p className="mb-4 max-w-2xl text-[13.5px] leading-relaxed text-ash">
              These fields are legally required to appear on the site and are still{" "}
              <code className="font-mono text-[13px] text-bone">null</code> in{" "}
              <code className="font-mono text-[13px] text-bone">lib/company.ts</code>. This notice
              is development-only and never renders in production — which means shipping without
              them just silently omits them.
            </p>
            <ul className="flex flex-col gap-2">
              {legalGaps.map((m) => (
                <li key={m.field} className="flex flex-wrap gap-x-3 text-[13px]">
                  <code className="font-mono text-brass">{m.field}</code>
                  <span className="text-slate">{m.why}</span>
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
    <span className={`text-[14.5px] text-bone ${mono ? "font-mono tracking-[0.04em]" : ""}`}>
      {value}
    </span>
  );
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 bg-ink-2 px-6 py-4">
      <span className="label text-slate">{label}</span>
      {href ? (
        <a href={href} className="transition-colors hover:text-brass">
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
      <dt className="label text-slate">{k}</dt>
      <dd className={`mt-1.5 text-[13.5px] leading-relaxed text-bone ${mono ? "font-mono" : ""}`}>
        {v}
      </dd>
    </div>
  );
}
