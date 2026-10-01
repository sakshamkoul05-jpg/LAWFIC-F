"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useProfile } from "@/components/profile/ProfileProvider";
import { OFFERS_LIVE, WALLET_RECHARGE } from "@/lib/home-offers";
import { formatPaise } from "@/lib/money";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * "Hello <name> message and some special offer just for you" — item 1 of the
 * page body in the client's final order.
 *
 * The welcome is seven lines, addressed by name. Under it, five tabs; each
 * opens five cards, and switching tab replaces the five with the next five
 * (5 × 5 = 25, as the sheet works it out). The wallet recharge card on the
 * right is fixed and never changes with the tab — the sheet is explicit about
 * that.
 *
 * The 25 cards are LAWFIC's own services and documents, chosen per tab. None
 * of them carries a discount the checkout does not give.
 */
type Card = { label: string; title: string; blurb: string; href: string; img: string };

/* Each tab has a colour, and the open panel takes it on — border, wash and
   card shading — so it is obvious at a glance which tab the five cards
   belong to. */
const TABS: { id: string; icon: string; label: string; tone: string; color: string; cards: Card[] }[] = [
  {
    id: "curated",
    icon: "✨",
    label: "Curated for You",
    tone: "tab-blue",
    color: "#2E75B6",
    cards: [
      { label: "Tax & filings", title: "GST Registration", blurb: "A GSTIN in your name in 7–10 days.", href: "/services/gst", img: "/banners/gst.webp" },
      { label: "Business", title: "Udyam / MSME Registration", blurb: "Collateral-free loans and tender access.", href: "/services/msme-udyam", img: "/banners/udyam.webp" },
      { label: "Identity", title: "PAN Services", blurb: "New cards, corrections and Aadhaar linking.", href: "/services/pan", img: "/banners/identity.webp" },
      { label: "Identity", title: "Aadhaar Services", blurb: "Corrections, updates and appointments.", href: "/services/aadhaar", img: "/banners/passport.webp" },
      { label: "Membership", title: "Save on every filing", blurb: "Plans from ₹99 a month.", href: "/pricing", img: "/banners/membership.webp" },
    ],
  },
  {
    id: "match",
    icon: "🧩",
    label: "Your Perfect Match",
    tone: "tab-orange",
    color: "#F37021",
    cards: [
      { label: "Jobs", title: "Openings matched to you", blurb: "By your city and your trade.", href: "/jobs", img: "/banners/jobs.webp" },
      { label: "Tax & filings", title: "Income Tax Return", blurb: "Filed by someone who reads it.", href: "/document/itr", img: "/banners/income-tax.webp" },
      { label: "Startup", title: "Private Limited Company", blurb: "Incorporation, DIN, MOA and AOA.", href: "/business", img: "/banners/incorporation.webp" },
      { label: "Branding", title: "Trademark Registration", blurb: "Your name, protected in the right classes.", href: "/document/trademark", img: "/banners/trademark.webp" },
      { label: "Licences", title: "FSSAI Food Licence", blurb: "Basic, State and Central registration.", href: "/document/fssai", img: "/banners/food.webp" },
    ],
  },
  {
    id: "expert",
    icon: "🎖️",
    label: "Trusted Picks from Our Expert",
    tone: "tab-cyan",
    color: "#0FA3B1",
    cards: [
      { label: "Legal", title: "Rent Agreement", blurb: "Drafted, stamped and registered.", href: "/document/rent-agreement", img: "/banners/agreement.webp" },
      { label: "Travel", title: "Passport Application", blurb: "Form, documents and appointment.", href: "/document/passport-application", img: "/banners/passport.webp" },
      { label: "Tax & filings", title: "GST Registration", blurb: "The address-proof query answered in time.", href: "/services/gst", img: "/banners/gst.webp" },
      { label: "Business", title: "Udyam Registration", blurb: "Classified correctly, filed the same day.", href: "/services/msme-udyam", img: "/banners/udyam.webp" },
      { label: "Legal", title: "Affidavit Preparation", blurb: "Name change, income and residence.", href: "/document/affidavit", img: "/banners/agreement.webp" },
    ],
  },
  {
    id: "secure",
    icon: "✅",
    label: "Secure Life Offer",
    tone: "tab-navy",
    color: "#2B4FB0",
    cards: [
      { label: "Legal", title: "Will Preparation", blurb: "A simple, valid will that says what you meant.", href: "/document/will", img: "/banners/agreement.webp" },
      { label: "Legal", title: "Power of Attorney", blurb: "General and special authority, notarised.", href: "/document/power-of-attorney", img: "/banners/agreement.webp" },
      { label: "Certificates", title: "Legal Heir Certificate", blurb: "Succession proof to transfer assets.", href: "/document/legal-heir", img: "/banners/identity.webp" },
      { label: "Certificates", title: "Birth Certificate", blurb: "Proof of identity, age and parentage.", href: "/document/birth-certificate", img: "/banners/identity.webp" },
      { label: "Certificates", title: "Marriage Certificate", blurb: "Court or registrar, for official use.", href: "/document/marriage-certificate", img: "/banners/passport.webp" },
    ],
  },
  {
    id: "must",
    icon: "🔥",
    label: "Must-Haves",
    tone: "tab-sky",
    color: "#4B9BE8",
    cards: [
      { label: "Identity", title: "PAN Card Application", blurb: "A new PAN, issued as an e-PAN.", href: "/services/pan", img: "/banners/identity.webp" },
      { label: "Identity", title: "Aadhaar Card Services", blurb: "Prepared so the visit works first time.", href: "/services/aadhaar", img: "/banners/passport.webp" },
      { label: "Certificates", title: "Income Certificate", blurb: "For scholarships and welfare schemes.", href: "/document/income-certificate", img: "/banners/income-tax.webp" },
      { label: "Certificates", title: "Domicile Certificate", blurb: "State domicile for education and quotas.", href: "/document/domicile-certificate", img: "/banners/identity.webp" },
      { label: "Legal", title: "Rent Agreement", blurb: "Registered where it needs to be.", href: "/document/rent-agreement", img: "/banners/agreement.webp" },
    ],
  },
];

