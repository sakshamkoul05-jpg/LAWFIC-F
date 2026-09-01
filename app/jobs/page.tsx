import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import JobFeed from "@/components/classic/JobFeed";

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
        <JobFeed />
      </section>
    </>
  );
}
