import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "About us",
  description:
    "LAWFIC is a private consultancy handling registrations, licences and compliance for Indian businesses — with fees shown in the open.",
};

const principles = [
  {
    n: "01",
    t: "The government fee is never hidden inside ours",
    b: "Udyam registration is free at source. So is GST registration. We tell you that on the page, charge separately for the work, and itemise both on the invoice. A business that has to hide its pricing is telling you something.",
  },
  {
    n: "02",
    t: "We quote before we charge",
    b: "Government fees move with state, turnover and category. Putting a fixed number behind a checkout button means either overcharging some people or absorbing losses on others. We look at your file, then quote.",
  },
  {
    n: "03",
    t: "We say what we cannot do",
    b: "We are not UIDAI, not GSTN, and not a GST Suvidha Provider. We cannot authenticate an Aadhaar or reach into a government database, and anyone telling you they can is worth walking away from.",
  },
  {
    n: "04",
    t: "We do not hoard your documents",
    b: "We ask for the minimum a filing needs, we work from masked identifiers where the law allows it, and we do not keep Aadhaar photocopies. Your file is not our asset.",
  },
];

export default function About() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_50%_50%,rgba(201,168,76,0.05),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <Reveal>
            <p className="type-label text-primary">About us</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="type-display mt-6 max-w-4xl text-foreground">
              Most applications are not rejected. They are returned.
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="type-body mt-8 max-w-2xl text-muted">
              A surname spelt two ways across two documents. An electricity bill in a landlord&apos;s
              name with no consent letter behind it. A turnover figure that does not reconcile with
              the one the portal pulls from your own return. None of these are hard problems — they
              are just problems nobody warned you about.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted">
              LAWFIC exists to catch them before the file goes in. We are a private consultancy: we
              prepare, we check, we file in your name, and we stay on it until the certificate
              exists.
            </p>
          </Reveal>
        </div>
      </section>

      {/* principles */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal>
          <p className="type-label text-primary">How we work</p>
          <h2 className="type-h1 mt-5 max-w-2xl text-foreground">
            Four things we have decided not to compromise on
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border border-border sm:grid-cols-2">
          {principles.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.06}>
              <div className="flex h-full flex-col bg-surface p-8">
                <span className="type-data text-[13px] text-primary">{p.n}</span>
                <h3 className="type-h3 mt-5 text-foreground">{p.t}</h3>
                <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{p.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* numbers */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal>
          <dl className="grid gap-px overflow-hidden border border-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["4", "Services live", "Udyam, GST, PAN and Aadhaar assistance"],
              ["₹0", "Hidden charges", "Government and professional fees always itemised"],
              ["Same day", "Udyam certificate", "When the classification is clean"],
              ["1", "Point of contact", "The same person from quote to certificate"],
            ].map(([v, k, note]) => (
              <div key={k} className="bg-surface p-7">
                <dt className="type-data text-[32px] leading-none text-primary">{v}</dt>
                <dd className="mt-4">
                  <p className="type-label text-foreground">{k}</p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{note}</p>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* what we are not */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="border border-border bg-surface p-8 sm:p-12">
            <p className="type-label text-primary">Plainly stated</p>
            <h2 className="type-h1 mt-6 max-w-3xl text-foreground">
              What LAWFIC is not
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {[
                ["Not a government body", "We have no affiliation with UIDAI, the Income Tax Department, GSTN or FSSAI, and no special access to any of them."],
                ["Not a GST Suvidha Provider", "We file on the public portal, in your name, using your credentials and your authentication."],
                ["Not a payment service", "The LAWFIC wallet is a prepaid balance for our own services. It cannot be transferred to another person or withdrawn to a bank."],
              ].map(([t, b]) => (
                <div key={t} className="border-l-2 border-primary/20 pl-5">
                  <h3 className="text-[14px] font-semibold text-foreground">{t}</h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-4 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden border border-border bg-surface px-8 py-16 text-center sm:px-16">
            <div className="relative z-2">
              <h2 className="type-h1 mx-auto max-w-lg text-foreground">
                Tell us what you are trying to register.
              </h2>
              <p className="type-body mx-auto mt-5 max-w-md text-muted">
                We will tell you what it costs, what it needs, and whether you need it at all.
              </p>
              <Link
                href="/services"
                className="mt-9 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Browse services
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
