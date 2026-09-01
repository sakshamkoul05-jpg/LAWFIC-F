import type { Metadata } from "next";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { plans, pricingCommitments, pricingFaq } from "@/lib/pricing";
import { services } from "@/lib/services";
import Reveal from "@/components/ui/Reveal";
import TrustStrip from "@/components/marketing/TrustStrip";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pay per filing with no subscription, or a monthly plan for recurring compliance. Government fees are always shown separately from ours.",
};

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_50%_50%,rgba(201,168,76,0.05),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <Reveal>
            <p className="type-label text-primary">Pricing</p>
            <h1 className="type-display mt-6 max-w-3xl text-foreground">
              You will never find a charge on your invoice you were not shown first.
            </h1>
            <p className="type-body mt-7 max-w-2xl text-muted">
              Start with no subscription at all and pay per filing. Move to a monthly plan when the
              returns become routine. Either way, the government&apos;s fee and ours stay on
              separate lines.
            </p>
          </Reveal>
        </div>
      </section>

      {/* plans */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-px border border-border lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.07}>
              <div
                className={`relative flex h-full flex-col bg-surface p-7 ${
                  plan.featured ? "ring-1 ring-primary" : ""
                }`}
              >
                {plan.featured && (
                  <span className="type-data absolute right-5 top-5 text-[10px] text-primary">
                    Popular
                  </span>
                )}

                <h2 className="type-h2 text-foreground">{plan.name}</h2>
                <p className="mt-2.5 min-h-[42px] text-[13px] leading-relaxed text-muted">
                  {plan.tagline}
                </p>

                <div className="mt-6 border-y border-border py-5">
                  {plan.monthlyPaise === null ? (
                    <p className="type-data text-[36px] text-primary">₹0</p>
                  ) : (
                    <p className="type-data text-[36px] text-foreground">
                      {formatPaise(plan.monthlyPaise)}
                    </p>
                  )}
                  <p className="type-label mt-2.5">{plan.priceNote}</p>
                </div>

                <p className="mt-5 text-[13px] leading-relaxed text-muted">{plan.bestFor}</p>

                <ul className="mt-6 flex flex-col gap-3">
                  {plan.includes.map((f) => (
                    <li key={f} className="flex gap-3 text-[13px] leading-relaxed text-muted">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden>
                        <path d="m3.5 8.4 3 3 6-6.6" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.excludes && (
                  <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                    {plan.excludes.map((f) => (
                      <li key={f} className="flex gap-3 text-[12px] leading-relaxed text-subtle">
                        <span className="mt-2 h-px w-3 shrink-0 bg-border" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={plan.cta.href}
                  className={`mt-7 block rounded-full px-6 py-3 text-center text-[13px] font-medium transition-colors ${
                    plan.featured
                      ? "bg-primary text-white hover:bg-primary-hover"
                      : "border border-border text-foreground hover:border-primary"
                  }`}
                >
                  {plan.cta.label}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6">
            <TrustStrip />
          </div>
        </Reveal>
      </section>

      {/* worked examples */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <p className="type-label text-primary">Worked examples</p>
          <h2 className="type-h1 mt-5 max-w-2xl text-foreground">
            What a filing actually costs, both halves shown
          </h2>
          <p className="type-body mt-5 max-w-2xl text-muted">
            These are the live services. The government&apos;s figure is what the department
            charges — several are free at source and we say so rather than quietly absorbing it
            into our own line.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 overflow-x-auto border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="bg-surface-2">
                  {["Service", "Government fee", "LAWFIC fee", "Turnaround"].map((h) => (
                    <th key={h} className="type-label border-b border-border px-6 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.slug} className="border-b border-border last:border-0">
                    <td className="px-6 py-4">
                      <Link href={`/services/${s.slug}`} className="text-[13px] text-foreground hover:text-primary transition-colors">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-muted">
                      {s.fee.government}
                    </td>
                    <td className="type-data px-6 py-4 text-[13px] text-primary">
                      {s.fee.professional}
                    </td>
                    <td className="type-data px-6 py-4 text-[13px] text-muted">{s.turnaround}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* commitments */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <p className="type-label text-primary">Our commitments on price</p>
          <h2 className="type-h1 mt-5 max-w-2xl text-foreground">
            Four things we have put in writing
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden border border-border sm:grid-cols-2">
          {pricingCommitments.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.06}>
              <div className="flex h-full flex-col bg-surface p-7">
                <span className="type-data text-[13px] text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="type-h3 mt-4 text-foreground">{c.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-muted">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* faq */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal>
          <p className="type-label text-primary">Questions about billing</p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-px overflow-hidden border border-border">
          {pricingFaq.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <div className="grid gap-4 bg-surface p-7 md:grid-cols-[1fr_1.4fr] md:gap-10">
                <h3 className="type-h3 text-foreground">{f.q}</h3>
                <p className="text-[13px] leading-relaxed text-muted">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-14 border border-border bg-surface px-8 py-12 text-center">
            <h3 className="type-h2 text-foreground">Not sure which fits?</h3>
            <p className="type-body mx-auto mt-4 max-w-md text-muted">
              Tell us what your business does and what you are already registered for. We will say
              which plan makes sense, including if that answer is none of them.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Talk to us
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
