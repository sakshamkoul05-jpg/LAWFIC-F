import type { Metadata } from "next";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { plans, pricingCommitments, pricingFaq } from "@/lib/pricing";
import {
  ANNUAL_MONTHS_CHARGED,
  GST_RATE,
  annualNeedsAfa,
  autopayable,
  cancellation,
  membershipFor,
  paidPlans,
  priceFor,
} from "@/lib/subscription";
import { services } from "@/lib/services";
import Reveal from "@/components/ui/Reveal";
import TrustStrip from "@/components/marketing/TrustStrip";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pay per filing with no subscription, or a monthly plan for recurring compliance. Government fees are always shown separately from ours.",
};

export default function PricingPage() {
  /* The one tier with no price, pulled out by id rather than by position so
     reordering the ladder cannot silently promote a paid plan into this slot. */
  const freePlan = plans.find((p) => p.monthlyPaise === null)!;

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

      {/* THE LADDER AS A TABLE, NOT AS SEVEN CARDS.
          Six paid tiers plus the free one is seven near-identical bulleted
          lists if they are cards, and a reader compares them by scrolling
          sideways and remembering. As rows they are read down one column —
          "what does this cost", "what do I get", "can I put it on autopay" —
          which is the question a pricing page is actually asked.

          Both periods are columns rather than a toggle. A toggle hides half
          the information behind a click and makes the yearly saving something
          you have to go looking for; with six rows there is room to show it. */}
      <section id="join" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <caption className="sr-only">
                LAWFIC membership tiers, monthly and yearly, with the amount debited
                including GST
              </caption>
              <thead>
                <tr className="border-b-2 border-border-3">
                  <th scope="col" className="type-label pb-3 pr-5 text-muted">
                    Membership
                  </th>
                  <th scope="col" className="type-label pb-3 pr-5 text-muted">
                    Off all
                  </th>
                  <th scope="col" className="type-label pb-3 pr-5 text-muted">
                    Included each month
                  </th>
                  <th scope="col" className="type-label whitespace-nowrap pb-3 pr-5 text-right text-muted">
                    Monthly
                  </th>
                  <th scope="col" className="type-label whitespace-nowrap pb-3 pr-5 text-right text-muted">
                    Yearly
                  </th>
                  <th scope="col" className="type-label whitespace-nowrap pb-3 text-muted">
                    Autopay
                  </th>
                </tr>
              </thead>
              <tbody>
                {paidPlans().map((plan) => {
                  const member = membershipFor(plan.id);
                  const monthly = priceFor(plan.monthlyPaise, "monthly");
                  const annual = priceFor(plan.monthlyPaise, "annual");
                  const yearlyAutopay = autopayable(plan.monthlyPaise, "annual");
                  const included = member?.includedMonthly ?? [];

                  return (
                    <tr
                      key={plan.id}
                      className={`border-b border-border align-top ${
                        plan.featured ? "bg-primary-light/40" : ""
                      }`}
                    >
                      <th scope="row" className="py-4 pr-5 font-normal">
                        <span className="block text-[14.5px] font-semibold text-foreground">
                          {plan.name}
                          {plan.featured && (
                            <span className="type-data ml-2 text-[10px] text-primary">
                              POPULAR
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block max-w-[26ch] text-[12px] leading-relaxed text-muted">
                          {plan.tagline}
                        </span>
                      </th>

                      <td className="type-data py-4 pr-5 text-[15px] text-foreground">
                        {member?.discountPercent}%
                      </td>

                      <td className="py-4 pr-5 text-[12.5px] leading-relaxed text-muted">
                        {included.length > 0 ? (
                          included.map((i) => i.label).join(" · ")
                        ) : (
                          /* The perks, rather than a dash. An empty cell on a
                             pricing table reads as an omission, and these
                             tiers do buy something — it is just not a filing. */
                          <span className="text-subtle">
                            {member?.perks?.join(" · ") ?? "—"}
                          </span>
                        )}
                      </td>

                      {/* The fee is the large figure and the debited total sits
                          under it: the total is what leaves the account, the
                          fee is what gets compared against another firm. */}
                      <td className="whitespace-nowrap py-4 pr-5 text-right">
                        <span className="type-data block text-[15px] text-foreground">
                          {formatPaise(monthly.feePaise)}
                        </span>
                        <span className="type-data mt-0.5 block text-[11px] text-muted">
                          {formatPaise(monthly.totalPaise)} debited
                        </span>
                      </td>

                      <td className="whitespace-nowrap py-4 pr-5 text-right">
                        <span className="type-data block text-[15px] text-foreground">
                          {formatPaise(annual.feePaise)}
                        </span>
                        <span className="type-data mt-0.5 block text-[11px] text-muted">
                          {formatPaise(annual.totalPaise)} debited
                        </span>
                        <span className="mt-1 block text-[11px] text-success">
                          saves {formatPaise(annual.savingPaise)}
                        </span>
                      </td>

                      {/* THE COLUMN THAT EXISTS BECAUSE OF THE RBI CEILING.
                          Monthly can be mandated on every tier. Yearly cannot:
                          ten months of fee plus GST has to land under ₹15,000
                          and the top two do not. Saying so here means the
                          customer chooses knowing it, instead of finding out
                          at their bank's screen. */}
                      <td className="py-4 text-[12px] leading-relaxed">
                        <span className="block text-foreground">Monthly ✓</span>
                        <span
                          className={
                            yearlyAutopay ? "block text-foreground" : "block text-muted"
                          }
                        >
                          Yearly {yearlyAutopay ? "✓" : "— one payment"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <p className="mt-5 max-w-3xl text-[12.5px] leading-relaxed text-subtle">
            Fees shown are LAWFIC&rsquo;s professional fee. GST at{" "}
            {Math.round(GST_RATE * 100)}% is added and appears on every invoice; the
            &ldquo;debited&rdquo; figure is what leaves your account. Government fees are
            never inside a membership price — they are passed through at cost on their
            own line. A yearly membership charges {ANNUAL_MONTHS_CHARGED} months
            instead of 12.
          </p>
          <p className="mt-3 max-w-3xl text-[12.5px] leading-relaxed text-subtle">
            Autopay runs on UPI Autopay or your card under the RBI&rsquo;s e-mandate
            rules, which cap an unattended recurring debit at ₹15,000. Every monthly
            membership is comfortably under that. The yearly price on{" "}
            {annualNeedsAfa()
              .map((id) => paidPlans().find((p) => p.id === id)?.name)
              .filter(Boolean)
              .join(" and ")}{" "}
            is over it, so those two are paid once a year with your approval rather than
            by standing instruction. Either way nothing is taken without you
            authorising it first.
          </p>
        </Reveal>

        {/* The free tier is not a row. It has no price, no discount and no
            allowance, so three of six columns would be dashes — and it is the
            honest default rather than the cheapest option, which a table
            sorted by price cannot say. */}
        <Reveal delay={0.08}>
          <div className="mt-10 border border-border bg-surface p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="type-h2 text-foreground">{freePlan.name}</h2>
              <p className="type-data text-[24px] text-primary">₹0</p>
            </div>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
              {freePlan.tagline} {freePlan.bestFor}
            </p>
            <Link
              href={freePlan.cta.href}
              className="mt-5 inline-block rounded-full border border-border px-6 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-primary"
            >
              {freePlan.cta.label}
            </Link>
          </div>
        </Reveal>

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

      {/* RENEWAL AND CANCELLATION, BEFORE THE COMMITMENTS AND BEFORE THE FAQ.
          Not in a policy page and not at the bottom. The CCPA's dark-pattern
          guidelines require the renewal amount, its frequency and the way out
          to be disclosed AT THE POINT OF SUBSCRIPTION, and "subscription
          trap" — easy to join, hard to leave — is one of the thirteen patterns
          they name. A page that sells a recurring charge and explains it six
          screens later has met the letter of nothing. */}
      <section
        aria-labelledby="renewal-heading"
        className="border-y border-border bg-surface/40"
      >
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <Reveal>
            <p className="type-label text-primary">Before you subscribe</p>
            <h2 id="renewal-heading" className="type-h1 mt-5 max-w-2xl text-foreground">
              {cancellation.heading}
            </h2>
          </Reveal>

          <ul className="mt-10 grid max-w-4xl gap-x-10 gap-y-5 sm:grid-cols-2">
            {cancellation.points.map((point, i) => (
              <Reveal key={point} delay={i * 0.05}>
                <li className="flex gap-3 text-[13.5px] leading-relaxed text-muted">
                  <span className="type-data mt-px shrink-0 text-[11px] text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {point}
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
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
