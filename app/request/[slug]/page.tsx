import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { allServices } from "@/lib/catalogue";
import { services } from "@/lib/services";
import RequestForm from "@/components/site/RequestForm";
import { PageShell } from "@/components/compliance/ui";

/**
 * A request page for any catalogue service that has no written page yet.
 *
 * The compliance calendar, the renewal tracker and the eligibility checker all
 * end in "get it done" — for GST returns, ROC filings, TDS, an FSSAI renewal.
 * Most of those are "soon" in the catalogue: there is no service page to send
 * someone to, but LAWFIC will still take the work on and quote it. This is the
 * honest version of that: the request form and nothing that pretends to be a
 * finished product page.
 */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = allServices.find((s) => s.slug === slug);
  return entry
    ? { title: `Request: ${entry.name}`, description: entry.blurb, robots: { index: false, follow: true } }
    : {};
}

export default async function RequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (services.some((s) => s.slug === slug)) redirect(`/services/${slug}`);
  const entry = allServices.find((s) => s.slug === slug);
  if (!entry) notFound();

  return (
    <PageShell
      eyebrow={entry.categoryName}
      title={entry.name}
      lead={
        <>
          {entry.blurb}. Tell us what you need and we will quote the government fee and ours, separately, before
          anything is charged. You can decline and pay nothing.
        </>
      }
      crumbs={[
        { label: "Services", href: "/services" },
        { label: entry.name, href: `/request/${slug}` },
      ]}
      width="max-w-3xl"
    >
      <RequestForm slug={entry.slug} label={entry.name} />
      <p className="mt-6 text-[12.5px] text-muted">
        Not sure this is the right thing?{" "}
        <Link href="/instant-help" className="text-primary underline-offset-4 hover:underline">
          Book 15 minutes with an expert
        </Link>{" "}
        or{" "}
        <Link href="/tools/eligibility" className="text-primary underline-offset-4 hover:underline">
          check what your business needs
        </Link>
        .
      </p>
    </PageShell>
  );
}