export default function WelcomeOffers() {
  const { tx } = useLocale();
  const { profile } = useProfile();
  const [active, setActive] = useState(TABS[0]!.id);
  const [accountName, setAccountName] = useState<string | null>(null);

  /* The profile's full name first; the account's metadata as a fallback. */
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    createClient()
      ?.auth.getUser()
      .then(({ data }) => {
        const m = data.user?.user_metadata as Record<string, string> | undefined;
        setAccountName(m?.full_name ?? m?.name ?? null);
      });
  }, []);

  const name = profile?.fullName?.trim() || accountName;
  const tab = TABS.find((t) => t.id === active)!;

  /* Hover opens a tab too, after a short beat so a pointer passing over the
     row on its way somewhere else does not flick through all five. */
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpen = (id: string) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setActive(id), 140);
  };
  const hoverCancel = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };
  useEffect(() => hoverCancel, []);

  return (
    <section aria-labelledby="welcome-heading" className="home-welcome home-band">
      <div className="home-wrap home-section">
        {/* Centred, and the welcome said in two lines rather than seven. */}
        <div className="text-center">
          <h2 id="welcome-heading" className="home-section-title">
            {tx("A Heartfelt Welcome to the Lawfic Family")} <span aria-hidden className="text-[#E5262B]">❤</span>
          </h2>
          <p className="home-serif mt-2 text-[clamp(20px,1.8vw,26px)] font-bold text-[#C6A15B]">
            {name ? `${name} Ji!` : tx("Dear Customer Ji!")} <span aria-hidden>🙏</span>
          </p>
          <p className="mx-auto mt-3 max-w-[860px] text-[14.5px] leading-relaxed text-muted-foreground">
            {tx("We are delighted to have you in our family — the offers below are chosen for your needs and handpicked by our experts.")}
            <br className="hidden md:block" />{" "}
            {tx("Speak to an expert any time, and move towards a secure future with clarity and confidence.")}
          </p>
        </div>

        {/* The five tabs across the full width, the open panel under them in
            the tab's own colour, and the fixed wallet card below. */}
        <div className="home-section-body">
          <div role="tablist" aria-label={tx("Offers for you")} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === active}
                aria-controls={`welcome-panel-${t.id}`}
                onClick={() => setActive(t.id)}
                onMouseEnter={() => hoverOpen(t.id)}
                onMouseLeave={hoverCancel}
                style={{ "--tone": t.color } as React.CSSProperties}
                className={`home-tab ${t.tone} ${t.id === active ? "is-on" : ""}`}
              >
                <span aria-hidden>{t.icon}</span> {tx(t.label)}
              </button>
            ))}
          </div>

          <div className="home-welcome-panel" style={{ "--tone": tab.color } as React.CSSProperties}>
            {/* Keyed by tab, so the five cards slide in afresh each time. */}
            <ul key={tab.id} id={`welcome-panel-${tab.id}`} role="tabpanel" className="home-welcome-cards grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {tab.cards.map((c, i) => (
                <li key={c.title} style={{ animationDelay: `${i * 60}ms` }}>
                  <Link href={c.href} className="home-welcome-card group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="home-welcome-card-shade" />
                    <span className="absolute inset-x-0 bottom-0 p-3.5">
                      <span className="home-welcome-card-label">{tx(c.label)}</span>
                      <span className="mt-1 block text-[14.5px] font-semibold leading-snug text-white">{tx(c.title)}</span>
                      <span className="mt-1 block text-[11.5px] leading-snug text-white/85">{tx(c.blurb)}</span>
                      <span className="mt-2 inline-block text-[11.5px] font-semibold text-white">{tx("Explore")} →</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {OFFERS_LIVE && <WalletCard />}
        </div>
      </div>
    </section>
  );
}

