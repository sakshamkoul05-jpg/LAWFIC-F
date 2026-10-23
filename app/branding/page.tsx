import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/branding/Hero";
import WorkIndex from "@/components/branding/WorkIndex";
import Statement from "@/components/branding/Statement";
import ServiceList from "@/components/branding/ServiceList";
import QuoteBuilder from "@/components/branding/QuoteBuilder";
import Contact from "@/components/branding/Contact";
import { PROCESS, quoteMessage, whatsappHref } from "@/lib/branding";

/**
 * Branding — the studio, laid out the way designers lay out their own
 * portfolios: the claim in big type, then the work as an index you can hover
 * through, a paragraph that reads itself as you scroll, the services as one
 * list, how a project runs, the quote, and a close in reverse colours.
 *
 * The menu's anchors (#web-apps, #marketing, #photoshoot, #leads, #saas, #work,
 * #quote and the older #static-site, #apps, #advertising …) all still land.
 */

export const metadata: Metadata = {
  title: "Branding — websites, apps, marketing, photoshoots and SaaS",
  description:
    "Websites and Android/iOS apps, digital marketing, brand photoshoots, lead generation and custom software — from the team behind lawfic.pro. See the apps and sites we have shipped and get a quote on WhatsApp.",
  alternates: { canonical: "/branding" },
};

const WRAP = "mx-auto max-w-[1440px] px-5 sm:px-10";

export default function BrandingPage() {
  const quickHref = whatsappHref(quoteMessage({ services: [] }));

  return (
    <div id="top">
      <Hero />

      <section id="work" className={`${WRAP} scroll-mt-28 pb-28 pt-8 sm:pb-36`}>
        <WorkIndex />
      </section>

      <section className={`${WRAP} pb-28 sm:pb-40`}>
        <Statement text="We are the studio inside LAWFIC, the team that designed and built this platform. We make websites, apps, campaigns and photographs for dairies, cafés, fashion labels, trusts and guesthouses, and we stay on after launch to keep them running." />
      </section>

      <section className={`${WRAP} grid gap-10 pb-28 sm:pb-36 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16`}>
        <div className="lg:sticky lg:top-32 lg:self-start">
          <h2 className="text-[clamp(1.6rem,3vw,2.5rem)] font-medium leading-none tracking-[-0.04em] text-foreground">What we do</h2>
          <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-muted">
            One of these or several together. Every project starts with a conversation and a written quote.
          </p>
          <p className="mt-6 max-w-[34ch] text-[14px] leading-relaxed text-muted">
            Protecting the brand itself?{" "}
            <Link href="/document/trademark" className="text-foreground underline decoration-border-3 underline-offset-4 hover:decoration-foreground">
              Trademark registration
            </Link>{" "}
            and{" "}
            <Link href="/request/copyright" className="text-foreground underline decoration-border-3 underline-offset-4 hover:decoration-foreground">
              copyright
            </Link>{" "}
            are handled by our filings team.
          </p>
        </div>
        <ServiceList />
      </section>

      <section className="border-t border-border">
        <div className={`${WRAP} py-24 sm:py-32`}>
          <h2 className="text-[clamp(1.6rem,3vw,2.5rem)] font-medium leading-none tracking-[-0.04em] text-foreground">How a project runs</h2>
          <ol className="mt-12 grid gap-px overflow-hidden border-y border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS.map((p, i) => (
              <li key={p.title} className="bg-background py-8 pr-6 sm:px-6 lg:first:pl-0">
                <span className="block text-[clamp(2.5rem,4vw,3.5rem)] font-medium leading-none tracking-[-0.05em] text-subtle tabular-nums">
                  {i + 1}
                </span>
                <h3 className="mt-8 text-[18px] font-medium tracking-[-0.02em] text-foreground">{p.title}</h3>
                <p className="mt-2 max-w-[30ch] text-[14.5px] leading-relaxed text-muted">{p.line}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="quote" className="scroll-mt-24 border-t border-border bg-surface/50">
        <div className={`${WRAP} py-24 sm:py-32`}>
          <h2 className="text-[clamp(2rem,4.6vw,4rem)] font-medium leading-[1] tracking-[-0.05em] text-foreground">Tell us what you need</h2>
          <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-muted">
            Choose what fits and the message writes itself. It opens in WhatsApp ready to send, and we reply with questions and a written
            quote.
          </p>
          <div className="mt-14">
            <QuoteBuilder />
          </div>
        </div>
      </section>

      <Contact />

      {/* phones: a direct WhatsApp shortcut that stays in reach */}
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
    </div>
  );
}
