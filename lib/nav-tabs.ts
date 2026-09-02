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
    label: "New Idea",
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
    label: "Professionalism",
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
    label: "Career",
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
