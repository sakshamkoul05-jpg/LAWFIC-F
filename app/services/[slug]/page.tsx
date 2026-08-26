import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, services } from "@/lib/services";
import ServiceVisual from "@/components/motion/ServiceVisual";
import Reveal from "@/components/ui/Reveal";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return { title: service.name, description: service.tagline };
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== slug);

  return (
    <>
      {/* ---------- hero with the signature animation ---------- */}
      <section className="grain bloom relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-24">
          <div className="relative z-2">
            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/services" className="label text-slate hover:text-bone">
                  Services
                </Link>
                <span className="label text-line-3">/</span>
                <p className="label text-brass">{service.category}</p>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-6 font-display text-[clamp(33px,4.8vw,52px)] leading-[1.07] text-bone">
                {service.name}
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ash">
                {service.tagline}
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <dl className="mt-9 grid max-w-md grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line">
                <div className="bg-ink-2 px-5 py-4">
                  <dt className="label text-slate">Government fee</dt>
                  <dd className="mt-1.5 text-[13.5px] leading-snug text-ash">
                    {service.fee.government}
                  </dd>
                </div>
                <div className="bg-ink-2 px-5 py-4">
                  <dt className="label text-slate">Our professional fee</dt>
                  <dd className="mt-1.5 font-display text-[22px] text-brass tnum">
                    {service.fee.professional}
                  </dd>
                </div>
              </dl>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-hi"
                >
                  Start this filing
                </Link>
                <span className="text-[13px] text-slate">
                  {service.turnaround} · nothing charged until we quote
                </span>
              </div>
            </Reveal>
          </div>

          <div className="relative z-2">
            <ServiceVisual slug={service.slug} />
          </div>
        </div>
      </section>

      {/* ---------- summary + who ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <div>
              <p className="label text-brass">What it is</p>
              <p className="mt-6 text-[18px] leading-relaxed text-bone">{service.summary}</p>

              {service.advisoryOnly && (
                <div className="mt-8 rounded border border-line-2 bg-surface/50 p-5">
                  <p className="label mb-2.5 text-brass-lo">What we do, and what we don't</p>
                  <p className="max-w-2xl text-[13.5px] leading-relaxed text-ash">
                    LAWFIC prepares your paperwork and books your appointment. We do not perform
                    Aadhaar authentication or eKYC, we do not access any government database, and
                    we are not affiliated with UIDAI. Biometric steps always happen in person, at
                    an authorised centre.
                  </p>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div>
              <p className="label text-brass">Who needs it</p>
              <ul className="mt-6 flex flex-col gap-3.5">
                {service.who.map((w) => (
                  <li key={w} className="flex gap-3 text-[14.5px] leading-relaxed text-ash">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-brass" aria-hidden />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- process ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <Reveal>
          <p className="label text-brass">How it runs</p>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(26px,3.4vw,36px)] leading-tight text-bone">
            {service.steps.length} stages, and you can see where you are in all of them
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
          {service.steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <li className="flex h-full flex-col bg-ink-2 p-7">
                <span className="font-mono text-[12px] tracking-[0.14em] text-brass">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-[19px] leading-snug text-bone">{s.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ash">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------- documents ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid gap-12 rounded-lg border border-line bg-surface/35 p-8 sm:p-10 lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <div>
              <p className="label text-brass">What we need from you</p>
              <p className="mt-5 max-w-sm text-[14.5px] leading-relaxed text-ash">
                Send these when you start. If something is missing we will tell you before you pay,
                not after.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <ul className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
              {service.documents.map((d) => (
                <li key={d} className="flex items-start gap-3 bg-ink-2 px-5 py-4 text-[14px] leading-relaxed text-ash">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="mt-0.5 shrink-0" aria-hidden>
                    <rect x="2.5" y="1.5" width="10" height="12" rx="1.5" stroke="var(--color-brass-lo)" strokeWidth="1.1" />
                    <path d="M5 5.5h5M5 8h5M5 10.5h3" stroke="var(--color-brass-lo)" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                  {d}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------- faq ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <Reveal>
          <p className="label text-brass">Questions people actually ask</p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-px overflow-hidden rounded-lg border border-line bg-line">
          {service.faq.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <div className="grid gap-4 bg-ink-2 p-7 md:grid-cols-[1fr_1.4fr] md:gap-10 md:p-8">
                <h3 className="font-display text-[19px] leading-snug text-bone">{f.q}</h3>
                <p className="text-[14.5px] leading-relaxed text-ash">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- other services ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <p className="label mb-8 text-slate">Other services</p>
          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} href={`/services/${o.slug}`} className="card group border-0! p-6">
                <p className="label text-brass">{o.category}</p>
                <h3 className="mt-3 font-display text-[19px] text-bone">{o.name}</h3>
                <p className="mt-2 font-mono text-[13px] text-slate tnum">{o.fee.professional}</p>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
