"use client";

import type { ReactNode } from "react";
import type { ServiceId } from "@/lib/branding";
import QuoteButton from "./QuoteButton";
import Reel, { REEL_CARD_W, ReelSide } from "./Reel";
import { LeadsMock, MetaAdsMock, PhotoMock, SaasMock, SearchMock, SocialMock } from "./ServiceMocks";

/**
 * Everything beyond websites, shown the way the websites are: a pinned reel
 * of large frames, each one a picture of what that work looks like when it is
 * running — the ad in the feed, the listing on the map, the week of posts, the
 * shoot in the viewfinder, the enquiry arriving, the dashboard. They are
 * example layouts and are labelled as such.
 */

type Item = { kind: string; title: string; line: string; service: ServiceId; mock: ReactNode };

const ITEMS: Item[] = [
  {
    kind: "Meta ads",
    title: "Instagram and Facebook ads",
    line: "Feed, story and reel ads aimed at the people most likely to buy, with every chat and sale tracked.",
    service: "marketing",
    mock: <MetaAdsMock />,
  },
  {
    kind: "Google and Maps",
    title: "Found on Google",
    line: "Search ads, SEO and a Google Business Profile that shows up when someone nearby is looking.",
    service: "marketing",
    mock: <SearchMock />,
  },
  {
    kind: "Social media",
    title: "Content that keeps posting",
    line: "Reels, carousels and stories planned, designed and scheduled every week.",
    service: "marketing",
    mock: <SocialMock />,
  },
  {
    kind: "Brand photoshoot",
    title: "Photographs that look like you",
    line: "Product, food, property and team shoots, edited and sized for web, print and social.",
    service: "photoshoot",
    mock: <PhotoMock />,
  },
  {
    kind: "Lead generation",
    title: "Visitors into enquiries",
    line: "Landing pages and forms that drop each enquiry on WhatsApp and into your sheet, with where it came from.",
    service: "leads",
    mock: <LeadsMock />,
  },
  {
    kind: "SaaS",
    title: "Software to run the business",
    line: "Dashboards, bookings, billing and staff tools, built on the same stack that runs lawfic.pro.",
    service: "saas",
    mock: <SaasMock />,
  },
];

function Card({ item, i }: { item: Item; i: number }) {
  return (
    <article className={`${REEL_CARD_W} shrink-0`}>
      <div className="mb-4 flex items-baseline justify-between gap-4 text-[14px] text-muted">
        <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
        <span>{item.kind}</span>
      </div>
      <div className="overflow-hidden rounded-[clamp(12px,1.6vw,22px)] border border-border-2 shadow-[0_50px_100px_-50px_rgba(0,0,0,0.45)]">
        {item.mock}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <h3 className="text-[clamp(1.5rem,2.8vw,2.6rem)] font-medium leading-none tracking-[-0.045em] text-foreground">{item.title}</h3>
          <p className="mt-2 max-w-[48ch] text-[14.5px] leading-snug text-muted">{item.line}</p>
        </div>
        <div className="justify-self-start sm:justify-self-auto">
          <QuoteButton service={item.service} label="Ask about this" />
        </div>
      </div>
    </article>
  );
}

export default function ServiceReel() {
  return (
    <Reel
      label="Ads, content, photography, leads and software"
      count={ITEMS.length}
      intro={
        <ReelSide>
          <h2 className="text-[clamp(2.4rem,5.4vw,5rem)] font-medium leading-[0.95] tracking-[-0.055em] text-foreground">
            Beyond
            <br />
            websites
          </h2>
          <p className="mt-6 max-w-[30ch] text-[15.5px] leading-relaxed text-muted">
            Ads, content, photography, lead generation and software, made with the same care. These are example layouts; every
            campaign and shoot is designed for your brand.
          </p>
        </ReelSide>
      }
      outro={
        <ReelSide>
          <p className="text-[clamp(2rem,4.4vw,4rem)] font-medium leading-[0.98] tracking-[-0.05em] text-foreground">
            One studio for all of it.
          </p>
          <p className="mt-4 max-w-[30ch] text-[15.5px] leading-relaxed text-muted">
            Most businesses start with a website and add ads, content or software as they grow.
          </p>
          <div className="mt-8">
            <QuoteButton label="Get a quote" />
          </div>
        </ReelSide>
      }
      cards={() => ITEMS.map((it, i) => <Card key={it.kind} item={it} i={i} />)}
    />
  );
}
