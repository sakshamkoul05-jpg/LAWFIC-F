import type { Metadata } from "next";
import Link from "next/link";
import BirthClock from "@/components/documents/BirthClock";
import DocumentSpecimen from "@/components/motion/DocumentSpecimen";
import RequestForm from "@/components/site/RequestForm";

/**
 * Birth certificate.
 *
 * The page is built around the one fact that decides everything else: how
 * long after the birth you are registering. Registered inside 21 days it is a
 * form; a year later it is a magistrate's order. The dial makes that visible
 * before the customer has read a word of law.
 */

export const metadata: Metadata = {
  title: "Birth certificate — registration, late registration and copies",
  description:
    "Register a birth, register one late, add a child's name or get a certified copy. See exactly what applies — 21 days, a month, a year or more after the birth.",
  alternates: { canonical: "/document/birth-certificate" },
};

const SITUATIONS = [
  {
    title: "The birth is registered, you need the certificate",
    body: "We find the registration, apply for certified copies and collect them. Ask for several — banks, schools and the passport office each keep one.",
  },
  {
    title: "The child's name is missing",
    body: "A certificate issued without a name can have it added free within 12 months of registration, and with a late fee for up to 15 years after that.",
  },
  {
    title: "Something on it is wrong",
    body: "A spelling, a parent's name, a date. The registrar corrects it on proof of the right entry; we prepare the application and the supporting affidavit.",
  },
];

export default function BirthCertificatePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-subtle">
          <Link href="/document" className="hover:text-primary">
            Documents
          </Link>{" "}
          / <span className="text-muted">Government certificates</span>
        </nav>
        <h1 className="mt-6 max-w-3xl text-[clamp(2.2rem,5vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.04em] text-foreground">
          Birth certificate
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
          What it takes depends on one thing: how long ago the birth was. Turn the dial to the right moment and see who
          signs, what to bring and how long it takes.
        </p>
        <div className="mt-12">
          <BirthClock />
        </div>
      </section>

      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-3">
          {SITUATIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">{s.title}</h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-start">
        <div>
          <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-foreground">Ask us to handle it</h2>
          <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-muted">
            Tell us the date and place of birth. We quote the government fee and ours separately before anything is
            charged, and you can say no.
          </p>
          <div className="mt-7">
            <RequestForm slug="birth-certificate" label="a birth certificate" />
          </div>
          <p className="mt-8 text-[12px] leading-relaxed text-subtle">
            Rules under the Registration of Births and Deaths Act, 1969 as amended in 2023, as of October 2026. Late
            fees are set by each state. LAWFIC is a private consultancy and does not register births; the registrar
            does.
          </p>
        </div>
        <DocumentSpecimen slug="birth-certificate" />
      </section>
    </>
  );
}
