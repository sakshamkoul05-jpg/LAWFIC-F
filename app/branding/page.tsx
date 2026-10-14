import type { Metadata } from "next";
import Link from "next/link";
import StudioMorph from "@/components/branding/StudioMorph";
import WorkShowcase from "@/components/branding/WorkShowcase";
import QuoteBuilder from "@/components/branding/QuoteBuilder";
import QuoteButton from "@/components/branding/QuoteButton";
import { APPS, SITES, STUDIO_SERVICES, quoteMessage, whatsappHref } from "@/lib/branding";

/**
 * Branding — the studio.
 *
 * Websites and apps, digital marketing, brand photoshoots, lead generation and
 * SaaS, shown by doing rather than describing: a frame at the top that turns
 * into each one, the apps and sites already shipped, and a quote that writes
 * itself into WhatsApp.
 *
 * The menu's older anchors (/branding#static-site, #apps, #advertising …) are
 * kept as aliases on the matching service so no existing link breaks.
 */

export const metadata: Metadata = {
  title: "Branding — websites, apps, marketing, photoshoots and SaaS",
  description:
    "Websites and Android/iOS apps, digital marketing, brand photoshoots, lead generation and custom software — from the team behind lawfic.pro. See the apps and sites we have shipped and get a quote on WhatsApp.",
  alternates: { canonical: "/branding" },
};

export default function BrandingPage() {
  const quickHref = whatsappHref(quoteMessage({ services: [] }));

  return (
    <>
      {/* ── hero ── */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8">
        <h1 className="max-w-4xl text-[clamp(2.4rem,6.2vw,4.8rem)] font-bold leading-[0.98] tracking-[-0.05em] text-foreground">
          Brands, built and shipped.
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
          <p className="max-w-xl text-[16px] leading-relaxed text-muted">
            Websites, apps, marketing, photography, lead generation and software — by the team that built lawfic.pro.
            {` ${APPS.length} apps live on Google Play and ${SITES.length}+ websites shipped.`}
          </p>
          <QuoteButton label="Get a quote on WhatsApp" />
        </div>
        <div className="mt-14">
          <StudioMorph />
        </div>
      </section>

      {/* ── what each service includes ── */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)] font-semibold leading-tight tracking-[-0.03em] text-foreground">
              What each one includes
            </h2>
            <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-muted">
              Pick one or several. Every project starts with a conversation and a written quote — nothing is charged before
              you agree to it.
            </p>
            <p className="mt-6 max-w-sm text-[13px] text-muted">
              Protecting the brand itself?{" "}
              <Link href="/document/trademark" className="text-primary hover:underline">
                Trademark registration
              </Link>{" "}
              and{" "}
              <Link href="/request/copyright" className="text-primary hover:underline">
                copyright
              </Link>{" "}
              are handled by our filings team.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[28px] border border-border bg-border">
            {STUDIO_SERVICES.map((s) => (
              <article key={s.id} id={s.anchor} className="relative scroll-mt-32 bg-background p-6 sm:p-8">
                {s.aliases?.map((a) => (
                  <span key={a} id={a} className="absolute -top-32" aria-hidden />
                ))}
                <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-foreground">{s.name}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.line}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {s.includes.map((x) => (
                    <li key={x} className="flex gap-2.5 text-[13.5px] leading-relaxed text-foreground">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <QuoteButton service={s.id} label={`Get a quote for ${s.name.toLowerCase()}`} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── work ── */}
      <section id="work" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-20 sm:px-8">
        <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold leading-tight tracking-[-0.04em] text-foreground">Our work, live right now</h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Not mock-ups — every app and site below is in use by its business today.
        </p>
        <div className="mt-12">
          <WorkShowcase />
        </div>
      </section>

      {/* ── quote ── */}
      <section id="quote" className="scroll-mt-24 border-t border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold leading-tight tracking-[-0.04em] text-foreground">Get a quote</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
            Choose what you need and watch the message write itself. It opens in WhatsApp, ready to send — we reply with
            questions and a written quote.
          </p>
          <div className="mt-12">
            <QuoteBuilder />
          </div>
        </div>
      </section>

      {/* mobile: a direct WhatsApp shortcut that stays in reach */}
      {quickHref && (
        <a
          href={quickHref}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 left-4 z-40 flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2.5 text-[13.5px] font-semibold text-[#0b141a] shadow-lg md:hidden"
        >
          WhatsApp us
        </a>
      )}
    </>
  );
}
