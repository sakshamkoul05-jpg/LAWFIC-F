import Link from "next/link";
import { services, upcoming } from "@/lib/services";
import HeroStack from "@/components/motion/HeroStack";
import Reveal from "@/components/ui/Reveal";

export default function Home() {
  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="grain bloom relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-32 lg:pt-28">
          <div className="relative z-2">
            <Reveal>
              <p className="label text-brass">Registrations · Licences · Compliance</p>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-6 font-display text-[clamp(38px,6.4vw,68px)] leading-[1.04] tracking-[-0.01em] text-bone">
                The paperwork between you
                <br className="hidden sm:block" /> and your business.
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-ash">
                Udyam, GST, PAN and Aadhaar — prepared by people who know why applications get
                rejected, filed in your name, and priced in the open. Government fee and our fee,
                always as two separate lines.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/services"
                  className="rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-hi"
                >
                  Explore services
                </Link>
                <Link
                  href="/about"
                  className="rounded-full border border-line-2 px-6 py-3 text-sm text-bone transition-colors hover:border-brass-lo"
                >
                  Why LAWFIC
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <dl className="mt-14 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded border border-line bg-line">
                {[
                  ["Same day", "Udyam certificate"],
                  ["48 hrs", "e-PAN issued"],
                  ["₹0", "Hidden charges"],
                ].map(([v, k]) => (
                  <div key={k} className="bg-ink-2 px-4 py-4">
                    <dt className="font-display text-[20px] text-brass tnum">{v}</dt>
                    <dd className="label mt-1.5 text-slate">{k}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <div className="relative z-2">
            <HeroStack />
          </div>
        </div>
      </section>

      {/* ---------- services ---------- */}
      <Section
        eyebrow="What we handle"
        title="Four services, live now"
        deck="Each one has a page that tells you what it is, who needs it, exactly what it costs and what we need from you — before you sign in or pay anything."
      >
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.06}>
              <Link
                href={`/services/${s.slug}`}
                className="card group flex h-full flex-col border-0! p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="label text-brass">{s.category}</p>
                  <span className="label text-slate">{s.turnaround}</span>
                </div>

                <h3 className="mt-5 font-display text-[24px] leading-tight text-bone">
                  {s.name}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ash">{s.tagline}</p>

                <div className="mt-auto flex items-end justify-between gap-4 pt-8">
                  <div>
                    <p className="label text-slate">Our fee</p>
                    <p className="mt-1 font-mono text-[15px] text-bone tnum">
                      {s.fee.professional}
                    </p>
                  </div>
                  <span className="flex items-center gap-2 text-[13px] text-brass transition-transform duration-300 group-hover:translate-x-1">
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
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded border border-line bg-surface/40 px-6 py-5">
            <p className="label text-slate">Next up</p>
            {upcoming.map((u) => (
              <span key={u.name} className="text-[13.5px] text-ash">
                {u.name}
              </span>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ---------- how it works ---------- */}
      <Section
        eyebrow="How it works"
        title="Nothing is charged until we have quoted you"
        deck="Government fees change by state, turnover and category. So we do not put a fixed price behind a checkout button — we look at your file first, quote the exact figure, and only then move money."
      >
        <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
          {[
            { n: "01", t: "Tell us what you need", b: "A short form. No documents and no payment at this stage." },
            { n: "02", t: "We review and quote", b: "Government fee and our professional fee, itemised. Decline and it costs you nothing." },
            { n: "03", t: "Pay from your wallet", b: "One tap. Your prepaid balance covers it, with a receipt against the order." },
            { n: "04", t: "Track to the certificate", b: "Every stage visible, with the reference number, until the certificate is in your hands." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <li className="flex h-full flex-col bg-ink-2 p-7">
                <span className="font-mono text-[12px] tracking-[0.14em] text-brass">{s.n}</span>
                <h3 className="mt-4 font-display text-[19px] leading-snug text-bone">{s.t}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ash">{s.b}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

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
                <div key={t} className="border-l-2 border-line-2 pl-5">
                  <h3 className="font-display text-[18px] text-bone">{t}</h3>
                  <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ash">{b}</p>
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
          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {[
              { role: "Accounts Assistant", firm: "Deshmukh Textiles", city: "Pune", tag: "Matched on city" },
              { role: "GST Executive", firm: "Verma & Associates", city: "Nashik", tag: "Matched on trade" },
              { role: "Field Officer — MSME", firm: "Sahyadri Finserv", city: "Pune", tag: "Matched on experience" },
            ].map((j) => (
              <div key={j.role} className="bg-ink-2 p-7">
                <p className="label text-brass">{j.tag}</p>
                <h3 className="mt-4 font-display text-[19px] leading-snug text-bone">{j.role}</h3>
                <p className="mt-2 text-[14px] text-ash">{j.firm}</p>
                <p className="mt-5 flex items-center gap-2 text-[13px] text-slate">
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

      {/* ---------- closing ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-4 sm:px-8">
        <Reveal>
          <div className="grain bloom relative overflow-hidden rounded-2xl border border-line-2 px-8 py-16 text-center sm:px-16">
            <div className="relative z-2">
              <h2 className="mx-auto max-w-xl font-display text-[clamp(28px,4vw,42px)] leading-tight text-bone">
                Start with the service you need today.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[15.5px] leading-relaxed text-ash">
                Read the page, see the fee, and send us the details. Nothing is charged until we
                have looked at your file and quoted you.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link
                  href="/services"
                  className="rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-hi"
                >
                  Browse services
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-line-2 px-6 py-3 text-sm text-bone transition-colors hover:border-brass-lo"
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
        <p className="label text-brass">{eyebrow}</p>
        <h2 className="mt-5 max-w-2xl font-display text-[clamp(27px,3.8vw,40px)] leading-[1.12] text-bone">
          {title}
        </h2>
        <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-ash">{deck}</p>
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
    <div className="overflow-hidden rounded-xl border border-line-2 bg-gradient-to-b from-surface-2 to-ink-2 shadow-2xl shadow-black/60">
      <div className="border-b border-line px-6 py-5">
        <p className="label text-slate">Available balance</p>
        <p className="mt-2 font-display text-[38px] leading-none text-bone tnum">₹2,000</p>
        <div className="mt-5 flex gap-2">
          <span className="rounded-full bg-brass px-4 py-1.5 text-[13px] font-medium text-ink">
            Add money
          </span>
          <span className="rounded-full border border-line-2 px-4 py-1.5 text-[13px] text-ash">
            Statement
          </span>
        </div>
      </div>

      <div className="divide-y divide-line">
        {rows.map(([label, amt, credit]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-6 py-3.5">
            <p className="min-w-0 truncate text-[13.5px] text-ash">{label}</p>
            <p className={`shrink-0 font-mono text-[13px] tnum ${credit ? "text-jade" : "text-bone"}`}>
              {amt}
            </p>
          </div>
        ))}
      </div>

      <p className="border-t border-line px-6 py-3.5 text-[11.5px] leading-relaxed text-slate">
        Illustration. Balance is usable only for LAWFIC services — it cannot be transferred or
        withdrawn to a bank account.
      </p>
    </div>
  );
}
