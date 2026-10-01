"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * "Why Chose LAWFIC Service" — the client's seven cards, in their words.
 *
 * The first six sit on the grey band in one row, as drawn; the seventh,
 * "Accurate, Every Time By Expert", opens the blue band under it. The sheet
 * also sketches five empty blue cards beside it — space reserved for reasons
 * not yet written — which are left out rather than shown as blank boxes.
 */
type Reason = { title: string; body: string; icon: React.ReactNode };

const GREY: Reason[] = [
  {
    title: "Pan India Quality Service With Love",
    body: "Lawfic provides a wide range of document services delivered by highly qualified experts. We are committed to quality, trust, and transparency in everything we do.",
    icon: (
      <>
        <circle cx="32" cy="24" r="15" fill="#fff" />
        <circle cx="32" cy="24" r="10" fill="#fff" stroke="#9A9696" strokeWidth="1.5" />
        <rect x="23" y="17" width="18" height="4.6" fill="#FF9933" />
        <rect x="23" y="21.6" width="18" height="4.6" fill="#fff" />
        <rect x="23" y="26.2" width="18" height="4.6" fill="#138808" />
        <circle cx="32" cy="23.9" r="1.6" fill="none" stroke="#000080" strokeWidth="0.8" />
        <path d="M24 36l-6 16 7-3 4 6 4-17M40 36l6 16-7-3-4 6-4-17" fill="#fff" />
      </>
    ),
  },
  {
    title: "Support When You Need It",
    body: "Every document is prepared with precision — no missing clauses, no formatting errors, no guesswork. We stand behind our work.",
    icon: (
      <path
        d="M6 26l10-10 8 3 6-3 6 3 8-3 10 10-6 6-4-2-10 10a3 3 0 0 1-4-4l-2 2a3 3 0 0 1-4-4l-2 2a3 3 0 0 1-4-4l-2 2a3 3 0 0 1-4-4l4-4-4-2z"
        fill="#fff"
      />
    ),
  },
  {
    title: "Your Information, Fully Secure, Protected & Confidential",
    body: "Your documents and personal information are protected with high-level standard encryption security. Your privacy is never compromised & a priority for us, not just a formality.",
    icon: (
      <>
        <rect x="12" y="8" width="40" height="44" rx="3" fill="none" stroke="#fff" strokeWidth="4" />
        <rect x="18" y="14" width="28" height="32" rx="2" fill="none" stroke="#fff" strokeWidth="2.5" />
        <circle cx="28" cy="30" r="5" fill="none" stroke="#fff" strokeWidth="2.5" />
        <path d="M40 24v12" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <path d="M18 52v4M46 52v4" stroke="#fff" strokeWidth="4" />
      </>
    ),
  },
  {
    title: "Honest, Transparent Pricing",
    body: "No hidden fees, no surprise charges. What you see is what you pay — professional quality at a fraction of traditional costs.",
    icon: <path d="M18 12h28M18 21h28M18 12h8a10 10 0 0 1 0 20h-8l20 22" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Fast Turnaround & Delivered Documents",
    body: "Get your documents ready on time, not given a longer date — our streamlined process means you're never stuck waiting.",
    icon: <path d="M32 6c2.5 0 3.5 3 3.5 6v12l18 10v5l-18-5v11l6 4v4l-9.5-3-9.5 3v-4l6-4V34l-18 5v-5l18-10V12c0-3 1-6 3.5-6z" fill="#fff" />,
  },
  {
    title: "Always Current, Always Compliant & Up to Date",
    body: "Laws and formats change — our templates and processes are regularly reviewed to reflect current requirements, so you're never using outdated forms.",
    icon: (
      <>
        <path d="M48 20a19 19 0 0 0-33-3" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M16 44a19 19 0 0 0 33 3" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M12 9v10h10M52 55V45H42" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

const BLUE: Reason[] = [
  {
    title: "Accurate, Every Time By Expert",
    body: "Every document is prepared with precision — no missing clauses, no formatting errors, no guesswork. We stand behind our work with skilful experts, all the time.",
    icon: (
      <>
        <circle cx="32" cy="35" r="19" fill="none" stroke="#fff" strokeWidth="4.5" />
        <path d="M32 24v12h-8" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 18l8-8M54 18l-8-8" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        <path d="M20 54l-4 5M44 54l4 5" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
  },
];

export default function WhyChooseCards() {
  const { tx } = useLocale();
  return (
    <section aria-labelledby="why-heading" className="home-why">
      <div className="mx-auto max-w-[1680px] px-4 pt-10 sm:px-8">
        <h2 id="why-heading" className="home-section-title">
          {tx("Why Choose LAWFIC Service")}
        </h2>
      </div>
      <div className="home-why-band is-grey">
        <ul className="mx-auto grid max-w-[1680px] grid-cols-1 gap-5 px-4 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 2xl:grid-cols-6">
          {GREY.map((r) => (
            <ReasonCard key={r.title} reason={r} />
          ))}
        </ul>
      </div>
      <div className="home-why-band is-blue">
        <ul className="mx-auto grid max-w-[1680px] grid-cols-1 gap-5 px-4 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 2xl:grid-cols-6">
          {BLUE.map((r) => (
            <ReasonCard key={r.title} reason={r} blue />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ReasonCard({ reason, blue }: { reason: Reason; blue?: boolean }) {
  const { tx } = useLocale();
  return (
    <li className={`home-why-card ${blue ? "is-blue" : ""}`}>
      <svg viewBox="0 0 64 64" width="76" height="76" aria-hidden className="mx-auto">
        {reason.icon}
      </svg>
      <h3 className="home-serif mt-3 text-[clamp(19px,1.35vw,23px)] leading-snug text-white">{tx(reason.title)}</h3>
      <p className="mt-4 text-[13.5px] italic leading-relaxed text-white/95">“{tx(reason.body)}”</p>
    </li>
  );
}
