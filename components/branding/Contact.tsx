"use client";

import { company } from "@/lib/company";
import { quoteMessage, whatsappHref } from "@/lib/branding";
import { IndiaTime, Magnetic } from "./Shared";

/**
 * The close of the page, in reverse colours: one line, one big round button
 * that opens WhatsApp, and the ways to reach us set out underneath.
 */
export default function Contact() {
  const wa = whatsappHref(quoteMessage({ services: [] }));
  const tel = company.supportPhone?.replace(/\s/g, "");
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-24 sm:px-10 sm:pt-32">
        <div className="grid gap-12 border-b border-background/20 pb-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <h2 className="text-[clamp(2.6rem,8.6vw,8.5rem)] font-medium leading-[0.95] tracking-[-0.06em] text-background">
            Have a project
            <br />
            in mind?
          </h2>
          {wa && (
            <Magnetic strength={0.35}>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-40 items-center justify-center rounded-full bg-primary text-center text-[16px] font-medium text-background transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background sm:size-48"
              >
                Message us
                <br />
                on WhatsApp
              </a>
            </Magnetic>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-5 pt-8 text-[15px]">
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {company.supportEmail && (
              <a href={`mailto:${company.supportEmail}`} className="underline decoration-background/30 underline-offset-[6px] hover:decoration-background">
                {company.supportEmail}
              </a>
            )}
            {tel && (
              <a href={`tel:${tel}`} className="underline decoration-background/30 underline-offset-[6px] hover:decoration-background">
                {company.supportPhone}
              </a>
            )}
          </div>
          <div className="flex items-center gap-10 text-background/60">
            <p>
              India <IndiaTime />
            </p>
            <a href="#top" className="hover:text-background">
              Back to top
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
