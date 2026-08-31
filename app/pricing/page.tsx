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
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <Reveal>
            <p className="label text-primary">Pricing</p>
            <h1 className="mt-6 max-w-3xl font-display text-[clamp(34px,5.4vw,56px)] leading-[1.06] text-foreground">
              You will never find a charge on your invoice you were not shown first.
            </h1>
            <p className="mt-7 max-w-2xl text-[16.5px] leading-relaxed text-muted">
              Start with no subscription at all and pay per filing. Move to a monthly plan when the
              returns become routine. Either way, the government&apos;s fee and ours stay on
              separate lines.
            </p>
          </Reveal>
        </div>
      </section>

      {/* plans */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.07}>
              <div
                className={`relative flex h-full flex-col overflow-hidden rounded-xl border p-7 ${
                  plan.featured
                    ? "border-primary bg-surface shadow-lg"
                    : "border-border bg-surface"
                }`}
              >
                {plan.featured && (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                    <span className="label absolute right-5 top-5 rounded-full border border-primary/30 bg-primary-light px-2.5 py-1 text-primary">
                      Most chosen
                    </span>
                  </>
                )}

                <h2 className="font-display text-[24px] leading-tight text-foreground">{plan.name}</h2>
                <p className="mt-2.5 min-h-[42px] text-[14px] leading-relaxed text-muted">
                  {plan.tagline}
                </p>

                <div className="mt-6 border-y border-border py-5">
                  {plan.monthlyPaise === null ? (
                    <p className="font-display text-[34px] leading-none text-primary">₹0</p>
                  ) : (
                    <p className="font-display text-[34px] leading-none text-foreground tabular-nums">
                      {formatPaise(plan.monthlyPaise)}
                    </p>
                  )}
                  <p className="label mt-2.5 text-muted">{plan.priceNote}</p>
                </div>

                <p className="mt-5 text-[13px] leading-relaxed text-muted">{plan.bestFor}</p>

                <ul className="mt-6 flex flex-col gap-3">
                  {plan.includes.map((f) => (
                    <li key={f} className="flex gap-3 text-[14px] leading-relaxed text-muted">
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="mt-1 shrink-0" aria-hidden>
                        <path d="m3.5 8.4 3 3 6-6.6" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.excludes && (
                  <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                    {plan.excludes.map((f) => (
                      <li key={f} className="flex gap-3 text-[12.5px] leading-relaxed text-subtle">
                        <span className="mt-2 h-px w-3 shrink-0 bg-border" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={plan.cta.href}
                  className={`mt-auto block rounded-full px-6 py-3 text-center text-sm font-medium transition-colors ${
                    plan.featured
                      ? "bg-primary text-white hover:bg-primary-hover"
                      : "border border-border text-foreground hover:border-primary"
                  } ${plan.excludes ? "mt-7" : "mt-7"}`}
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

      {/* what a filing actually costs */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <p className="label text-primary">Worked examples</p>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(26px,3.6vw,36px)] leading-tight text-foreground">
            What a filing actually costs, both halves shown
          </h2>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-muted">
            These are the live services. The government&apos;s figure is what the department
            charges — several are free at source and we say so rather than quietly absorbing it
            into our own line.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="bg-surface-2">
                  {["Service", "Government fee", "LAWFIC fee", "Turnaround"].map((h) => (
                    <th key={h} className="label border-b border-border px-6 py-4 text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.slug} className="border-b border-border last:border-0">
                    <td className="px-6 py-4">
                      <Link href={`/services/${s.slug}`} className="text-[14.5px] text-foreground hover:text-primary">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[13.5px] leading-snug text-muted">
                      {s.fee.government}
                    </td>
                    <td className="px-6 py-4 font-mono text-[14px] text-primary tabular-nums">
                      {s.fee.professional}
                    </td>
                    <td className="px-6 py-4 text-[13.5px] text-muted">{s.turnaround}</td>
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
          <p className="label text-primary">Our commitments on price</p>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(26px,3.6vw,36px)] leading-tight text-foreground">
            Four things we have put in writing
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border sm:grid-cols-2">
          {pricingCommitments.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.06}>
              <div className="flex h-full flex-col bg-surface p-7">
                <span className="font-mono text-[12px] tracking-[0.14em] text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-[20px] leading-snug text-foreground">{c.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* faq — directly under the plans, which is where the objections land */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal>
          <p className="label text-primary">Questions about billing</p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-px overflow-hidden rounded-lg border border-border">
          {pricingFaq.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <div className="grid gap-4 bg-surface p-7 md:grid-cols-[1fr_1.4fr] md:gap-10">
                <h3 className="font-display text-[18px] leading-snug text-foreground">{f.q}</h3>
                <p className="text-[14.5px] leading-relaxed text-muted">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-14 rounded-lg border border-border bg-surface px-8 py-10 text-center">
            <h3 className="font-display text-[24px] text-foreground">Not sure which fits?</h3>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Tell us what your business does and what you are already registered for. We will say
              which plan makes sense, including if that answer is none of them.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Talk to us
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
