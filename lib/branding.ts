/**
 * The Branding studio: what LAWFIC builds, and what it has already shipped.
 *
 * Everything on /branding reads from here, so adding a new app or website to
 * the showcase is one entry below — no component changes.
 *
 * APP ICONS are loaded from Google Play's image CDN at view time. If an icon
 * fails to load (Google rotates these URLs occasionally), the tile falls back
 * to a lettered monogram, so a broken image is never shown. To refresh one,
 * open the app's Play page, copy the icon address, and paste it here.
 */

import { company } from "./company.ts";

export type ServiceId = "web" | "marketing" | "photoshoot" | "leads" | "saas";

export type StudioService = {
  id: ServiceId;
  /** Anchor on /branding. */
  anchor: string;
  name: string;
  line: string;
  includes: string[];
  /** Older menu anchors that should land on this service. */
  aliases?: string[];
};

export const STUDIO_SERVICES: StudioService[] = [
  {
    id: "web",
    anchor: "web-apps",
    name: "Website & app development",
    line: "Business sites, online stores and Android / iOS apps — designed, built and launched.",
    includes: [
      "Personal, static and dynamic business websites",
      "E-commerce stores with payments and order management",
      "Android and iOS apps, published on the Play Store and App Store",
      "Admin panels, hosting, domain and email set-up",
    ],
    aliases: ["personal-site", "static-site", "dynamic-site", "apps"],
  },
  {
    id: "marketing",
    anchor: "marketing",
    name: "Digital marketing",
    line: "Social media, search and ads that are measured, not guessed.",
    includes: [
      "Instagram, Facebook and LinkedIn content and management",
      "Google Business Profile and local search",
      "SEO for the website you already have",
      "Paid campaigns on Google and Meta, with monthly reporting",
    ],
    aliases: ["advertising"],
  },
  {
    id: "photoshoot",
    anchor: "photoshoot",
    name: "Brand photoshoot",
    line: "Product, food, property and team photography that makes the brand look like itself.",
    includes: [
      "Product and catalogue shoots for online stores",
      "Restaurant, café and hotel shoots",
      "Founder and team portraits",
      "Edited, sized and delivered for web, print and social",
    ],
  },
  {
    id: "leads",
    anchor: "leads",
    name: "Lead generation",
    line: "Landing pages, forms and follow-up that turn visitors into enquiries.",
    includes: [
      "Landing pages built for one offer each",
      "Lead forms and WhatsApp click-to-chat wired to your CRM or sheet",
      "Campaign tracking so you know which ad brought which enquiry",
      "Follow-up automation by email and WhatsApp",
    ],
  },
  {
    id: "saas",
    anchor: "saas",
    name: "SaaS",
    line: "Custom software for running the business — dashboards, bookings, billing, CRMs.",
    includes: [
      "Customer portals and dashboards",
      "Booking, billing and inventory systems",
      "Role-based access for staff",
      "Built on the same stack that runs lawfic.pro",
    ],
  },
];

export type AppProject = {
  name: string;
  category: string;
  line: string;
  playId: string;
  icon?: string;
  /** Two letters for the fallback tile. */
  mono: string;
};

const ICON = (path: string) => `https://play-lh.googleusercontent.com/${path}=w240-h480`;

export const APPS: AppProject[] = [
  {
    name: "Doodhvale",
    category: "Dairy delivery",
    line: "The mobile app for Doodhvale Farms, the farm-to-home dairy brand.",
    playId: "com.technologies.subtlelabs.doodhvale",
    mono: "Dv",
  },
  {
    name: "Krishna's Herbal & Ayurveda",
    category: "Shopping",
    line: "Herbal skin and hair care, ordered in a few taps.",
    playId: "app.krishnaayurveda.android",
    icon: ICON("gZlrJ33kWrrseAvBSK6ZTCcCS9GIoQGAlaTlBbhtjE4mNQEQj8hRICvJDpLsogD4BfH2PxCiD3memKt43KD2Gg"),
    mono: "Ka",
  },
  {
    name: "Cafe Desire Online",
    category: "Shopping",
    line: "Tea and coffee premixes and vending machines, sold online.",
    playId: "co.shopney.cafedesireonlinecom",
    icon: ICON("Lqo9hem1IsK_KMtlgKGDNkGMxuEKuPoYvZOBtA3tj40nWSKNYI323huftTJpFCLYfZMMevQFw57IAZreTWzv2Mw"),
    mono: "Cd",
  },
  {
    name: "Solihull's",
    category: "Shopping",
    line: "Listings, parts and alerts for Range Rover Classic owners.",
    playId: "co.shopney.solihullsapp",
    icon: ICON("pE-4YazowuQkHTInTsNh77Ip707l2h236Gz-ne68kbAPPPnBLouad5T9zZ8222K3lsxXsypHPHg1X-zbK4PMbA"),
    mono: "So",
  },
  {
    name: "Sudoku — Classic Number Puzzle",
    category: "Puzzle game",
    line: "Classic 9×9 sudoku with daily challenges and five levels.",
    playId: "com.diamantgames.sudoku",
    icon: ICON("rON0dvT88m4J9szp3fZasnbzbINN-QOmsocKqLAefPXX1aJ54H7fUw98wH84wr92BK6ka4m_xuXhitUz6Dwm"),
    mono: "Su",
  },
  {
    name: "Trade Master",
    category: "Finance",
    line: "Mobile trading for global assets.",
    playId: "com.masterw.app",
    icon: ICON("RuH2EqAgxJuMWTJV4CZLi2pIxyzYB7Xsrie4ptAkxS6jJiQrp85eYS8fPAE1dgyNiI74FqGMmN4DJS7ZjEMF"),
    mono: "Tm",
  },
  {
    name: "Pocket Forex",
    category: "Finance",
    line: "Trade signals, charts, alerts and trading bots in one app.",
    playId: "com.wattforex",
    icon: ICON("W7h6T9IizCp6d5gDQrY_vaUxWMTQB3uxtBNfpRErg13c-jf9GQQkVjJk0901iVY1p-iWaOHZId1shvufEfS1bL0"),
    mono: "Pf",
  },
];

