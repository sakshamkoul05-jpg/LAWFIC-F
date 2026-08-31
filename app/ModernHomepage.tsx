import Link from "next/link";
import { services } from "@/lib/services";
import { categories, totalServices } from "@/lib/catalogue";
import CategoryIcon from "@/components/site/CategoryIcon";
import Reveal from "@/components/ui/Reveal";
import ProductShot from "@/components/marketing/ProductShot";
import TrustStrip, { TrustRow } from "@/components/marketing/TrustStrip";
import { plans } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";

/**
 * Modern theme homepage — hero-based, clean, spacious.
 */
export default function ModernHomepage() {
  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-14 pt-14 sm:px-8 lg:grid-cols-[1fr_1.08fr] lg:pb-16 lg:pt-16">
          <div className="relative z-2">
            <Reveal>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="label rounded-full border border-border bg-surface-2 px-3 py-1.5 text-primary">
                  {totalServices} services · {categories.length} categories
                </span>
                <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success-light px-3 py-1.5">
                  <span className="size-1.5 rounded-full bg-success" aria-hidden />
                  <span className="label text-success">Wallet & tracking live</span>
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-6 font-display text-[clamp(34px,5vw,54px)] leading-[1.05] tracking-[-0.01em] text-foreground">
                Registrations and licences,
                <br className="hidden sm:block" /> without the surprise invoice.
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-lg text-[16.5px] leading-relaxed text-muted">
                Udyam, GST, PAN and Aadhaar — filed in your name by people who know why
                applications get rejected. You see the government&apos;s fee and ours as two
                separate lines, and you owe nothing until you have seen both.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/services"
                  className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Start a filing — free
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-full border border-border px-6 py-3 text-sm text-foreground transition-colors hover:border-primary"
                >
                  See pricing
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-8 border-t border-border pt-6">
                <TrustRow />
              </div>
            </Reveal>
          </div>

          <div className="relative z-2">
            <ProductShot />
          </div>
        </div>
      </section>

      {/* ---------- services ---------- */}
      <Section
        eyebrow="What we handle"
        title="Four services, live now"
        deck="Each one has a page that tells you what it is, who needs it, exactly what it costs and what we need from you — before you sign in or pay anything."
      >
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.06}>
              <Link
                href={`/services/${s.slug}`}
                className="group flex h-full flex-col border-0 bg-surface p-7 transition-colors hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="label text-primary">{s.category}</p>
                  <span className="label text-muted">{s.turnaround}</span>
                </div>

                <h3 className="mt-5 font-display text-[24px] leading-tight text-foreground">
                  {s.name}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{s.tagline}</p>

                <div className="mt-auto flex items-end justify-between gap-4 pt-8">
                  <div>
                    <p className="label text-muted">Our fee</p>
                    <p className="mt-1 font-mono text-[15px] text-foreground tabular-nums">
                      {s.fee.professional}
                    </p>
                  </div>
                  <span className="flex items-center gap-2 text-[13px] text-primary transition-transform duration-300 group-hover:translate-x-1">
                    View details
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M2 7h9M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-6 py-4">
              <p className="label text-muted">The rest of the catalogue</p>
              <p className="font-mono text-[12px] text-muted tabular-nums">
                <span className="text-primary">{totalServices}</span> services across{" "}
                <span className="text-primary">{categories.length}</span> categories
              </p>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/services#${c.id}`}
                  className="group flex items-start gap-3 bg-surface px-5 py-4 transition-colors hover:bg-surface-2"
                >
                  <CategoryIcon name={c.icon} size={17} className="mt-0.5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] text-muted group-hover:text-foreground">
                      {c.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-subtle tabular-nums">
                      {c.services.length} services
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ---------- how it works ---------- */}
      <Section
        eyebrow="How it works"
        title="Nothing is charged until we have quoted you"
        deck="Government fees change by state, turnover and category. So we do not put a fixed price behind a checkout button — we look at your file first, quote the exact figure, and only then move money."
      >
        <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
          {[
            { n: "01", t: "Tell us what you need", b: "A short form. No documents and no payment at this stage." },
            { n: "02", t: "We review and quote", b: "Government fee and our professional fee, itemised. Decline and it costs you nothing." },
            { n: "03", t: "Pay from your wallet", b: "One tap. Your prepaid balance covers it, with a receipt against the order." },
            { n: "04", t: "Track to the certificate", b: "Every stage visible, with the reference number, until the certificate is in your hands." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <li className="flex h-full flex-col bg-surface p-7">
                <span className="font-mono text-[12px] tracking-[0.14em] text-primary">{s.n}</span>
                <h3 className="mt-4 font-display text-[19px] leading-snug text-foreground">{s.t}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">{s.b}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <TrustStrip />
        </Reveal>
      </section>

      {/* ---------- wallet ---------- */}
      <Section
        eyebrow="The LAWFIC wallet"
        title="Top up once. Pay for filings in a tap."
        deck="A prepaid balance for LAWFIC services — no card details re-entered for every order, and a statement that shows exactly what each rupee went to."
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <Reveal>
            <div className="flex flex-col gap-5">
              {[
                ["Every debit is itemised", "Each entry names the order it paid for. Government fee and professional fee stay on separate lines, right through to the statement."],
                ["Refunds land back in the wallet", "If a filing cannot proceed, the balance returns the same day — no card reversal to wait on."],
                ["Spendable only on LAWFIC services", "The wallet is not a payment app. There is no transfer to other users and no withdrawal to a bank account, by design."],
              ].map(([t, b]) => (
                <div key={t} className="border-l-2 border-primary/30 pl-5">
                  <h3 className="font-display text-[18px] text-foreground">{t}</h3>
                  <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">{b}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <WalletPreview />
          </Reveal>
        </div>
      </Section>

      {/* ---------- jobs ---------- */}
      <Section
        eyebrow="Jobs for you"
        title="Openings matched to your city and your trade"
        deck="Sign in once and the jobs feed narrows to what you can actually apply for — filtered by where you are, what you do, and how long you have been doing it. Free, and always free."
      >
        <Reveal>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            {[
              { role: "Accounts Assistant", firm: "Deshmukh Textiles", city: "Pune", tag: "Matched on city" },
              { role: "GST Executive", firm: "Verma & Associates", city: "Nashik", tag: "Matched on trade" },
              { role: "Field Officer — MSME", firm: "Sahyadri Finserv", city: "Pune", tag: "Matched on experience" },
            ].map((j) => (
              <div key={j.role} className="bg-surface p-7">
                <p className="label text-primary">{j.tag}</p>
                <h3 className="mt-4 font-display text-[19px] leading-snug text-foreground">{j.role}</h3>
                <p className="mt-2 text-[14px] text-muted">{j.firm}</p>
                <p className="mt-5 flex items-center gap-2 text-[13px] text-subtle">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M6 1.5c-2 0-3.4 1.5-3.4 3.4C2.6 7.4 6 10.5 6 10.5S9.4 7.4 9.4 4.9C9.4 3 8 1.5 6 1.5Z" stroke="currentColor" strokeWidth="1" />
                    <circle cx="6" cy="4.8" r="1.2" stroke="currentColor" strokeWidth="1" />
                  </svg>
                  {j.city}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ---------- pricing teaser ---------- */}
      <Section
        eyebrow="Pricing"
        title="Start with no subscription at all"
        deck="Pay per filing and owe nothing until you have seen a quote. Move to a monthly plan when the returns become routine. Government fees are always passed through at cost, on their own line."
      >
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.06}>
              <Link
                href="/pricing"
                className={`group flex h-full flex-col p-7 transition-colors ${
                  plan.featured ? "bg-surface hover:bg-surface-2" : "bg-surface hover:bg-surface-2"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-[21px] text-foreground">{plan.name}</h3>
                  {plan.featured && (
                    <span className="label rounded-full border border-primary/30 bg-primary-light px-2.5 py-1 text-primary">
                      Most chosen
                    </span>
                  )}
                </div>

                <p className="mt-4 font-display text-[28px] leading-none text-primary tabular-nums">
                  {plan.monthlyPaise === null ? "₹0" : formatPaise(plan.monthlyPaise)}
                </p>
                <p className="label mt-2.5 text-muted">{plan.priceNote}</p>
                <p className="mt-5 text-[14px] leading-relaxed text-muted">{plan.tagline}</p>

                <span className="mt-auto flex items-center gap-2 pt-7 text-[13px] text-primary transition-transform duration-300 group-hover:translate-x-1">
                  See what is included
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M2 7h9M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------- closing ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-4 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-8 py-16 text-center sm:px-16">
            <div className="relative z-2">
              <h2 className="mx-auto max-w-xl font-display text-[clamp(28px,4vw,42px)] leading-tight text-foreground">
                Start with the service you need today.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[15.5px] leading-relaxed text-muted">
                Read the page, see the fee, and send us the details. Nothing is charged until we
                have looked at your file and quoted you.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link
                  href="/services"
                  className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Browse services
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-border px-6 py-3 text-sm text-foreground transition-colors hover:border-primary"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/* ---------- shared bits ---------- */

function Section({
  eyebrow,
  title,
  deck,
  children,
}: {
  eyebrow: string;
  title: string;
  deck: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-28">
      <Reveal>
        <p className="label text-primary">{eyebrow}</p>
        <h2 className="mt-5 max-w-2xl font-display text-[clamp(27px,3.8vw,40px)] leading-[1.12] text-foreground">
          {title}
        </h2>
        <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-muted">{deck}</p>
      </Reveal>
      <div className="mt-12">{children}</div>
    </section>
  );
}

function WalletPreview() {
  const rows = [
    ["Top-up · UPI", "+ ₹2,000", true],
    ["GST registration — professional fee", "− ₹1,499", false],
    ["GST registration — government fee", "₹0", false],
    ["Udyam registration — professional fee", "− ₹499", false],
  ] as const;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
      <div className="border-b border-border px-6 py-5">
        <p className="label text-muted">Available balance</p>
        <p className="mt-2 font-display text-[38px] leading-none text-foreground tabular-nums">₹2,000</p>
        <div className="mt-5 flex gap-2">
          <span className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-medium text-white">
            Add money
          </span>
          <span className="rounded-full border border-border px-4 py-1.5 text-[13px] text-muted">
            Statement
          </span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {rows.map(([label, amt, credit]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-6 py-3.5">
            <p className="min-w-0 truncate text-[13.5px] text-muted">{label}</p>
            <p className={`shrink-0 font-mono text-[13px] tabular-nums ${credit ? "text-success" : "text-foreground"}`}>
              {amt}
            </p>
          </div>
        ))}
      </div>

      <p className="border-t border-border px-6 py-3.5 text-[11.5px] leading-relaxed text-subtle">
        Illustration. Balance is usable only for LAWFIC services — it cannot be transferred or
        withdrawn to a bank account.
      </p>
    </div>
  );
}