/** The fixed wallet card — the same four tiers whatever tab is open. */
function WalletCard() {
  const { tx } = useLocale();
  return (
    <aside aria-label={tx("Lawfic Wallet offers")} className="home-wallet-card mt-6">
      <div className="home-wallet-card-inner lg:flex lg:items-center lg:gap-8">
        <div className="text-center lg:w-[250px] lg:shrink-0 lg:text-left">
          <p className="home-serif flex items-center justify-center gap-2 text-[24px] font-bold tracking-wide text-[#F2C94C] lg:justify-start">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="6" width="18" height="13" rx="2.5" fill="currentColor" />
              <rect x="14" y="10.5" width="7" height="4" rx="1.2" fill="#0B1D4A" />
              <path d="M5 6l9-3 1.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            {tx("LAWFIC WALLET")}
          </p>
          <p className="mt-1 text-[12px] text-white/80">{tx("Recharge once. Get extra balance on every top-up.")}</p>
          <p className="mt-2 text-[10px] text-white/55">
            <Link href="/legal/wallet-terms" className="underline-offset-2 hover:underline">
              {tx("Lawfic Wallet & Lawfic Pay Later Terms & Conditions")}
            </Link>
          </p>
        </div>
        <ul className="mt-4 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-0 lg:grid-cols-4">
          {WALLET_RECHARGE.map((t) => (
            <li key={t.pay} className={`home-wallet-tier ${t.best ? "is-best" : ""}`}>
              {t.best && <span className="home-wallet-best">{tx("BEST VALUE")}</span>}
              <span className="min-w-0">
                <span className="block text-[9.5px] uppercase tracking-[0.08em] text-white/60">{tx("Recharge")}</span>
                <span className="home-serif block text-[19px] font-bold leading-tight text-white">{formatPaise(t.pay * 100)}</span>
              </span>
              <span aria-hidden className="text-white/40">→</span>
              <span className="min-w-0 text-right">
                <span className="block text-[9.5px] uppercase tracking-[0.08em] text-white/60">{tx("You get")}</span>
                <span className="home-serif block text-[19px] font-bold leading-tight text-[#F2C94C]">{formatPaise(t.get * 100)}</span>
              </span>
              <span className="home-wallet-tier-foot">
                <span className="text-[10px] text-white/60">+{formatPaise((t.get - t.pay) * 100)} {tx("extra")}</span>
                <Link href={`/wallet/topup?amount=${t.pay}`} className="home-wallet-btn">
                  {tx("Recharge now")}
                </Link>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
