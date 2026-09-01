import type { Metadata } from "next";
import Link from "next/link";
import {
  catalogueIntegrity,
  categories,
  liveServices,
  totalServices,
} from "@/lib/catalogue";
import { services as livePages } from "@/lib/services";
import CategoryIcon from "@/components/site/CategoryIcon";
import Reveal from "@/components/ui/Reveal";
import HeroStack from "@/components/motion/HeroStack";
import TrackRecommendations from "@/components/classic/TrackRecommendations";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Every registration, licence and filing LAWFIC handles — what each one is, what it costs and how long it takes.",
};

export default function ServicesIndex() {
  // A live entry with no page behind it links to a 404. Fail loudly in
  // development rather than shipping a menu that lies.
  if (process.env.NODE_ENV !== "production") {
    const problems = catalogueIntegrity(livePages.map((s) => s.slug));
    if (problems.length) {
      throw new Error(`Service catalogue is inconsistent:\n  - ${problems.join("\n  - ")}`);
    }
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div>
          <Reveal>
            <p className="label text-primary">Services</p>
            <h1 className="mt-6 max-w-3xl font-display text-[clamp(34px,5.4vw,56px)] leading-[1.06] text-foreground">
              Every fee, every document and every timeline — before you sign in.
            </h1>
            <p className="mt-7 max-w-2xl text-[16.5px] leading-relaxed text-muted">
              We put the whole picture on the page. What the government charges, what we charge,
              what you need to send us, and what actually causes applications to be rejected.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded border border-border">
              {[
                [String(totalServices), "In the catalogue"],
                [String(liveServices.length), "Live today"],
                [String(categories.length), "Categories"],
              ].map(([v, k]) => (
                <div key={k} className="bg-surface-2 px-5 py-4">
                  <dt className="font-display text-[26px] leading-none text-primary tabular-nums">{v}</dt>
                  <dd className="label mt-2 text-muted">{k}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          </div>

          {/* The document fan lives here now — it previews the four live
              services, which is what this page is about. */}
          <div className="relative z-2 hidden lg:block">
            <HeroStack />
          </div>
        </div>
      </section>

      {/* personalised start point for signed-in users */}
      <TrackRecommendations />

      {/* jump rail */}
      <section className="sticky top-18 z-30 border-b border-border bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 py-3 sm:px-8">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-[13px] text-muted transition-colors hover:border-primary hover:text-foreground"
            >
              <CategoryIcon name={c.icon} size={14} className="text-subtle" />
              {c.name}
            </a>
          ))}
        </div>
      </section>

      {/* the live ones first — they are the only ones you can actually start */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 className="font-display text-[26px] text-foreground">Live now</h2>
            <p className="text-[14px] text-muted">
              Full pages, fixed professional fees, and you can start one today.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-px overflow-hidden rounded-lg border border-border sm:grid-cols-2">
          {livePages.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.05}>
              <Link href={`/services/${s.slug}`} className="group flex h-full flex-col border-0 bg-surface p-7 transition-colors hover:bg-surface-2">
                <div className="flex items-start justify-between gap-4">
                  <p className="label text-primary">{s.category}</p>
                  <span className="label text-muted">{s.turnaround}</span>
                </div>
                <h3 className="mt-5 font-display text-[24px] leading-tight text-foreground">{s.name}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{s.tagline}</p>
                <div className="mt-auto flex items-end justify-between gap-4 pt-8">
                  <div>
                    <p className="label text-muted">Our fee</p>
                    <p className="mt-1 font-mono text-[15px] text-foreground tabular-nums">{s.fee.professional}</p>
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
      </section>

      {/* the whole catalogue */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-border pt-14">
            <h2 className="font-display text-[26px] text-foreground">The full catalogue</h2>
            <p className="text-[14px] text-muted">
              Everything we handle. Anything marked <span className="text-muted">Soon</span> we can
              still take on — ask, and we will tell you.
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col gap-14">
          {categories.map((c) => (
            <div key={c.id} id={c.id} className="scroll-mt-32">
              <Reveal>
                <div className="mb-6 flex items-start gap-4">
                  <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-primary">
                    <CategoryIcon name={c.icon} size={22} />
                  </span>
                  <div>
                    <h3 className="font-display text-[22px] leading-tight text-foreground">{c.name}</h3>
                    <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
                      {c.summary}
                    </p>
                  </div>
                </div>
              </Reveal>

              <div className="grid gap-px overflow-hidden rounded-lg border border-border sm:grid-cols-2 lg:grid-cols-3">
                {c.services.map((s) =>
                  s.status === "live" ? (
                    <Link
                      key={s.slug}
                      href={`/services/${s.slug}`}
                      className="group bg-surface p-5 transition-colors hover:bg-surface-2"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[14.5px] text-foreground group-hover:text-primary">
                          {s.name}
                        </span>
                        <span className="label rounded-sm border border-success/30 px-1.5 py-0.5 text-[9px] text-success">
                          Live
                        </span>
                      </span>
                      <span className="mt-1.5 block text-[13px] leading-snug text-muted">
                        {s.blurb}
                      </span>
                    </Link>
                  ) : (
                    <div key={s.slug} className="bg-surface-2 p-5 opacity-60">
                      <span className="flex items-center gap-2">
                        <span className="text-[14.5px] text-muted">{s.name}</span>
                        <span className="label rounded-sm border border-border px-1.5 py-0.5 text-[9px] text-subtle">
                          Soon
                        </span>
                      </span>
                      <span className="mt-1.5 block text-[13px] leading-snug text-muted">
                        {s.blurb}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <Reveal>
          <div className="mt-16 rounded-lg border border-border bg-surface px-8 py-10 text-center">
            <h3 className="font-display text-[24px] text-foreground">Not on the list?</h3>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              The catalogue is what we have written up, not the limit of what we handle. Tell us
              what you need and we will say plainly whether we can do it.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Ask us
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
