import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Document",
  description:
    "Aadhaar, PAN, GST, TAN and more — identity and compliance documents prepared, checked and filed for you.",
};

const slugs = ["aadhaar", "pan", "gst"];

export default function DocumentPage() {
  const items = slugs
    .map((s) => services.find((sv) => sv.slug === s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="label text-primary">Document</p>
      <h1 className="mt-4 font-display text-[clamp(30px,4.6vw,48px)] leading-tight text-foreground">
        Your identity and compliance documents
      </h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted">
        Aadhaar, PAN, GST and more — prepared, checked and filed so the first submission is the
        one that sticks.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <Link
            key={s.slug}
            href={`/services/${s.slug}`}
            className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary hover:bg-surface-2"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
              {s.category}
            </p>
            <h2 className="mt-2 font-display text-[20px] text-foreground">{s.name}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{s.tagline}</p>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="text-[13px] font-medium text-foreground tabular-nums">
                {s.fee.professional}
              </span>
              <span className="text-[11px] text-muted">{s.turnaround}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-dashed border-border-3 bg-surface p-8 text-center">
        <h2 className="font-display text-[20px] text-foreground">More document services soon</h2>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] text-muted">
          TAN, Digital Signature and Voter ID are on their way. If you need one now, get in touch
          and we will add it to your desk.
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
