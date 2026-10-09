import type { Metadata } from "next";
import Link from "next/link";
import MarriageRoutes from "@/components/documents/MarriageRoutes";
import DocumentSpecimen from "@/components/motion/DocumentSpecimen";
import RequestForm from "@/components/site/RequestForm";

/**
 * Marriage certificate.
 *
 * Most of the confusion about marriage registration is which law it falls
 * under, and that is decided by two facts. The page asks those two questions
 * first and shows only the route that applies.
 */

export const metadata: Metadata = {
  title: "Marriage certificate — Hindu Marriage Act or Special Marriage Act",
  description:
    "Two questions tell you which law your marriage is registered under, what to bring, how many witnesses and how long it takes — including the Special Marriage Act's 30-day notice.",
  alternates: { canonical: "/document/marriage-certificate" },
};

const USES = [
  { title: "Passport and visas", body: "Adding a spouse's name to a passport, and nearly every spouse or family visa." },
  { title: "Bank, insurance and nomination", body: "Joint accounts, claims and changing a surname with financial institutions." },
  { title: "Property and succession", body: "Proving the relationship when an estate is settled." },
];

export default function MarriageCertificatePage() {
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
          Marriage certificate
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
          Which law you register under decides everything else — the papers, the witnesses, whether there is a 30-day
          wait. Two questions settle it.
        </p>
        <div className="mt-12">
          <MarriageRoutes />
        </div>
      </section>

      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">Where you will be asked for it</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-3">
            {USES.map((u) => (
              <div key={u.title}>
                <h3 className="text-[16px] font-medium text-foreground">{u.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-start">
        <div>
          <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-foreground">Ask us to handle it</h2>
          <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-muted">
            We prepare the application and affidavits, book the appointment and tell you exactly who needs to come.
            Government fee and ours, quoted separately before anything is charged.
          </p>
          <div className="mt-7">
            <RequestForm slug="marriage-certificate" label="a marriage certificate" />
          </div>
          <p className="mt-8 text-[12px] leading-relaxed text-subtle">
            Hindu Marriage Act 1955, Special Marriage Act 1954 and Indian Christian Marriage Act 1872, as of October
            2026. Witness and document rules vary by state; we confirm yours before you go. LAWFIC is a private
            consultancy and does not solemnise or register marriages.
          </p>
        </div>
        <DocumentSpecimen slug="marriage-certificate" />
      </section>
    </>
  );
}
