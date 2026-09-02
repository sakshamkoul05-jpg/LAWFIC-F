import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { company, formatAddress } from "@/lib/company";
import { getLegalDoc, legalDocs } from "@/lib/legal";

export function generateStaticParams() {
  return legalDocs.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const { doc } = await params;
  const found = getLegalDoc(doc);
  if (!found) return {};
  return { title: found.title, description: found.summary };
}

export default async function LegalPage({ params }: PageProps<"/legal/[doc]">) {
  const { doc } = await params;
  const legal = getLegalDoc(doc);
  if (!legal) notFound();

  return (
    <>
      <section className="grain relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="label text-primary">Legal</p>
          <h1 className="mt-5 max-w-3xl font-display text-[clamp(30px,4.4vw,46px)] leading-[1.08] text-bone">
            {legal.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">{legal.summary}</p>
          <p className="label mt-7 text-muted">Last updated {legal.updated}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[220px_1fr]">
        {/* the other documents */}
        <nav aria-label="Legal documents" className="lg:sticky lg:top-28 lg:self-start">
          <p className="label mb-4 text-muted">Documents</p>
          <ul className="flex flex-col gap-1">
            {legalDocs.map((d) => {
              const on = d.slug === legal.slug;
              return (
                <li key={d.slug}>
                  <Link
                    href={`/legal/${d.slug}`}
                    className={`block border-l-2 py-2 pl-4 text-[13.5px] transition-colors ${
                      on
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-border-3 hover:text-bone"
                    }`}
                  >
                    {d.title}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2">
              <Link
                href="/contact"
                className="block border-l-2 border-border py-2 pl-4 text-[13.5px] text-muted-foreground transition-colors hover:border-border-3 hover:text-bone"
              >
                Contact & grievances
              </Link>
            </li>
          </ul>
        </nav>

        <article className="min-w-0">
          {legal.sections.map((s, i) => (
            <section key={s.heading} className="mb-11">
              <h2 className="flex items-baseline gap-4 font-display text-[22px] leading-tight text-bone">
                <span className="font-mono text-[12px] text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.heading}
              </h2>
              <div className="mt-4 flex flex-col gap-4 border-l border-border pl-6">
                {s.body.map((p, j) => (
                  <p key={j} className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          {/* Entity block. Renders only what is actually known. */}
          <section className="rounded-lg border border-border bg-surface/40 p-6">
            <p className="label mb-4 text-primary/50">The entity behind this site</p>
            <dl className="grid gap-4 sm:grid-cols-2">
              {company.legalName && <Fact k="Legal name" v={company.legalName} />}
              {company.cin && <Fact k="CIN" v={company.cin} mono />}
              {company.gstin && <Fact k="GSTIN" v={company.gstin} mono />}
              {company.registeredAddress && (
                <Fact k="Registered office" v={formatAddress(company.registeredAddress)} />
              )}
              {company.supportEmail && <Fact k="Email" v={company.supportEmail} />}
              {company.supportPhone && <Fact k="Phone" v={company.supportPhone} mono />}
            </dl>

            {!company.legalName && (
              <p className="text-[13.5px] leading-relaxed text-muted">
                Entity details are published on the{" "}
                <Link href="/contact" className="text-primary hover:text-primary-hover">
                  contact page
                </Link>
                .
              </p>
            )}
          </section>
        </article>
      </div>
    </>
  );
}

function Fact({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="label text-muted">{k}</dt>
      <dd className={`mt-1.5 text-[13.5px] text-bone ${mono ? "font-mono tracking-[0.04em]" : ""}`}>
        {v}
      </dd>
    </div>
  );
}
