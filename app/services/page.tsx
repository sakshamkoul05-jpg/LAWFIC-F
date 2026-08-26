import type { Metadata } from "next";
import Link from "next/link";
import { services, upcoming } from "@/lib/services";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Udyam, GST, PAN and Aadhaar services — what each one is, who needs it, what it costs and how long it takes.",
};

export default function ServicesIndex() {
  return (
    <>
      <section className="grain bloom relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <Reveal>
            <p className="label text-brass">Services</p>
            <h1 className="mt-6 max-w-3xl font-display text-[clamp(34px,5.4vw,56px)] leading-[1.06] text-bone">
              Every fee, every document and every timeline — before you sign in.
            </h1>
            <p className="mt-7 max-w-2xl text-[16.5px] leading-relaxed text-ash">
              We put the whole picture on the page. What the government charges, what we charge,
              what you need to send us, and what actually causes applications to be rejected.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-line bg-line">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.05}>
              <Link
                href={`/services/${s.slug}`}
                className="card group grid gap-6 border-0! p-7 md:grid-cols-[1.6fr_1fr_auto] md:items-center md:gap-10 md:p-8"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="label text-brass">{s.category}</p>
                    {s.advisoryOnly && (
                      <span className="label rounded-sm border border-line-3 px-1.5 py-1 text-slate">
                        Assistance only
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 font-display text-[26px] leading-tight text-bone">
                    {s.name}
                  </h2>
                  <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-ash">
                    {s.tagline}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-6 md:grid-cols-1 md:gap-4">
                  <div>
                    <dt className="label text-slate">Government fee</dt>
                    <dd className="mt-1 text-[13.5px] text-ash">{s.fee.government}</dd>
                  </div>
                  <div>
                    <dt className="label text-slate">Our fee</dt>
                    <dd className="mt-1 font-mono text-[15px] text-bone tnum">
                      {s.fee.professional}
                    </dd>
                  </div>
                </dl>

                <span className="flex items-center gap-2 text-[13px] text-brass transition-transform duration-300 group-hover:translate-x-1">
                  Open
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M2 7h9M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-14">
            <p className="label mb-5 text-slate">In build</p>
            <div className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {upcoming.map((u) => (
                <div key={u.name} className="bg-ink-2 px-6 py-5">
                  <p className="font-display text-[17px] text-ash">{u.name}</p>
                  <p className="mt-1.5 text-[13px] text-slate">{u.note}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
