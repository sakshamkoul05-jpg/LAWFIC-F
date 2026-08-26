import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Jobs for you",
  description:
    "Openings matched to your city, your trade and your experience. Free to apply, always.",
};

const jobs = [
  { role: "Accounts Assistant", firm: "Deshmukh Textiles", city: "Pune", exp: "1–3 years", pay: "₹18,000 – ₹24,000", tag: "Matched on city" },
  { role: "GST Executive", firm: "Verma & Associates", city: "Nashik", exp: "2–4 years", pay: "₹22,000 – ₹30,000", tag: "Matched on trade" },
  { role: "Field Officer — MSME Loans", firm: "Sahyadri Finserv", city: "Pune", exp: "0–2 years", pay: "₹16,000 – ₹21,000", tag: "Matched on experience" },
  { role: "Compliance Associate", firm: "Kothari Foods Pvt Ltd", city: "Pune", exp: "1–2 years", pay: "₹20,000 – ₹26,000", tag: "Matched on city" },
  { role: "Data Entry — Registrations", firm: "LAWFIC", city: "Remote", exp: "Fresher", pay: "₹14,000 – ₹18,000", tag: "Open to freshers" },
];

export default function JobsPage() {
  return (
    <>
      <section className="grain bloom relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <Reveal>
            <p className="label text-brass">Jobs for you</p>
            <h1 className="mt-6 max-w-2xl font-display text-[clamp(32px,4.6vw,48px)] leading-[1.08] text-bone">
              Openings matched to your city and your trade
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-ash">
              Sign in and this list narrows to what you can actually apply for. Free to browse, free
              to apply — we never charge for a job, and employers cannot pay to be ranked here.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-center gap-3 rounded border border-line-2 bg-surface/40 px-6 py-4">
            <span className="size-1.5 rounded-full bg-brass" aria-hidden />
            <p className="text-[14px] text-ash">
              Showing a sample feed.{" "}
              <Link href="/login" className="text-brass hover:text-brass-hi">
                Sign in
              </Link>{" "}
              to match these to your profile.
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-line bg-line">
          {jobs.map((j, i) => (
            <Reveal key={j.role} delay={i * 0.05}>
              <article className="card grid gap-5 border-0! p-7 md:grid-cols-[1.5fr_1fr_auto] md:items-center md:gap-8">
                <div>
                  <p className="label text-brass">{j.tag}</p>
                  <h2 className="mt-3 font-display text-[21px] leading-snug text-bone">{j.role}</h2>
                  <p className="mt-1.5 text-[14px] text-ash">{j.firm}</p>
                </div>

                <dl className="grid grid-cols-3 gap-4 md:grid-cols-1 md:gap-2.5">
                  <div>
                    <dt className="label text-slate">Location</dt>
                    <dd className="mt-0.5 text-[13.5px] text-ash">{j.city}</dd>
                  </div>
                  <div>
                    <dt className="label text-slate">Experience</dt>
                    <dd className="mt-0.5 text-[13.5px] text-ash">{j.exp}</dd>
                  </div>
                  <div>
                    <dt className="label text-slate">Monthly</dt>
                    <dd className="mt-0.5 font-mono text-[13px] text-bone tnum">{j.pay}</dd>
                  </div>
                </dl>

                <span className="justify-self-start rounded-full border border-line-2 px-5 py-2.5 text-[13px] text-bone transition-colors md:justify-self-end">
                  Apply
                </span>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
