import type { Metadata } from "next";
import Link from "next/link";
import ForYouStrip from "@/components/profile/ForYouStrip";
import { documents } from "@/lib/documents";

export const metadata: Metadata = {
  title: "Document",
  description:
    "Every identity card, certificate, agreement and registration we prepare — PAN, Aadhaar, passport, certificates, rent agreements and more.",
};

const groups = [
  "Identity & PAN",
  "Government Certificates",
  "Legal & Agreements",
  "Business & Tax",
] as const;

export default function DocumentPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="label text-primary">Document</p>
      <h1 className="mt-4 font-display text-[clamp(30px,4.6vw,48px)] leading-tight text-foreground">
        Your documents, from PAN to Power of Attorney
      </h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted">
        Every identity card, certificate, agreement and registration we prepare — checked, filed
        and followed up so the first submission is the one that sticks.
      </p>

      <ForYouStrip className="mt-10" />

      {groups.map((group) => {
        const items = documents.filter((d) => d.group === group);
        return (
          <div key={group} className="mt-12">
            <h2 className="text-[14px] font-semibold uppercase tracking-wide text-primary">
              {group}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((d) => (
                <div
                  key={d.slug}
                  className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary hover:bg-surface-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14.5px] font-semibold leading-snug text-foreground">
                      {d.label}
                    </h3>
                    {d.live && (
                      <span className="shrink-0 rounded-full bg-success-light px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-success">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{d.blurb}</p>
                  <div className="mt-4 pt-3">
                    {/* Every document now has somewhere to go: a full service
                        page when the filing flow exists, otherwise its own page
                        with the specimen. "Coming soon" used to sit here as
                        plain text, which made two-thirds of the catalogue a
                        dead end even though we have something to show. */}
                    <Link
                      href={d.href}
                      className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:text-primary-hover"
                    >
                      {d.live ? "View & start" : "See the document"}
                      <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-14 rounded-xl border border-dashed border-border-3 bg-surface p-8 text-center">
        <h2 className="font-display text-[20px] text-foreground">
          Need a document that is not listed?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] text-muted">
          We prepare more than we advertise. Tell us what you need and we will add it to your desk.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Ask about a document
        </Link>
      </div>
    </section>
  );
}
