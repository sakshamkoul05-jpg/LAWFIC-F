import { documents } from "./documents";

export type SubTab = {
  label: string;
  href: string;
  blurb?: string;
  /** optional group header shown above the tab in a dropdown */
  group?: string;
};

export type NavTab = {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  /** true when the tab has a real, written page */
  live: boolean;
  /** sub-tabs shown in the hover dropdown (empty = no dropdown) */
  sub: SubTab[];
  tagline?: string;
};

const serviceHref = (slug: string) => `/services/${slug}`;

const documentSub: SubTab[] = documents.map((d) => ({
  label: d.label,
  href: d.href,
  group: d.group,
}));

export const classicTabs: NavTab[] = [
  {
    id: "home",
    label: "Home",
    sublabel: "Tab 1",
    href: "/",
    live: true,
    tagline: "Registrations, licences and compliance, without the surprise invoice.",
    sub: [
      { label: "Overview", href: "/" },
      { label: "Service Categories", href: "/#categories" },
      { label: "Live Services", href: "/#live-services" },
      { label: "Pricing Plans", href: "/pricing" },
    ],
  },
  {
    id: "about",
    label: "About",
    sublabel: "Tab 2",
    href: "/about",
    live: true,
    tagline: "A private consultancy that catches the problems before the file goes in.",
    sub: [
      { label: "Who we are", href: "/about" },
      { label: "How we work", href: "/about#how-we-work" },
      { label: "What we are not", href: "/about#what-we-are-not" },
      { label: "Our principles", href: "/about#principles" },
    ],
  },
  {
    id: "document",
    label: "Document",
    sublabel: "Tab 3",
    href: "/document",
    live: true,
    tagline: "Every identity card, certificate, agreement and registration we prepare.",
    sub: documentSub,
  },
  {
    id: "admission",
    label: "Admission",
    sublabel: "Tab 4",
    href: "/admission",
    live: false,
    tagline: "College and course admissions guidance.",
    sub: [
      { label: "Engineering", href: "/admission#engineering" },
      { label: "Medical", href: "/admission#medical" },
      { label: "Management (MBA)", href: "/admission#management" },
      { label: "Law", href: "/admission#law" },
    ],
  },
  {
    id: "education",
    label: "Education",
    sublabel: "Tab 5",
    href: "/education",
    live: false,
    tagline: "Courses, certifications and skills to grow your career.",
    sub: [
      { label: "Certifications", href: "/education#certifications" },
      { label: "Skills", href: "/education#skills" },
      { label: "Workshops", href: "/education#workshops" },
      { label: "Study materials", href: "/education#materials" },
    ],
  },
  {
    id: "startup",
    label: "Startup",
    sublabel: "Tab 6",
    href: "/startup",
    live: true,
    tagline: "From idea to registered business — MSME/Udyam and incorporation.",
    sub: [
      { label: "MSME / Udyam", href: serviceHref("msme-udyam") },
      { label: "Private Limited", href: "/startup#private-limited" },
      { label: "LLP", href: "/startup#llp" },
      { label: "One Person Company", href: "/startup#opc" },
      { label: "Partnership", href: "/startup#partnership" },
      { label: "Proprietorship", href: "/startup#proprietorship" },
    ],
  },
  {
    id: "business",
    label: "Business",
    sublabel: "Tab 7",
    href: "/business",
    live: false,
    tagline: "Registration, compliance and permits to run your business legally.",
    sub: [
      { label: "Business Registration", href: "/business#registration" },
      { label: "GST Returns", href: "/business#gst-returns" },
      { label: "Import Export (IEC)", href: "/business#iec" },
      { label: "Payroll & PF/ESI", href: "/business#payroll" },
      { label: "ROC Filings", href: "/business#roc" },
    ],
  },
  {
    id: "jobs",
    label: "Jobs",
    sublabel: "Tab 8",
    href: "/jobs",
    live: true,
    tagline: "Openings matched to your city, your trade and your experience.",
    sub: [
      { label: "Browse jobs", href: "/jobs" },
      { label: "Fresher openings", href: "/jobs#freshers" },
      { label: "Government jobs", href: "/jobs#government" },
      { label: "Post a vacancy", href: "/jobs#post" },
    ],
  },
  {
    id: "branding",
    label: "Branding",
    sublabel: "Tab 9",
    href: "/branding",
    live: false,
    tagline: "Trademark, logo and brand protection services.",
    sub: [
      { label: "Trademark", href: "/branding#trademark" },
      { label: "Logo creation", href: "/branding#logo" },
      { label: "Brand strategy", href: "/branding#strategy" },
      { label: "Copyright", href: "/branding#copyright" },
    ],
  },
  {
    id: "partner",
    label: "Partner",
    sublabel: "Tab 10",
    href: "/partner",
    live: false,
    tagline: "Partner with LAWFIC and grow together.",
    sub: [
      { label: "Become a partner", href: "/partner#become" },
      { label: "Channel partners", href: "/partner#channel" },
      { label: "Referral program", href: "/partner#referral" },
      { label: "Agent network", href: "/partner#agent" },
    ],
  },
  {
    id: "investment",
    label: "Investment",
    sublabel: "Tab 11",
    href: "/investment",
    live: false,
    tagline: "Investment plans and financial growth insights.",
    sub: [
      { label: "Plans", href: "/investment#plans" },
      { label: "Mutual funds", href: "/investment#mutual-funds" },
      { label: "Stocks", href: "/investment#stocks" },
      { label: "Advisory", href: "/investment#advisory" },
    ],
  },
  {
    id: "lawfic",
    label: "LAWFiC",
    sublabel: "Tab 12",
    href: "/lawfic",
    live: false,
    tagline: "Everything LAWFIC — wallet, orders, plans and membership.",
    sub: [
      { label: "Wallet", href: "/wallet" },
      { label: "Your filings", href: "/orders" },
      { label: "Membership", href: "/pricing" },
      { label: "About LAWFIC", href: "/about" },
    ],
  },
  {
    id: "new-idea",
    label: "Your Idea",
    sublabel: "Tab 13",
    href: "/new-idea",
    live: false,
    tagline: "Have an idea? Tell us — we help you turn it into a business.",
    sub: [
      { label: "Submit an idea", href: "/new-idea#submit" },
      { label: "Idea to business", href: "/new-idea#to-business" },
      { label: "Funding", href: "/new-idea#funding" },
      { label: "Mentorship", href: "/new-idea#mentorship" },
    ],
  },
  {
    id: "blogs",
    label: "Blogs",
    sublabel: "Tab 14",
    href: "/blogs",
    live: false,
    tagline: "Guides, news and insights on registrations and compliance.",
    sub: [
      { label: "Latest posts", href: "/blogs#latest" },
      { label: "Guides", href: "/blogs#guides" },
      { label: "News", href: "/blogs#news" },
      { label: "Success stories", href: "/blogs#stories" },
    ],
  },
  {
    id: "professionalism",
    label: "Profession",
    sublabel: "Tab 15",
    href: "/professionalism",
    live: false,
    tagline: "Codes of conduct, ethics and standards of service.",
    sub: [
      { label: "Our standards", href: "/professionalism#standards" },
      { label: "Code of conduct", href: "/professionalism#conduct" },
      { label: "Customer promise", href: "/professionalism#promise" },
    ],
  },
  {
    id: "career",
    label: "Your Career",
    sublabel: "Tab 16",
    href: "/career",
    live: false,
    tagline: "Build your career — path, coaching and growth.",
    sub: [
      { label: "Career paths", href: "/career#paths" },
      { label: "Coaching", href: "/career#coaching" },
      { label: "Resume help", href: "/career#resume" },
      { label: "Interviews", href: "/career#interviews" },
    ],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    sublabel: "Tab 17",
    href: "/entertainment",
    live: false,
    tagline: "Entertainment, media and event services.",
    sub: [
      { label: "Events", href: "/entertainment#events" },
      { label: "Media", href: "/entertainment#media" },
      { label: "Content", href: "/entertainment#content" },
    ],
  },
  {
    id: "gift",
    label: "Gift",
    sublabel: "Tab 18",
    href: "/gift",
    live: false,
    tagline: "Gift cards, vouchers and special offers.",
    sub: [
      { label: "Gift cards", href: "/gift#cards" },
      { label: "Vouchers", href: "/gift#vouchers" },
      { label: "Special offers", href: "/gift#offers" },
    ],
  },
  {
    id: "our-store",
    label: "Our Store",
    sublabel: "Tab 19",
    href: "/our-store",
    live: false,
    tagline: "Official LAWFIC merchandise and stationery.",
    sub: [
      { label: "Merchandise", href: "/our-store#merch" },
      { label: "Stationery", href: "/our-store#stationery" },
      { label: "Business kits", href: "/our-store#kits" },
    ],
  },
  {
    id: "instant-help",
    label: "Instant Help",
    sublabel: "Tab 20",
    href: "/instant-help",
    live: false,
    tagline: "Immediate support — chat, call and FAQs.",
    sub: [
      { label: "Live chat", href: "/instant-help#chat" },
      { label: "FAQs", href: "/instant-help#faqs" },
      { label: "Call us", href: "/instant-help#call" },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    sublabel: "Tab 21",
    href: "/contact",
    live: true,
    tagline: "A real person, in working hours, who can see your file.",
    sub: [
      { label: "Get in touch", href: "/contact" },
      { label: "Grievance officer", href: "/contact#grievance" },
      { label: "Your filings", href: "/orders" },
    ],
  },
  {
    id: "my-money",
    label: "My Money",
    sublabel: "Tab 11",
    href: "/wallet",
    live: true,
    tagline: "Your LAWFIC balance, your statement and everything it has paid for.",
    sub: [
      { label: "Wallet balance", href: "/wallet" },
      { label: "Add money", href: "/wallet/topup" },
      { label: "Transactions", href: "/wallet/transactions" },
      { label: "Customise your wallet", href: "/wallet/customize" },
    ],
  },
  {
    id: "your-ad",
    label: "Your Add",
    sublabel: "Tab 17",
    href: "/your-ad",
    live: false,
    tagline: "Put your business in front of the people already looking for it.",
    sub: [
      { label: "Advertise on LAWFIC", href: "/your-ad" },
      { label: "Local listings", href: "/your-ad#local" },
      { label: "Rates", href: "/your-ad#rates" },
    ],
  },
  {
    id: "aakhri-umeed",
    label: "Aakhri Umeed",
    sublabel: "Tab 22",
    href: "/aakhri-umeed",
    live: false,
    tagline: "The cases nobody else would take on.",
    sub: [
      { label: "What this is", href: "/aakhri-umeed" },
      { label: "Ask for help", href: "/aakhri-umeed#ask" },
    ],
  },
  {
    id: "social",
    label: "Social",
    sublabel: "Tab 23",
    href: "/social",
    live: false,
    tagline: "Real social work, for a smiling India.",
    sub: [
      { label: "Our work", href: "/social" },
      { label: "Volunteer", href: "/social#volunteer" },
    ],
  },
  {
    id: "press",
    label: "Press",
    sublabel: "Tab 24",
    href: "/press",
    live: false,
    tagline: "LAWFIC in the news, and how to reach us about it.",
    sub: [
      { label: "Coverage", href: "/press" },
      { label: "Media enquiries", href: "/press#enquiries" },
    ],
  },
  {
    id: "travel",
    label: "Travel",
    sublabel: "Tab 26",
    href: "/travel",
    live: false,
    tagline: "Passports, visas and everything else a journey needs on paper.",
    sub: [
      { label: "Passport", href: "/document/indian-passport" },
      { label: "Visa help", href: "/travel#visa" },
    ],
  },
  {
    id: "lawfic-club",
    label: "Lawfic Club",
    sublabel: "Tab 27",
    href: "/lawfic-club",
    live: false,
    tagline: "Membership, and what comes with it.",
    sub: [
      { label: "About the club", href: "/lawfic-club" },
      { label: "Benefits", href: "/lawfic-club#benefits" },
    ],
  },
];

export function getTabByHref(pathname: string): NavTab | undefined {
  // match exact, then by prefix (e.g. /services/aadhaar belongs to Document)
  const exact = classicTabs.find((t) => t.href === pathname);
  if (exact) return exact;
  return classicTabs.find((t) => t.href !== "/" && pathname.startsWith(t.href));
}

export const liveTabHrefs = classicTabs
  .filter((t) => t.live)
  .map((t) => t.href);

/**
 * A colour per section, for the border each tab carries in the strip.
 *
 * Twenty-one tabs on two rows is a lot of identical text, and the eye has
 * nothing to navigate by — the previous strip was deliberately quiet, which
 * works for eleven items in one line and stops working when there are two rows
 * of them. A colour gives every section a fixed identity you can learn and then
 * aim at, which is the only thing that makes a bar this dense usable.
 *
 * Chosen as muted jewel tones rather than saturated ones: they sit at roughly
 * the same lightness as each other and as the gold the brand already uses, so
 * the row reads as one considered set instead of twenty-one competing signals.
 * Anything brighter turns navigation into a toy shelf.
 */
export const TAB_ACCENT: Record<string, string> = {
  home: "#D0AE55",
  about: "#8FB0C9",
  document: "#C58F6B",
  admission: "#9BAF7E",
  education: "#B08FC9",
  startup: "#E0A05C",
  business: "#7FA8A0",
  jobs: "#C98F8F",
  branding: "#D6A55C",
  partner: "#8FA3C9",
  investment: "#A8C98F",
  lawfic: "#D0AE55",
  "new-idea": "#C9A88F",
  blogs: "#9FC9C4",
  professionalism: "#B9927E",
  career: "#8FC9A8",
  entertainment: "#C98FB0",
  gift: "#D69A7E",
  "our-store": "#A9C97E",
  "instant-help": "#C97E7E",
  contact: "#9E9EC9",
  "my-money": "#C9B87E",
  "your-ad": "#8FC9C9",
  "aakhri-umeed": "#C98F9E",
  social: "#9EC98F",
  press: "#A8A8BF",
  travel: "#7EB6C9",
  "lawfic-club": "#C9A85C",
};

export function tabAccent(id: string): string {
  return TAB_ACCENT[id] ?? "#D0AE55";
}

/**
 * The strip runs on two rows, in the order the client's blueprint sets out:
 * fifteen sections above, twelve below.
 *
 * The names, the order and the split are theirs, not ours — "Tab 1" to
 * "Tab 27" in the sheet — so this list is transcribed rather than designed.
 * Contact is no longer a tab, because it is not one of the twenty-seven; the
 * page stays and is reached from Instant Help and the footer.
 *
 * Both rows span the same width and their cells divide it exactly: fifteen and
 * twelve both go into sixty, so the grid is sixty columns wide and the rows
 * take four and five of them. That is what makes the two rows line up at every
 * fifth boundary instead of drifting apart, which is what happened when they
 * were eleven and ten columns of different widths with a half-cell of inset
 * bodged in to disguise it.
 */
const ORDER_ROW_ONE = [
  "home",
  "about",
  "document",
  "admission",
  "education",
  "startup",
  "business",
  "jobs",
  "professionalism",
  "branding",
  "my-money",
  "investment",
  "partner",
  "instant-help",
  "lawfic",
];

const ORDER_ROW_TWO = [
  "new-idea",
  "your-ad",
  "career",
  "entertainment",
  "our-store",
  "gift",
  "aakhri-umeed",
  "social",
  "press",
  "blogs",
  "travel",
  "lawfic-club",
];

const byId = (id: string) => {
  const tab = classicTabs.find((t) => t.id === id);
  if (!tab) throw new Error(`nav-tabs: no tab "${id}"`);
  return tab;
};

export const TABS_ROW_ONE = ORDER_ROW_ONE.map(byId);
export const TABS_ROW_TWO = ORDER_ROW_TWO.map(byId);

/** The number of grid columns each row's cells span. 15 x 4 = 12 x 5 = 60. */
export const TAB_GRID_COLUMNS = 60;
export const ROW_ONE_SPAN = TAB_GRID_COLUMNS / ORDER_ROW_ONE.length;
export const ROW_TWO_SPAN = TAB_GRID_COLUMNS / ORDER_ROW_TWO.length;
