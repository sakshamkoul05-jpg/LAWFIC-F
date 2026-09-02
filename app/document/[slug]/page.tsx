import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { documents } from "@/lib/documents";
import { getSpecimen } from "@/lib/specimens";
import DocumentSpecimen from "@/components/motion/DocumentSpecimen";
import RequestForm from "@/components/site/RequestForm";

/**
 * A page per document.
 *
 * Documents without a full service page used to link to `/document#slug`, an
 * anchor pointing at nothing — every one of them was a dead end. Each now has
 * a real page carrying its specimen, so the catalogue is navigable end to end
 * whether or not LAWFIC has built the filing flow behind it yet.
 *
 * Documents that DO have a service page are redirected there instead, because
 * that page is better: it has the hand-drawn animation, the fee split and the
 * form. There is no reason to show someone a lesser version of a page that
 * already exists.
 */

export function generateStaticParams() {
  return documents.filter((d) => !d.live).map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = documents.find((d) => d.slug === slug);
  if (!doc) return {};
  return { title: doc.label, description: doc.blurb };
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = documents.find((d) => d.slug === slug);
  if (!doc) notFound();

  const specimen = getSpecimen(slug);

  return (
    <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
      <nav aria-label="Breadcrumb" className="type-label text-subtle">
        <Link href="/document" className="hover:text-primary">
          Document
        </Link>{" "}
        / <span className="text-muted">{doc.group}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
        <div>
          <h1 className="type-h1 text-foreground">{doc.label}</h1>
          <p className="mt-5 text-[16px] leading-relaxed text-muted">{doc.blurb}</p>

          {/* The explanation lives under the specimen, where the thing it
              explains is visible. Repeating it here read as a stutter. */}

          <div className="mt-8">
            <RequestForm slug={doc.slug} label={doc.label} />
          </div>

          <Link
            href="/services"
            className="mt-5 inline-block text-[13px] text-muted underline-offset-4 hover:text-primary hover:underline"
          >
            Browse all services
          </Link>

          <p className="mt-6 text-[12px] leading-relaxed text-subtle">
            LAWFIC is a private consultancy. We prepare and file paperwork in your name. We
            are not affiliated with UIDAI, the Income Tax Department, GSTN, FSSAI or any
            government body, and government fees are payable to the government.
          </p>
        </div>

        <div className="lg:pt-2">
          {specimen ? (
            <DocumentSpecimen slug={slug} />
          ) : (
            <p className="rounded-xl border border-border bg-surface p-5 text-[13px] text-muted">
              We are still writing this page.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