/** Websites delivered to date, as the studio states it. The showreel shows
 *  the most recent of them (SITES below). */
export const WEBSITES_DELIVERED = "500+";

export type SiteProject = {
  domain: string;
  url: string;
  kind: string;
  line: string;
  /** A screenshot in /public (e.g. "/work/guleri.jpg"). When absent, a live
   *  capture is requested from WordPress's mShots service — see sitePreview. */
  shot?: string;
};

export const SITES: SiteProject[] = [
  { domain: "shop.doodhvalefarms.com", url: "https://shop.doodhvalefarms.com", kind: "E-commerce", line: "Farm ghee, oils and pantry staples, sold direct." },
  { domain: "guleri.com", url: "https://guleri.com", kind: "Fashion store", line: "Ethnic and western women's clothing online." },
  { domain: "garuda-ss.com", url: "https://garuda-ss.com", kind: "Fashion label", line: "Studio-made apparel, utility wear to experimental fashion." },
  { domain: "proutjournal.com", url: "https://proutjournal.com", kind: "Publishing", line: "A magazine on cooperative economics and Neo-Humanism." },
  { domain: "pahadtrust.org", url: "https://pahadtrust.org", kind: "Non-profit", line: "Development work in the hills." },
  { domain: "dashmeshtraders.com", url: "https://dashmeshtraders.com", kind: "Agri-trading", line: "A Punjab farm and trading agency for wheat, rice and pulses." },
  { domain: "jibhiadventure.com", url: "https://jibhiadventure.com", kind: "Travel", line: "Himalayan stays, treks and packages in Jibhi." },
  { domain: "lawfic.pro", url: "https://lawfic.pro", kind: "Platform", line: "This site — registrations, compliance and a prepaid wallet." },
  { domain: "kashmircultural.in", url: "https://kashmircultural.in", kind: "Crafts store", line: "Kashmiri crafts and culture." },
  { domain: "korahouse.in", url: "https://korahouse.in", kind: "Hospitality", line: "A guesthouse in McLeodganj." },
];

/**
 * The picture shown for a website in the work index.
 *
 * A screenshot committed under /public wins. Otherwise WordPress's free mShots
 * service captures the live homepage. The first request for a URL returns a
 * small "generating" placeholder while it renders, so the component checks the
 * width it gets back and keeps its lettered fallback until the real capture
 * (1000px wide) arrives. To pin a picture, save one to /public/work/ and set
 * `shot` on the site above.
 */
export function sitePreview(site: Pick<SiteProject, "url" | "shot">, width = 1000): string {
  if (site.shot) return site.shot;
  const h = Math.round((width * 10) / 16);
  return `https://s0.wp.com/mshots/v1/${encodeURIComponent(site.url)}?w=${width}&h=${h}&vpw=1440&vph=900`;
}

/** How a project runs — a real sequence, so it is numbered on the page. */
export const PROCESS: { title: string; line: string }[] = [
  { title: "Talk it through", line: "A call or a WhatsApp chat about what you need and what it has to do for the business." },
  { title: "Written quote", line: "Scope, price and timeline in writing. Nothing is charged before you agree to it." },
  { title: "Design", line: "You see the pages, screens or shoot plan and sign them off before anything is built." },
  { title: "Build and launch", line: "Built, tested on real phones, and put live on your domain or the Play Store." },
  { title: "After launch", line: "Hosting, updates and fixes, on a monthly plan or whenever you need them." },
];

/* ── the intro on /branding plays once per visit ────────────────────────── */

export const INTRO_KEY = "lawfic-studio-intro";

/** Runs before paint so a returning visitor never sees the curtain flash. */
export const INTRO_SEEN_SCRIPT = `try{if(sessionStorage.getItem("${INTRO_KEY}"))document.documentElement.classList.add("studio-intro-seen")}catch(e){}`;

/* ── the WhatsApp quote ─────────────────────────────────────────────────── */

export const BUDGETS = ["Under ₹25,000", "₹25,000 – ₹1 lakh", "₹1 – 5 lakh", "Above ₹5 lakh", "Not sure yet"] as const;
export const TIMELINES = ["As soon as possible", "Within a month", "1 – 3 months", "Flexible"] as const;

export type QuoteDraft = {
  services: ServiceId[];
  budget?: string;
  timeline?: string;
  name?: string;
  business?: string;
  note?: string;
};

export function quoteMessage(q: QuoteDraft): string {
  const names = STUDIO_SERVICES.filter((s) => q.services.includes(s.id)).map((s) => s.name);
  const lines = [`Hello LAWFIC, I'd like a quote${q.name?.trim() ? ` — this is ${q.name.trim()}` : ""}.`];
  if (q.business?.trim()) lines.push(`Business: ${q.business.trim()}`);
  lines.push(`Looking for: ${names.length ? names.join(", ") : "not sure yet — happy to talk it through"}`);
  if (q.budget) lines.push(`Budget: ${q.budget}`);
  if (q.timeline) lines.push(`Timeline: ${q.timeline}`);
  if (q.note?.trim()) lines.push(`Notes: ${q.note.trim()}`);
  return lines.join("\n");
}

export function whatsappHref(text: string): string | null {
  const n = (company.whatsapp ?? "").replace(/\D/g, "");
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
