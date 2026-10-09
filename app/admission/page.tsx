import type { Metadata } from "next";
import Link from "next/link";
import AdmissionPlanner from "@/components/admission/AdmissionPlanner";
import { STREAMS } from "@/lib/admission";

/**
 * Admission.
 *
 * What LAWFIC can actually do for a student is the paperwork — the category,
 * domicile and income certificates that counselling checks, and that are the
 * commonest reason a seat is lost after it was won. So the page is a planner
 * for exactly that, working back from counselling to the date to apply for
 * each certificate.
 *
 * The menu links to /admission#engineering and the like; those anchors sit at
 * the planner and the planner opens on that stream.
 */

export const metadata: Metadata = {
  title: "Admission — the certificates you need, and when to apply",
  description:
    "Engineering, medical, MBA or law: pick your stream and category and see which certificates counselling will ask for — EWS, OBC-NCL, caste, domicile — and the date to start each one.",
  alternates: { canonical: "/admission" },
};

export default function AdmissionPage() {
  return (
    <>
      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8">
        {STREAMS.map((s) => (
          <span key={s.id} id={s.id} className="absolute top-0 scroll-mt-24" aria-hidden />
        ))}
        <p className="max-w-xl text-[15px] leading-relaxed text-muted">
          You have prepared for the exam. Do not lose the seat to a certificate. Choose your stream.
        </p>
        <div className="mt-6">
          <AdmissionPlanner />
        </div>
      </section>

      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">The year at a glance</h2>
          <p className="mt-2 max-w-2xl text-[13.5px] text-muted">
            Typical months. Each conducting body announces its own dates every year — always go by the official
            notice.
          </p>
          <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STREAMS.map((s) => (
              <div key={s.id}>
                <h3 className="text-[16px] font-medium text-foreground">{s.name}</h3>
                <dl className="mt-3 grid gap-2">
                  {s.exams.map((e) => (
                    <div key={e.name}>
                      <dt className="text-[13.5px] text-foreground">{e.name}</dt>
                      <dd className="text-[12.5px] text-muted">{e.when}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="text-[13.5px] text-foreground">Counselling</dt>
                    <dd className="text-[12.5px] text-muted">{s.counselling.replace(/^.*?,\s*/, "")}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-foreground">Have us prepare them together</h2>
            <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-muted">
              One request, every certificate on your timeline, each checked so the names and dates match your
              marksheets. We tell you the government fee and ours before anything is charged.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link
              href="/instant-help"
              className="rounded-full bg-primary px-6 py-3 text-[14px] font-medium text-background transition-colors hover:bg-primary-hover"
            >
              Talk to an admissions expert
            </Link>
            <Link
              href="/document"
              className="rounded-full border border-border px-6 py-3 text-[14px] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              See every certificate
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
