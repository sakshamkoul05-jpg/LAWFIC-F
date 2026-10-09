import type { Metadata } from "next";
import Link from "next/link";
import PassportBooklet from "@/components/documents/PassportBooklet";
import RequestForm from "@/components/site/RequestForm";

/**
 * Passport application.
 *
 * The journey is five steps and every applicant takes the same five, so the
 * page is a booklet you turn through — each page stamps its step — with the
 * fee beside it, calculated live from the 2026 schedule.
 */

export const metadata: Metadata = {
  title: "Passport application — steps, Tatkaal and the 2026 fees",
  description:
    "A fresh passport in five steps, from the online form to Speed Post — with the government fee for normal and Tatkaal, adults and minors, as revised from 1 July 2026.",
  alternates: { canonical: "/document/passport-application" },
};

const TRIPS = [
  {
    title: "Names that do not match",
    body: "Your name split one way on the birth certificate and another on your school certificate is the single most common reason for a second visit. We line them up before you apply.",
  },
  {
    title: "An address you have just moved to",
    body: "Police verification happens where you live now. A rent agreement or utility bill in your name at that address saves weeks.",
  },
  {
    title: "Tatkaal is about the queue, not the rules",
    body: "Tatkaal shortens the wait for printing. The documents are the same, and an appointment is still needed.",
  },
];

export default function PassportPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-subtle">
          <Link href="/document" className="hover:text-primary">
            Documents
          </Link>{" "}
          / <span className="text-muted">Identity and PAN</span>
        </nav>
        <h1 className="mt-6 max-w-3xl text-[clamp(2.2rem,5vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.04em] text-foreground">
          Passport, page by page
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
          Five steps, the same for everyone. Open the booklet and turn through them, and work out the government fee
          for your case alongside.
        </p>
        <div className="mt-12">
          <PassportBooklet />
        </div>
      </section>

      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">What sends people back for a second visit</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-3">
            {TRIPS.map((t) => (
              <div key={t.title}>
                <h3 className="text-[16px] font-medium text-foreground">{t.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-foreground">Ask us to prepare it</h2>
        <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-muted">
          We fill the form, check every document against it, book the appointment and tell you exactly what to carry.
          Our fee is quoted separately from the government&apos;s before you pay anything.
        </p>
        <div className="mt-7">
          <RequestForm slug="passport-application" label="a passport application" />
        </div>
        <p className="mt-8 text-[12px] leading-relaxed text-subtle">
          Fees as revised by the Ministry of External Affairs from 1 July 2026. Timelines are typical, not promised —
          police verification and printing are outside our control. LAWFIC is a private consultancy, not affiliated with
          the Passport Seva programme. Already have a passport?{" "}
          <Link href="/document/passport-reissue" className="text-primary hover:underline">
            Reissue
          </Link>
          .
        </p>
      </section>
    </>
  );
}
