import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import JobFeed from "@/components/classic/JobFeed";

export const metadata: Metadata = {
  title: "Jobs for you",
  description:
    "Openings matched to your city, your trade and your experience. Free to apply, always.",
};

export default function JobsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_50%_50%,rgba(201,168,76,0.05),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <Reveal>
            <p className="type-label text-primary">Jobs for you</p>
            <h1 className="type-display mt-6 max-w-2xl text-foreground">
              Openings matched to your city and your trade
            </h1>
            <p className="type-body mt-7 max-w-xl text-muted">
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
